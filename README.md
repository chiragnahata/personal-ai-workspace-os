# Personal AI Workspace OS

Local MCP-powered personal AI workspace OS (Jarvis-style). A local dashboard that unifies your files, email, notes, and tasks into one conversational interface. Works offline with a local LLM and MCP tools.

## Goals
- Unified conversational UI ("Jarvis" style) for personal productivity
- Local-first: privacy, offline capability
- Extensible via MCP (Model Context Protocol) tools
- Automate workflows: search, summarize, draft, schedule, refactor, file ops

## High-Level Architecture
```
+---------------------------+            +--------------------+
| Frontend (React/Vite)     |  WebSocket |  Backend Gateway   |
| - Chat UI / panels        +<---------->+  FastAPI / ASGI    |
| - File/Email/Notes views  |            |  Orchestrator      |
+-------------+-------------+            +----+---------------+
              ^                                |
              |                                v
     +--------+---------+        +-----------------------------+
     |  Local LLM       |        |  MCP Tool Adapters          |
     |  (GGUF / ollama) |        |  - File System              |
     +------------------+        |  - Email API                |
                                 |  - Notes API                |
                                 |  - Task Manager             |
                                 +-----------------------------+
```

## Components (Initial Scaffold)
- backend/: FastAPI app, WebSocket chat endpoint, MCP tool abstraction, lightweight agent
- frontend/: React + Vite + TypeScript chat/dashboard shell
- shared/: (future) Shared schemas (pydantic/TS), protocol definitions

## Roadmap
1. Scaffold ✔
2. Chat session + streaming responses ✔ (basic)
3. File system tools (list/read/write/append + safe shell) ✔ (partial)
4. Notes + Tasks in-memory adapters (swap real APIs later)
5. Email adapter (mock then real IMAP/Graph option)
6. Local LLM integration (Ollama fallback) with function-calling to MCP tools
7. Orchestration agent (tool routing + memory + guardrails)
8. Auth + settings persistence
9. Packaging (desktop wrapper w/ Tauri or Electron optional)
10. Autonomous multi-step plans (agent loops w/ user approval gates)

## Dev Quickstart
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

Open http://localhost:5173 (default Vite) and backend at http://127.0.0.1:8000/docs

## Current Tools
| Name | Purpose | Notes |
|------|---------|-------|
| ping | Connectivity test | Returns timestamp |
| file_list | List directory entries | Non-recursive |
| file_read | Read small text file | 200KB cap |
| file_write | Overwrite/create text file | Creates dirs |
| file_append | Append to text file | Creates file |
| shell | Run safe shell command | Blocks dangerous patterns |

Invoke from chat: `!tool file_list dir=.` or JSON: `!tool file_write {"path":"notes/demo.txt","content":"hello"}`

## Agent
Endpoints:
- POST /agent/plan {"goal": "List project files"}
- POST /agent/execute {"goal": "List project files", "auto": true}

Current agent is deterministic & safe-lists tools.

## Safety & Autonomy
Shell and file tools are intentionally restricted (size caps, forbidden command substrings). Future enhancements: sandboxing, dry-run previews, user confirmation for mutating ops, permission-scoped virtual workspace.

## Repository
Initialize & push (if not already):
```
git init
git add .
git commit -m "feat: initial scaffold with tool system"
git branch -M main
git remote add origin <your_repo_url>
git push -u origin main
```

## License
MIT (placeholder)
