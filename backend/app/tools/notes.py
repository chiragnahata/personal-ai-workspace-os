import time
from typing import Any, Dict
from .base import BaseTool

_NOTES: Dict[str, Dict[str, Any]] = {}

def _note_id() -> str:
    return f"n{int(time.time()*1000)}"

class NotesListTool(BaseTool):
    name = "notes_list"
    description = "List all notes (in-memory)"
    schema: Dict[str, Any] = {}

    def run(self, payload: Dict[str, Any]) -> Any:
        return list(_NOTES.values())

class NotesCreateTool(BaseTool):
    name = "notes_create"
    description = "Create a note"
    schema = {"title": {"type": "string", "required": True}, "content": {"type": "string", "required": False}}

    def run(self, payload: Dict[str, Any]) -> Any:
        title = payload.get("title")
        content = payload.get("content", "")
        if not title:
            raise ValueError("title required")
        nid = _note_id()
        note = {"id": nid, "title": title, "content": content, "created_at": time.time()}
        _NOTES[nid] = note
        return note

class NotesUpdateTool(BaseTool):
    name = "notes_update"
    description = "Update an existing note"
    schema = {"id": {"type": "string", "required": True}, "title": {"type": "string"}, "content": {"type": "string"}}

    def run(self, payload: Dict[str, Any]) -> Any:
        nid = payload.get("id")
        if nid not in _NOTES:
            raise ValueError("note not found")
        if "title" in payload:
            _NOTES[nid]["title"] = payload["title"]
        if "content" in payload:
            _NOTES[nid]["content"] = payload["content"]
        _NOTES[nid]["updated_at"] = time.time()
        return _NOTES[nid]

class NotesDeleteTool(BaseTool):
    name = "notes_delete"
    description = "Delete a note"
    schema = {"id": {"type": "string", "required": True}}

    def run(self, payload: Dict[str, Any]) -> Any:
        nid = payload.get("id")
        if nid not in _NOTES:
            raise ValueError("note not found")
        note = _NOTES.pop(nid)
        return {"deleted": nid, "title": note.get("title")}
