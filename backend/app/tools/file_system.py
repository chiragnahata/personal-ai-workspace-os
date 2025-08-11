import os
from typing import Any, Dict, List
from .base import BaseTool

class FileListTool(BaseTool):
    name = "file_list"
    description = "List files in a directory (non-recursive)"
    schema = {"dir": {"type": "string", "required": False, "description": "Directory path"}}

    def run(self, payload: Dict[str, Any]) -> Any:
        directory = payload.get("dir", ".")
        if not os.path.isdir(directory):
            raise ValueError(f"Not a directory: {directory}")
        entries: List[str] = []
        for name in os.listdir(directory):
            path = os.path.join(directory, name)
            if os.path.isdir(path):
                entries.append(name + "/")
            else:
                entries.append(name)
        return entries
