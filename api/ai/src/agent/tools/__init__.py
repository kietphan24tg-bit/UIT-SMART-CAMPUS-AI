from __future__ import annotations

from src.rag.service import RagService

from .academic import build_academic_tools
from .attendance import build_attendance_tools
from .base import AgentTool, ToolArgumentsModel
from .campus_services import build_campus_service_tools
from .context import ToolContext
from .nest_client import NestApiClient
from .operations import ToolOperation
from .rag import SearchUniversityPoliciesTool
from .registry import ToolRegistry
from .results import ToolError, ToolResult
from .users import build_user_tools


def build_tool_catalog(
    nest_client: NestApiClient | None = None,
    rag_service: RagService | None = None,
) -> list[AgentTool]:
    client = nest_client or NestApiClient()
    return [
        *build_academic_tools(client),
        *build_attendance_tools(client),
        *build_campus_service_tools(client),
        *build_user_tools(client),
        SearchUniversityPoliciesTool(rag_service=rag_service),
    ]


def build_tool_registry(
    nest_client: NestApiClient | None = None,
    rag_service: RagService | None = None,
) -> ToolRegistry:
    registry = ToolRegistry()
    for tool in build_tool_catalog(nest_client=nest_client, rag_service=rag_service):
        registry.register(tool)
    return registry


__all__ = [
    "AgentTool",
    "NestApiClient",
    "SearchUniversityPoliciesTool",
    "ToolArgumentsModel",
    "ToolContext",
    "ToolError",
    "ToolOperation",
    "ToolRegistry",
    "ToolResult",
    "build_tool_catalog",
    "build_tool_registry",
]
