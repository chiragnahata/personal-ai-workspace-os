"""Very lightweight planning/execution loop (placeholder for real LLM agent).
Provides deterministic pseudo-planning and executes only known safe tools.
"""
from typing import List, Dict, Any
from .tools import registry

SAFE_EXECUTE = {"file_list", "file_read", "ping"}  # restrict mutating tools unless explicitly allowed


def plan(goal: str) -> List[Dict[str, Any]]:
    steps: List[Dict[str, Any]] = []
    g = goal.lower()
    if "list" in g and "file" in g:
        steps.append({"action": "file_list", "args": {"dir": "."}})
    if "read" in g and "." in g:
        # naive heuristic skipped
        pass
    if not steps:
        steps.append({"action": "ping", "args": {}})
    return steps


def run_goal(goal: str, max_steps: int = 5, auto: bool = False) -> Dict[str, Any]:
    steps = plan(goal)[:max_steps]
    executed = []
    for s in steps:
        name = s["action"]
        if name not in registry:
            executed.append({"action": name, "error": "unknown tool"})
            continue
        if not auto and name not in SAFE_EXECUTE:
            executed.append({"action": name, "skipped": "requires approval"})
            continue
        if name not in SAFE_EXECUTE and auto:
            executed.append({"action": name, "skipped": "not in safe set"})
            continue
        try:
            out = registry[name].run(s.get("args", {}))
            executed.append({"action": name, "output": out})
        except Exception as e:
            executed.append({"action": name, "error": str(e)})
    return {"goal": goal, "steps": steps, "executed": executed}
