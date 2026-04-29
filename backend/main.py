"""
Sentinel Backend — FastAPI server with WebSocket streaming and REST API.
"""

import json
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from config import get_settings, update_settings
from models.pipeline import PipelineMessage
from models.incident import IncidentCreate
from services.storage import StorageService
from agent.orchestrator import Orchestrator


# ─── Lifespan ───
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize services on startup."""
    settings = get_settings()
    storage = StorageService(db_path=settings.db_path)
    await storage.initialize()
    print(f"✓ Sentinel backend started on {settings.host}:{settings.port}")
    print(f"  LLM Provider: {settings.llm_provider}")
    print(f"  Sandbox: {'enabled' if settings.sandbox_enabled else 'disabled'}")
    print(f"  GitHub: {'configured' if settings.github_token else 'not configured'}")
    yield


# ─── App ───
app = FastAPI(
    title="Sentinel",
    description="Autonomous Incident-to-Fix Engineering Agent",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── WebSocket: Pipeline Execution ───
@app.websocket("/ws/pipeline")
async def pipeline_websocket(websocket: WebSocket):
    """WebSocket endpoint for running the autonomous pipeline.

    Client sends: { "description": "...", "repo_url": "...", "environment": "..." }
    Server streams: PipelineMessage objects as JSON
    """
    await websocket.accept()

    try:
        # Wait for the incident payload
        data = await websocket.receive_text()
        payload = json.loads(data)

        description = payload.get("description", "")
        repo_url = payload.get("repo_url", "")
        environment = payload.get("environment", "production")

        if not description or not repo_url:
            await websocket.send_json({
                "type": "error",
                "data": {"error": "description and repo_url are required"},
            })
            await websocket.close()
            return

        # Define the send callback
        async def send_message(msg: PipelineMessage):
            try:
                await websocket.send_json(msg.model_dump())
            except Exception:
                pass  # Connection may have been closed

        # Run the pipeline
        orchestrator = Orchestrator()
        await orchestrator.run(description, repo_url, environment, send_message)

    except WebSocketDisconnect:
        print("Client disconnected from pipeline WebSocket")
    except json.JSONDecodeError:
        await websocket.send_json({
            "type": "error",
            "data": {"error": "Invalid JSON payload"},
        })
    except Exception as e:
        try:
            await websocket.send_json({
                "type": "error",
                "data": {"error": str(e)},
            })
        except Exception:
            pass
    finally:
        try:
            await websocket.close()
        except Exception:
            pass


# ─── REST: Incidents ───
@app.get("/api/incidents")
async def list_incidents(limit: int = 50, offset: int = 0):
    """List all incidents."""
    storage = StorageService(db_path=get_settings().db_path)
    incidents = await storage.list_incidents(limit=limit, offset=offset)
    count = await storage.get_incident_count()
    return {
        "incidents": [i.model_dump() for i in incidents],
        "total": count,
    }


@app.get("/api/incidents/{incident_id}")
async def get_incident(incident_id: str):
    """Get a single incident by ID."""
    storage = StorageService(db_path=get_settings().db_path)
    incident = await storage.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident.model_dump()


# ─── REST: Settings ───
class SettingsUpdate(BaseModel):
    llm_provider: Optional[str] = None
    groq_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    ollama_base_url: Optional[str] = None
    ollama_model: Optional[str] = None
    groq_model: Optional[str] = None
    github_token: Optional[str] = None
    sandbox_enabled: Optional[bool] = None


@app.get("/api/settings")
async def get_current_settings():
    """Get current settings (API keys are masked)."""
    s = get_settings()
    return {
        "llm_provider": s.llm_provider,
        "groq_api_key": _mask(s.groq_api_key),
        "groq_model": s.groq_model,
        "openai_api_key": _mask(s.openai_api_key),
        "openai_model": s.openai_model,
        "anthropic_api_key": _mask(s.anthropic_api_key),
        "anthropic_model": s.anthropic_model,
        "ollama_base_url": s.ollama_base_url,
        "ollama_model": s.ollama_model,
        "github_token": _mask(s.github_token),
        "sandbox_enabled": s.sandbox_enabled,
    }


@app.put("/api/settings")
async def update_current_settings(body: SettingsUpdate):
    """Update settings at runtime."""
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No settings to update")

    updated = update_settings(**updates)
    return {"status": "ok", "message": "Settings updated"}


# ─── REST: Health ───
@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    s = get_settings()
    llm_configured = False
    if s.llm_provider == "groq" and s.groq_api_key:
        llm_configured = True
    elif s.llm_provider == "openai" and s.openai_api_key:
        llm_configured = True
    elif s.llm_provider == "anthropic" and s.anthropic_api_key:
        llm_configured = True
    elif s.llm_provider == "ollama":
        llm_configured = True

    return {
        "status": "ok",
        "llm_provider": s.llm_provider,
        "llm_configured": llm_configured,
        "github_configured": bool(s.github_token),
        "sandbox_enabled": s.sandbox_enabled,
    }


def _mask(value: Optional[str]) -> Optional[str]:
    """Mask an API key for display."""
    if not value:
        return None
    if len(value) <= 8:
        return "****"
    return value[:4] + "****" + value[-4:]


# ─── Entrypoint ───
if __name__ == "__main__":
    import uvicorn
    s = get_settings()
    uvicorn.run("main:app", host=s.host, port=s.port, reload=True)
