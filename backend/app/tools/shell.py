import subprocess
from typing import Any, Dict
from .base import BaseTool

FORBIDDEN = {"shutdown", "reboot", "rm -rf /", "format", "mkfs", "del /s", "rd /s"}
MAX_OUTPUT = 8000

class ShellTool(BaseTool):
    name = "shell"
    description = "Run a safe shell command (read-only preferred)"
    schema = {"cmd": {"type": "string", "required": True}}

    def run(self, payload: Dict[str, Any]) -> Any:
        cmd = payload.get("cmd")
        if not cmd:
            raise ValueError("cmd required")
        lowered = cmd.lower()
        if any(f in lowered for f in FORBIDDEN):
            raise ValueError("Forbidden command pattern detected")
        try:
            completed = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=20)
        except subprocess.TimeoutExpired:
            raise ValueError("Command timed out")
        out = (completed.stdout or "")[:MAX_OUTPUT]
        err = (completed.stderr or "")[:MAX_OUTPUT]
        return {"returncode": completed.returncode, "stdout": out, "stderr": err}
