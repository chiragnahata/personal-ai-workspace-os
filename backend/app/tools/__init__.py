from .base import BaseTool
from .file_system import FileListTool
from .ping import PingTool
from .file_ops import FileReadTool, FileWriteTool, FileAppendTool
from .shell import ShellTool

registry = {
    "file_list": FileListTool(),
    "ping": PingTool(),
    "file_read": FileReadTool(),
    "file_write": FileWriteTool(),
    "file_append": FileAppendTool(),
    "shell": ShellTool(),
}

__all__ = ["registry", "BaseTool"]
