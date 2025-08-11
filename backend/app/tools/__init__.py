from .base import BaseTool
from .file_system import FileListTool
from .ping import PingTool
from .file_ops import FileReadTool, FileWriteTool, FileAppendTool
from .shell import ShellTool
from .notes import NotesListTool, NotesCreateTool, NotesUpdateTool, NotesDeleteTool
from .tasks import TasksListTool, TaskAddTool, TaskCompleteTool
from .search import FileSearchTool

registry = {
    # system / file
    "ping": PingTool(),
    "file_list": FileListTool(),
    "file_search": FileSearchTool(),
    "file_read": FileReadTool(),
    "file_write": FileWriteTool(),
    "file_append": FileAppendTool(),
    # content (notes)
    "notes_list": NotesListTool(),
    "notes_create": NotesCreateTool(),
    "notes_update": NotesUpdateTool(),
    "notes_delete": NotesDeleteTool(),
    # tasks
    "tasks_list": TasksListTool(),
    "task_add": TaskAddTool(),
    "task_complete": TaskCompleteTool(),
    # shell (guarded)
    "shell": ShellTool(),
}

__all__ = ["registry", "BaseTool"]
