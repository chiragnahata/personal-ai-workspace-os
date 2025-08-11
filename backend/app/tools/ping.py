from typing import Any, Dict
from .base import BaseTool
import time

class PingTool(BaseTool):
    name = "ping"
    description = "Return pong with timestamp; test connectivity"
    schema = {}

    def run(self, payload: Dict[str, Any]) -> Any:
        return {"pong": time.time()}
