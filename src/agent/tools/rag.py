from __future__ import annotations

from pydantic import BaseModel, Field

from src.rag.service import RagService

from .base import AgentTool, ToolArgumentsModel
from .context import ToolContext
from .operations import ToolOperation
from .results import ToolError, ToolResult


class SearchUniversityPoliciesInput(ToolArgumentsModel):
    query: str = Field(min_length=1)
    top_k: int | None = Field(default=None, ge=1, le=10)


class SearchUniversityPoliciesTool(AgentTool):
    name = "search_university_policies"
    display_name = "Tra cuu quy che UIT"
    description = (
        "Tra cứu quy chế, quy định, cẩm nang sinh viên và tài liệu tĩnh của trường bằng RAG. "
        "Dùng khi câu hỏi cần nguồn văn bản chính thức của trường. Không dùng cho dữ liệu cá nhân hóa thời gian thực "
        "như lịch học tuần này hoặc điểm của người dùng. Dữ liệu là tri thức tài liệu nội bộ đã index."
    )
    input_model = SearchUniversityPoliciesInput
    allowed_roles = frozenset({"student", "lecturer", "admin", "super_admin", "canteen_admin"})
    operation_type = ToolOperation.READ
    requires_confirmation = False
    retry_policy = "once_transient"

    def __init__(self, rag_service: RagService | None = None) -> None:
        self.rag_service = rag_service

    def _execute_validated(self, context: ToolContext, arguments: BaseModel) -> ToolResult:
        del context
        rag_service = self.rag_service or RagService()
        response = rag_service.retrieve_evidence(
            question=arguments.query,
            top_k=arguments.top_k,
        )
        return ToolResult(
            ok=True,
            tool=self.name,
            status="success",
            data=response.to_response().model_dump(exclude_none=True),
        )
