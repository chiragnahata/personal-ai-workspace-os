from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
import datetime
import os

from .schemas import ChatMessage, ChatRequest
from .tools import registry as tool_registry

app = FastAPI(title="Personal AI Workspace OS API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store (placeholder)
SESSIONS: Dict[str, List[ChatMessage]] = {}

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/chat")
async def chat(req: ChatRequest):
    # Echo placeholder
    now = datetime.datetime.utcnow()
    session_id = req.session_id or "default"
    user_msg = ChatMessage(id=f"u-{now.timestamp()}", role="user", content=req.message, created_at=now)
    SESSIONS.setdefault(session_id, []).append(user_msg)
    # Very naive command routing: if message starts with !tool tool_name {json}
    content = f"Echo: {req.message}"
    if req.message.startswith("!tool"):
        # pattern: !tool <name> <arg>
        parts = req.message.split(maxsplit=2)
        if len(parts) < 2:
            content = "Usage: !tool <name> [args]"
        else:
            tool_name = parts[1]
            arg_text = parts[2] if len(parts) > 2 else "{}"
            tool = tool_registry.get(tool_name)
            if not tool:
                content = f"Tool '{tool_name}' not found."
            else:
                try:
                    # basic arg parsing: key=value space separated OR json
                    import json as _json
                    payload: Dict[str, Any]
                    try:
                        payload = _json.loads(arg_text)
                    except Exception:
                        payload = {}
                        for kv in arg_text.split():
                            if '=' in kv:
                                k, v = kv.split('=',1)
                                payload[k] = v
                    result = tool.run(payload)
                    content = f"[tool:{tool_name}] {result}"
                except Exception as e:
                    content = f"Tool error: {e}"
    assistant_msg = ChatMessage(id=f"a-{now.timestamp()}", role="assistant", content=content, created_at=now)
    SESSIONS[session_id].append(assistant_msg)
    return {"session_id": session_id, "messages": [m.dict() for m in SESSIONS[session_id]]}

@app.websocket("/ws/chat")
async def ws_chat(ws: WebSocket):
    await ws.accept()
    session_id = "default"
    try:
        while True:
            data = await ws.receive_json()
            text = data.get("message", "")
            now = datetime.datetime.utcnow()
            user_msg = ChatMessage(id=f"u-{now.timestamp()}", role="user", content=text, created_at=now)
            SESSIONS.setdefault(session_id, []).append(user_msg)
            # Simulate streaming assistant reply
            reply = f"Echo: {text}"
            if text.startswith("!tool"):
                parts = text.split(maxsplit=2)
                if len(parts) >= 2:
                    tool_name = parts[1]
                    arg_text = parts[2] if len(parts) > 2 else "{}"
                    tool = tool_registry.get(tool_name)
                    if tool:
                        try:
                            import json as _json
                            try:
                                payload = _json.loads(arg_text)
                            except Exception:
                                payload = {}
                                for kv in arg_text.split():
                                    if '=' in kv:
                                        k,v = kv.split('=',1)
                                        payload[k]=v
                            tool_result = tool.run(payload)
                            reply = f"[tool:{tool_name}] {tool_result}"
                        except Exception as e:
                            reply = f"Tool error: {e}"
                    else:
                        reply = f"Tool '{tool_name}' not found."
            assistant_msg = ChatMessage(id=f"a-{now.timestamp()}", role="assistant", content=reply, created_at=now)
            SESSIONS[session_id].append(assistant_msg)
            await ws.send_json({"type": "message", "message": assistant_msg.dict()})
    except WebSocketDisconnect:
        pass

@app.get("/tools")
async def list_tools():
    return {"tools": [t.describe() for t in tool_registry.values()]}

@app.post("/tools/{tool_name}")
async def invoke_tool(tool_name: str, payload: dict):
    tool = tool_registry.get(tool_name)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    try:
        return {"result": tool.run(payload)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
