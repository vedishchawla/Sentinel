# Sentinel — Autonomous Incident-to-Fix Engineering Agent

> An AI-powered engineering agent that autonomously resolves software incidents — from interpreting natural language tickets to applying verified fixes and generating production-ready pull requests.

---

## ✨ What It Does

Sentinel takes a bug report or incident description and autonomously:

1. 🧠 **Understands** the ticket — extracts error type, affected module, severity
2. 🔍 **Analyzes** the codebase — clones the repo, maps file structure, finds relevant files
3. 🎯 **Detects** root cause — reads source code, identifies the exact bug pattern
4. 🛠️ **Generates** a fix — creates a minimal, safe patch
5. 🧪 **Creates** tests — generates regression tests for the fix
6. 📦 **Validates** in sandbox — runs tests in isolated Docker containers
7. ✅ **Verifies** everything — syntax, linting, full test suite
8. 🔀 **Opens a PR** — creates a branch and pull request on GitHub

All with **zero human intervention** required.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (frontend)
- Python 3.9+ (backend)
- Docker Desktop (optional, for sandbox testing)
- [Groq API key](https://console.groq.com) (free)

### 1. Clone & Setup

```bash
git clone https://github.com/vedishchawla/Sentinel.git
cd Sentinel
```

### 2. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Configure
cp .env.example .env
# Edit .env and add your Groq API key (free from console.groq.com)

# Run
python main.py
```

The backend runs at `http://localhost:8000`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:8080`.

### 4. Open & Use

1. Go to `http://localhost:8080`
2. Click **Dashboard**
3. Describe an incident or load a sample
4. Enter a GitHub repo URL
5. Click **Run Autonomous Fix**
6. Watch the AI work in real-time 🎬

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Frontend (React/Vite)                   │
│  Landing Page ─── Dashboard ─── Settings ─── History      │
│       │               │              │                    │
│       │          WebSocket       REST API                 │
└───────┼───────────────┼──────────────┼────────────────────┘
        │               │              │
┌───────┼───────────────┼──────────────┼────────────────────┐
│       │          FastAPI Server (Python)                   │
│       │               │              │                    │
│  ┌────┴───────────────┴──────────────┴────────────────┐   │
│  │              Agent Orchestrator                     │   │
│  │                                                     │   │
│  │  Ticket Parser ──► Codebase Analyzer ──► Root Cause │   │
│  │       │                    │                  │      │   │
│  │       ▼                    ▼                  ▼      │   │
│  │  Fix Generator ──► Test Generator ──► Sandbox Runner│   │
│  │       │                    │                  │      │   │
│  │       ▼                    ▼                  ▼      │   │
│  │              PR Creator (GitHub API)                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                            │
│  Services: GitHub API │ Docker Sandbox │ SQLite Storage    │
└────────────────────────────────────────────────────────────┘
        │                    │
        ▼                    ▼
   GitHub API          Docker Engine
  (clone, PR)        (isolated testing)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Vite, Tailwind CSS, Framer Motion |
| UI Components | shadcn/ui, Lucide Icons |
| Backend | Python, FastAPI, LangChain |
| LLM | Groq (Llama 3.3 70B) — free, with OpenAI/Anthropic/Ollama options |
| Sandbox | Docker (isolated build/test execution) |
| Storage | SQLite (incident history) |
| Integration | GitHub API (repo analysis + PR creation) |
| Communication | WebSocket (real-time pipeline streaming) |

---

## ⚙️ Configuration

All settings can be configured via:
- **Settings UI** — `http://localhost:8080/settings`
- **Environment variables** — `backend/.env`

### LLM Providers

| Provider | Cost | Setup |
|----------|------|-------|
| **Groq** (default) | Free | Get key at [console.groq.com](https://console.groq.com) |
| OpenAI | Paid | `SENTINEL_OPENAI_API_KEY` |
| Anthropic | Paid | `SENTINEL_ANTHROPIC_API_KEY` |
| Ollama | Free (local) | Install Ollama, no key needed |

### Optional Features

- **GitHub Token** — Enable automatic PR creation (`SENTINEL_GITHUB_TOKEN`)
- **Docker Sandbox** — Run tests in isolation (`SENTINEL_SANDBOX_ENABLED=true`)

---

## 📁 Project Structure

```
Sentinel/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── landing/        # Cinematic scroll-driven landing page
│   │   │   ├── ui/             # shadcn/ui component library
│   │   │   └── ...             # Dashboard panel components
│   │   ├── pages/
│   │   │   ├── Landing.tsx     # Landing page
│   │   │   ├── Index.tsx       # Dashboard
│   │   │   ├── Settings.tsx    # Configuration
│   │   │   └── Incidents.tsx   # History
│   │   ├── hooks/
│   │   │   ├── useAgentWorkflow.ts  # Pipeline state management
│   │   │   └── useWebSocket.ts      # Real-time backend connection
│   │   └── lib/
│   │       └── api.ts          # REST API client
│   └── package.json
│
├── backend/
│   ├── main.py                 # FastAPI server
│   ├── config.py               # Settings management
│   ├── agent/
│   │   ├── orchestrator.py     # Pipeline orchestrator
│   │   └── steps/              # 7 autonomous agent steps
│   ├── models/                 # Pydantic data models
│   ├── services/
│   │   ├── github_service.py   # GitHub API wrapper
│   │   └── storage.py          # SQLite persistence
│   └── requirements.txt
│
└── README.md
```

---

## ✨ Key Highlights

- **Fully Autonomous** — No human intervention from ticket to PR
- **Real-Time Streaming** — Watch the agent think, analyze, and fix via WebSocket
- **Transparent Reasoning** — Every agent decision visible in the Reasoning Panel
- **Safe by Design** — Minimal patches, Docker-sandboxed validation
- **Free to Run** — Groq's free LLM tier, no credit card needed
- **Production-Ready Output** — Clean PRs with commit messages, tests, and reports

---

*Built by Vedish Chawla*
