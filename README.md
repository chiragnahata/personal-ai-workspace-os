# Personal AI Workspace OS (Desktop)

<p align="center">
        <strong>Local-first, Jarvis‑style AI operator for YOUR machine.</strong><br/>
        Conversational control over files, notes, tasks, and email with secure local tool execution & offline LLMs.
</p>

<p align="center">
        <em>Mission: Give you an extensible personal operator that actually does work for you – without shipping your data to the cloud.</em>
</p>

<p align="center">
        <!-- Badges (activate when infra ready) -->
        <a href="#license"><img alt="License" src="https://img.shields.io/badge/license-MIT-blue" /></a>
        <a href="#roadmap"><img alt="Status" src="https://img.shields.io/badge/status-prototype-orange" /></a>
        <a href="#security--privacy-model-planned"><img alt="Local First" src="https://img.shields.io/badge/local-first-success" /></a>
</p>

---

## Table of Contents
1. [Feature Highlights](#feature-highlights)
2. [Why Local?](#why-local)
3. [Design Principles](#design-principles)
4. [Architecture](#high-level-architecture)
5. [Core Concepts](#core-concepts)
6. [Repository Structure](#repository-structure)
7. [Development Quickstart](#development-quickstart)
8. [Tool Invocation & Spec](#tool-invocation--spec)
9. [Desktop Packaging (Planned)](#planned-desktop-packaging)
10. [Security & Privacy](#security--privacy-model-planned)
11. [Roadmap](#roadmap-detailed)
12. [Extending (Add a Tool)](#extending-adding-a-tool-example)
13. [FAQ](#faq)
14. [Contributing](#contributing-early-stage)
15. [Design / Future Ideas](#future-ideas)
16. [Changelog](#changelog)
17. [License](#license)
18. [Disclaimer](#disclaimer)

---

## Feature Highlights
| Area | Current | Next Up |
|------|---------|---------|
| Chat / Agent | WebSocket echo + tool invocation via `!tool` | Streaming LLM + function calling |
| Tools | `ping`, `file_list` | file_read/write, notes, tasks, email mock |
| Autonomy | Manual commands | Guided multi-step plans with approval gates |
| LLM | Placeholder echo | Local model (Ollama / GGUF) then optional remote fallback |
| Persistence | In‑memory session | SQLite (sessions, notes, tasks, settings) |
| Desktop | Planned (Tauri/Electron) | Signed builds / auto‑update |
| Security | Local only dev mode | Sandboxed tool execution / permission prompts |

## Why Local?
1. Privacy: Your inbox, documents, and notes never leave your device.
2. Latency: Sub‑second tool round trips vs network waits.
3. Cost: Zero token charges for local models.
4. Extensibility: Add niche tools instantly (scripts, CLIs, domain datasets).

## Design Principles
1. Local-first by default (remote = explicit opt-in).
2. Minimal friction: install & get value in under 2 minutes.
3. Clear boundaries: explicit tool permission prompts before write/exec.
4. Human-in-the-loop: autonomy only with checkpoints & diff previews.
5. Composable primitives > monolithic agent logic.
6. Deterministic core + probabilistic augmentation (LLM only where needed).
7. Auditability: every tool call loggable & reproducible.

## High-Level Architecture
```
┌─────────────────────────────┐       HTTP / WebSocket       ┌────────────────────────────┐
│  Desktop Shell (Tauri/Electron) ───────────────────────────▶│     FastAPI Backend (ASGI) │
│  • Window / Tray / Hotkeys  │◀─────────────────────────────┤  Chat / Sessions / Router  │
│  • Secure local store       │                              └──────────┬─────────────────┘
└─────────────────────────────┘                                         │
                                                                        │
                                             ┌──────────────────────────┴─────────┐
                                             │     Tool Layer (MCP-style)         │
                                             │  • File System / Notes / Tasks     │
                                             │  • Email (mock → IMAP/Graph)       │
                                             │  • Shell / Process (guarded)       │
                                             │  • Future: Calendar, Browser, AI   │
                                             └──────────────────────────┬─────────┘
                                                                        │
                                              ┌─────────────────────────┴────────┐
                                              │          Local LLM Engine         │
                                              │   (Ollama / llama.cpp / GGUF)     │
                                              └───────────────────────────────────┘
```

## Core Concepts
### 1. Conversational Orchestrator
Interprets user intents, decides whether to call a tool, chain steps, or ask clarifying questions.

### 2. Tool Layer (MCP‑style)
Each tool implements a minimal contract:
```
name: str
description: str
schema: JSON-like param spec
run(payload: dict) -> Any
```
Registered tools are discoverable (`GET /tools`) and invocable (`POST /tools/{name}`) or via chat prefix `!tool`.

### 3. Local LLM Integration
Planned pipeline:
1. User message
2. Lightweight intent & tool selection (pattern + prompt heuristics)
3. Tool calls (parallel where safe)
4. Response synthesis (stream tokens to UI)
5. Optional plan memory update

Supports Ollama (e.g., `llama3`, `mistral`, `phi`) or direct GGUF inference through llama.cpp bindings.

### 4. Autonomy with Guardrails
Planned multi-step plan loop with constraints:
```
Plan -> Execute Step -> Observe -> Decide (continue / summarize / ask user) -> Finish
```
User approval required for sensitive categories (write, delete, network, email send).

## Repository Structure
```
backend/            FastAPI app, WebSocket chat, tool registry
    app/
        main.py         API + basic tool routing
        tools/          Tool implementations (ping, file_list, ...)
frontend/           React + Vite UI (chat + future panels)
shared/             (future) shared models, typegen
```

## Development Quickstart
Backend:
```
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Frontend:
```
cd frontend
npm install
npm run dev
```
Open: http://localhost:5173 (UI) & http://127.0.0.1:8000/docs (API)

### Using Tools in Chat (Temporary Syntax)
```
!tool ping
!tool file_list dir=.
```

## Tool Invocation & Spec
Current dev syntaxes (will converge to a single unified JSON schema execution flow):

1. Chat inline command:
```
!tool file_list dir=backend
```
2. REST direct:
```
POST /tools/file_list {"dir": "backend"}
```
3. Programmatic (future):
```
POST /agent/message {"message": "List python files in backend"}
```

### Tool JSON Contract (proposed)
```jsonc
{
        "name": "file_list",
        "description": "List files in a directory (non-recursive)",
        "input_schema": {
                "type": "object",
                "properties": {
                        "dir": {"type": "string", "description": "Directory path", "default": "."},
                        "filter": {"type": "string", "description": "Glob (optional)"}
                },
                "required": []
        },
        "safety": {
                "capability": "filesystem.read",
                "scope": "<path>" // resolved & validated at call time
        }
}
```

Planned safety categories: `filesystem.read`, `filesystem.write`, `process.exec`, `network.request`, `email.send`.

## Planned Desktop Packaging
Two target wrappers:
1. Tauri (Rust backend, small footprint, uses existing web assets)
2. Electron (JS only, faster iteration)

Packaging steps (future):
```
cd frontend && npm run build
# Copy dist/ into desktop wrapper (tauri/src-tauri or electron/app)
# Build binary (tauri build or electron-builder)
```

## Security & Privacy Model (Planned)
| Layer | Control |
|-------|---------|
| Tool Registration | Signed manifest / user approval |
| File Access | Path sandbox + explicit allowlist |
| Shell Exec | Disabled by default; per-command confirmation |
| Network Calls | Explicit permission categories |
| Secrets | Encrypted local key/value store (OS keychain) |

## Roadmap (Detailed)
| Phase | Title | Key Deliverables | Status |
|-------|-------|------------------|--------|
| 1 | Scaffold | Backend + UI shell + basic tools | ✅ Done |
| 2 | Core Tools | file read/write/search, notes/tasks memory store | ⏳ In Progress |
| 3 | Local LLM | Streaming + tool selection | Planned |
| 4 | Persistence | SQLite sessions, notes, tasks | Planned |
| 5 | Email Integration | Mock -> IMAP/Graph adapter | Planned |
| 6 | Autonomous Planner | Multi-step w/ approvals & diffs | Planned |
| 7 | Desktop Packaging | Tauri build + updater | Planned |
| 8 | Permissions & Audit | Policy engine + logs | Planned |
| 9 | Plugin SDK | External tool hot-reload API | Planned |
| 10 | Vector Memory | Embeddings + semantic search | Planned |

Milestones may shift based on feedback & contribution velocity.

## Extending: Adding a Tool (Example)
```python
# backend/app/tools/hello.py
from .base import BaseTool

class HelloTool(BaseTool):
        name = "hello"
        description = "Return a greeting"
        schema = {"name": {"type": "string", "required": False}}
        def run(self, payload):
                return {"greeting": f"Hello {payload.get('name','world')}"}

# register in backend/app/tools/__init__.py
from .hello import HelloTool
registry["hello"] = HelloTool()
```

## FAQ
**Q: Can it run fully offline?**  Yes. Core goal: all inference & tools local. Optional remote LLM fallback will be opt‑in.
**Q: Will it modify my files automatically?**  Only when a tool that writes is invoked; planned confirmation dialogs.
**Q: How are models managed?**  Via Ollama or local model folder. No auto-download without consent.
**Q: Is there telemetry?**  None planned; any later addition would be strictly opt‑in.

## Contributing (Early Stage)
1. Fork / branch
2. Add or update a tool / feature
3. Keep changes modular; include minimal tests (coming soon) & README snippet if introducing new tool categories.

## Future Ideas
| Idea | Rationale |
|------|-----------|
| Calendar + Scheduling Tool | Automate meeting prep & follow-ups |
| Browser Control Tool | Research & summarization loops |
| Local Vector Store | Persistent semantic recall |
| Runbook Generation | Convert successful plans into reusable macros |
| Multi-Model Strategy | Switch small/large models based on task cost |
| Diff-based File Editing | Safer write operations with preview |

## Changelog
See upcoming `CHANGELOG.md` once first tagged release (v0.1.0) is cut.

## License
MIT (placeholder – may add CLA if ecosystem grows)

## Disclaimer
Early prototype. Expect API churn. Not production-hardened yet (no sandbox / auth). Use on non-critical data until guardrails land.

---
Feel free to open issues for: model integration preferences, tool ideas, or security concerns.

---
<sub>Made with a focus on local empowerment & privacy.</sub>
