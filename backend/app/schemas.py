from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import datetime

class ToolInvocation(BaseModel):
    tool: str
    input: Dict[str, Any]
    id: str = Field(default_factory=lambda: f"tool-{datetime.datetime.utcnow().timestamp()}")

class ToolResult(BaseModel):
    tool: str
    success: bool
    output: Any
    error: Optional[str] = None
    invocation_id: Optional[str] = None

class ChatMessage(BaseModel):
    id: str
    role: str  # user|assistant|system|tool
    content: str
    created_at: datetime.datetime
    meta: Optional[Dict[str, Any]] = None

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatSession(BaseModel):
    id: str
    messages: List[ChatMessage] = []
