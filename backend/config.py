"""
Sentinel Configuration — centralized settings management.
Loads from environment variables and .env file.
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # --- LLM Configuration ---
    llm_provider: str = Field(
        default="openai",
        description="LLM provider: 'openai', 'anthropic', or 'ollama'"
    )
    openai_api_key: Optional[str] = Field(default=None)
    openai_model: str = Field(default="gpt-4o")
    anthropic_api_key: Optional[str] = Field(default=None)
    anthropic_model: str = Field(default="claude-sonnet-4-20250514")
    ollama_base_url: str = Field(default="http://localhost:11434")
    ollama_model: str = Field(default="llama3.1")

    # --- GitHub Configuration ---
    github_token: Optional[str] = Field(default=None)

    # --- Docker Sandbox ---
    sandbox_enabled: bool = Field(default=False)
    sandbox_timeout: int = Field(default=120, description="Sandbox timeout in seconds")

    # --- Storage ---
    db_path: str = Field(default="sentinel.db")

    # --- Server ---
    host: str = Field(default="0.0.0.0")
    port: int = Field(default=8000)
    cors_origins: list[str] = Field(default=["http://localhost:5173", "http://localhost:8080", "http://localhost:3000"])

    # --- Working Directory ---
    work_dir: str = Field(default="/tmp/sentinel-workspaces")

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "env_prefix": "SENTINEL_",
        "case_sensitive": False,
    }

    def get_llm(self):
        """Get the configured LLM instance."""
        if self.llm_provider == "openai":
            if not self.openai_api_key:
                raise ValueError("SENTINEL_OPENAI_API_KEY is required when using OpenAI provider")
            from langchain_openai import ChatOpenAI
            return ChatOpenAI(
                model=self.openai_model,
                api_key=self.openai_api_key,
                temperature=0.1,
            )
        elif self.llm_provider == "anthropic":
            if not self.anthropic_api_key:
                raise ValueError("SENTINEL_ANTHROPIC_API_KEY is required when using Anthropic provider")
            from langchain_anthropic import ChatAnthropic
            return ChatAnthropic(
                model=self.anthropic_model,
                api_key=self.anthropic_api_key,
                temperature=0.1,
            )
        elif self.llm_provider == "ollama":
            from langchain_community.chat_models import ChatOllama
            return ChatOllama(
                model=self.ollama_model,
                base_url=self.ollama_base_url,
                temperature=0.1,
            )
        else:
            raise ValueError(f"Unknown LLM provider: {self.llm_provider}")


# Singleton
_settings: Optional[Settings] = None


def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings


def update_settings(**kwargs) -> Settings:
    """Update settings at runtime (e.g., from the Settings UI)."""
    global _settings
    current = get_settings()
    updated = current.model_copy(update=kwargs)
    _settings = updated
    return _settings
