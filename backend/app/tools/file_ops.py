import os
from typing import Any, Dict
from .base import BaseTool

SAFE_MAX_SIZE = 200_000  # 200 KB read cap

class FileReadTool(BaseTool):
    name = "file_read"
    description = "Read a text file (capped)"
    schema = {"path": {"type": "string", "required": True}}

    def run(self, payload: Dict[str, Any]) -> Any:
        path = payload.get("path")
        if not path or not os.path.isfile(path):
            raise ValueError("File not found")
        size = os.path.getsize(path)
        if size > SAFE_MAX_SIZE:
            raise ValueError(f"File too large (> {SAFE_MAX_SIZE} bytes)")
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            return f.read()

class FileWriteTool(BaseTool):
    name = "file_write"
    description = "Write (overwrite) a text file"
    schema = {"path": {"type": "string", "required": True}, "content": {"type": "string", "required": True}}

    def run(self, payload: Dict[str, Any]) -> Any:
        path = payload.get("path")
        content = payload.get("content", "")
        if not path:
            raise ValueError("Path required")
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        return {"written": len(content)}

class FileAppendTool(BaseTool):
    name = "file_append"
    description = "Append text to a file (creates if missing)"
    schema = {"path": {"type": "string", "required": True}, "content": {"type": "string", "required": True}}

    def run(self, payload: Dict[str, Any]) -> Any:
        path = payload.get("path")
        content = payload.get("content", "")
        if not path:
            raise ValueError("Path required")
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
        with open(path, "a", encoding="utf-8") as f:
            f.write(content)
        return {"appended": len(content)}
