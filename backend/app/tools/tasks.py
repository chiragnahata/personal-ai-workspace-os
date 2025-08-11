import time
from typing import Any, Dict
from .base import BaseTool

_TASKS: Dict[str, Dict[str, Any]] = {}

def _task_id() -> str:
    return f"t{int(time.time()*1000)}"

class TasksListTool(BaseTool):
    name = "tasks_list"
    description = "List tasks (in-memory)"
    schema: Dict[str, Any] = {}

    def run(self, payload: Dict[str, Any]) -> Any:
        return list(_TASKS.values())

class TaskAddTool(BaseTool):
    name = "task_add"
    description = "Add a task"
    schema = {"title": {"type": "string", "required": True}}

    def run(self, payload: Dict[str, Any]) -> Any:
        title = payload.get("title")
        if not title:
            raise ValueError("title required")
        tid = _task_id()
        task = {"id": tid, "title": title, "done": False, "created_at": time.time()}
        _TASKS[tid] = task
        return task

class TaskCompleteTool(BaseTool):
    name = "task_complete"
    description = "Mark a task as completed"
    schema = {"id": {"type": "string", "required": True}}

    def run(self, payload: Dict[str, Any]) -> Any:
        tid = payload.get("id")
        if tid not in _TASKS:
            raise ValueError("task not found")
        _TASKS[tid]["done"] = True
        _TASKS[tid]["completed_at"] = time.time()
        return _TASKS[tid]
