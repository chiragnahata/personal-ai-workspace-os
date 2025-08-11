from .base import BaseTool
from .file_system import FileListTool
from .ping import PingTool

registry = {
    "file_list": FileListTool(),
    "ping": PingTool(),
}

__all__ = ["registry", "BaseTool"]
