from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import asyncio
import datetime

app = FastAPI(title="Personal AI Workspace OS API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    id: str
    role: str  # user|assistant|system|tool
    content: str
    created_at: datetime.datetime
    meta: Optional[Dict[str, Any]] = None

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

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
    assistant_msg = ChatMessage(id=f"a-{now.timestamp()}", role="assistant", content=f"Echo: {req.message}", created_at=now)
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
            assistant_msg = ChatMessage(id=f"a-{now.timestamp()}", role="assistant", content=reply, created_at=now)
            SESSIONS[session_id].append(assistant_msg)
            await ws.send_json({"type": "message", "message": assistant_msg.dict()})
    except WebSocketDisconnect:
        pass
