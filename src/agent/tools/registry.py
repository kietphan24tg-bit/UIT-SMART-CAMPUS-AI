from __future__ import annotations

from .base import AgentTool


class ToolRegistry:
    def __init__(self) -> None:
        self._tools: dict[str, AgentTool] = {}

    def register(self, tool: AgentTool) -> None:
        if tool.name in self._tools:
            raise ValueError(f"Tool '{tool.name}' is already registered.")
        self._tools[tool.name] = tool

    def get(self, name: str) -> AgentTool:
        try:
            return self._tools[name]
        except KeyError as exc:
            raise KeyError(f"Unknown tool '{name}'.") from exc

    def for_role(self, role: str) -> list[AgentTool]:
        return [tool for tool in self._tools.values() if role in tool.allowed_roles]

    def definitions_for_role(self, role: str) -> list[dict]:
        return [tool.to_llm_definition() for tool in self.for_role(role) if tool.should_expose_to_llm()]

    def all(self) -> list[AgentTool]:
        return list(self._tools.values())
