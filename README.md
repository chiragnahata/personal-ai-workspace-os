# Personal AI Workspace OS (Desktop)

Local-first, Jarvis‑style personal AI Workspace OS. A desktop application that unifies your files, notes, tasks, and email into a single conversational interface. It can search, read, write, summarize, generate, plan multi‑step automations, and invoke system tools – all privately on your machine using a local LLM + MCP (Model Context Protocol) style tool adapters.

> Mission: Give you an extensible personal operator that actually does work for you – without shipping your data to the cloud.

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

## High-Level Architecture
```
+------------------------------+            +-------------------------+
| Desktop Shell (Tauri/Electron)|  HTTP/WS   | FastAPI Backend (ASGI) |
|  - Window, Tray, Hotkeys     +<---------->+  Chat / Session API     |
|  - Local secure store        |            |  Orchestrator / Router  |
+---------------+--------------+            +-----------+-------------+
                                ^                                       |
                                |                                       v
                +-------+---------+          +-------------------------------+
                |  Local LLM      |          |   MCP Tool Adapters           |
                | (Ollama / GGUF) |          |  - File System (list/read/..) |
                +-----------------+          |  - Notes / Tasks              |
                                                                            |  - Email (mock -> IMAP/Graph) |
                                                                            |  - Shell / Process (guarded)  |
                                                                            +-------------------------------+
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
Phase 1 (Scaffold) – DONE
Phase 2: Core tools (file read/write/search, notes/tasks in-memory)
Phase 3: Local LLM streaming + tool calling
Phase 4: Persistence layer (SQLite + migrations)
Phase 5: Email mock -> IMAP/Graph integration
Phase 6: Planning loop + approval UX
Phase 7: Desktop packaging (Tauri + updater)
Phase 8: Permissions & audit log
Phase 9: Plugin SDK (drop-in Python/Node tools)
Phase 10: Vector memory & semantic search

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

## License
MIT (placeholder – may add CLA if ecosystem grows)

## Disclaimer
Early prototype. Expect API churn. Not production-hardened yet (no sandbox / auth). Use on non-critical data until guardrails land.

---
Feel free to open issues for: model integration preferences, tool ideas, or security concerns.
