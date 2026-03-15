# Sentinel — Autonomous Incident-to-Fix Engineering Agent

**Team:** Code Paglus | **Hackathon:** Syrus 2026

## Problem Statement & Track

**Track:** Track 1 — Agentic AI [Rezinix AI]

**Problem Statement:** PS-02 — Autonomous Incident-to-Fix Engineering Agent

> Build an Agentic Engineering Platform that autonomously resolves software incidents — from interpreting natural language tickets to applying verified fixes and generating production-ready changes.

**Target Repository:** [Rezinix-AI/shopstack-platform](https://github.com/Rezinix-AI/shopstack-platform)

---

## 🔗 Links

- **PPT:** [View Presentation](https://www.canva.com/design/DAHD6M28dcg/3vJFaGACt_xKDyxK6zZGxg/view?utm_content=DAHD6M28dcg&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=hd7ac8d0fb8#5)
- **Video Demo:** [Watch Video](https://drive.google.com/file/d/1im4f4QB5FNfkimdd7uKNqqiBfIlzX1ql/view?usp=sharing)
  > 📌 *For best quality, download the video instead of streaming in Google Drive preview.*

---

## Overview

Sentinel is an autonomous engineering agent that parses natural language incident tickets, analyzes codebases to detect root causes, applies minimal safe fixes, validates them in sandboxed environments, and generates structured resolution reports — all with minimal human involvement.

### Key Features

- 🧠 **Incident Understanding** — Interprets tickets from Jira/Slack, extracts error type, affected components, environment, and relevant commits
- 🔍 **Codebase Analysis** — Detects logical errors, dependency conflicts, configuration issues, and identifies relevant stack traces
- 📚 **Research & Knowledge Retrieval** — Retrieves documentation and error references when root cause is unclear
- 🛠️ **Autonomous Fix Application** — Applies safe, minimal fixes to code, configs, and dependencies with verified patches
- 🧪 **Validation & Testing** — Generates test cases, runs test suites in sandboxed environments, prevents regressions
- 📊 **Resolution Reporting** — Generates structured reports with root cause analysis, changes made, validation results, and confidence score
- 🔀 **GitHub PR Automation** — Auto-creates branches and pull requests

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Vite, Tailwind CSS, Framer Motion |
| UI Components | shadcn/ui, Lucide Icons |
| Backend | Python, LangChain, OpenAI GPT |
| Sandbox | Docker (isolated build/test execution) |
| Integration | GitHub API (branch + PR creation) |
| Target Repo | [shopstack-platform](https://github.com/Rezinix-AI/shopstack-platform) |

---

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

The app runs at `http://localhost:8080`.

---

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── landing/        # Cinematic scroll-driven landing page scenes
│   │   ├── ui/             # shadcn/ui component library
│   │   ├── InteractiveGrid.tsx   # Canvas-based mouse-reactive grid
│   │   ├── CursorGlow.tsx        # Cursor-following radial glow effect
│   │   └── ...             # Dashboard panel components
│   ├── pages/
│   │   ├── Landing.tsx     # Landing page (scroll-driven)
│   │   ├── Index.tsx       # Dashboard page
│   │   ├── Incidents.tsx   # Incident history
│   │   └── NotFound.tsx    # 404 page
│   ├── hooks/              # Custom React hooks
│   └── index.css           # Global styles + Tailwind config
├── index.html
├── tailwind.config.ts
└── package.json
```

---
