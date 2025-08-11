from abc import ABC, abstractmethod
from typing import Any, Dict

class BaseTool(ABC):
    name: str
    description: str
    schema: Dict[str, Any] = {}

    @abstractmethod
    def run(self, payload: Dict[str, Any]) -> Any:
        ...

    def describe(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description,
            "schema": self.schema,
        }
