import os
import fnmatch
from typing import Any, Dict, List
from .base import BaseTool

class FileSearchTool(BaseTool):
    name = "file_search"
    description = "Search for files by glob pattern (recursive)"
    schema = {"root": {"type": "string", "required": False}, "pattern": {"type": "string", "required": True}, "max_results": {"type": "integer", "required": False}}

    def run(self, payload: Dict[str, Any]) -> Any:
        root = payload.get("root", ".")
        pattern = payload.get("pattern")
        max_results = int(payload.get("max_results", 200))
        if not pattern:
            raise ValueError("pattern required")
        matches: List[str] = []
        for dirpath, _, filenames in os.walk(root):
            for f in filenames:
                if fnmatch.fnmatch(f, pattern):
                    matches.append(os.path.join(dirpath, f))
                    if len(matches) >= max_results:
                        return {"matches": matches, "truncated": True}
        return {"matches": matches, "truncated": False}
