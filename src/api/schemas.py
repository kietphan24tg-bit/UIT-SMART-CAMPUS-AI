from typing import Any

from pydantic import BaseModel, Field

from src.core.config import settings


class RagQueryRequest(BaseModel):
    question: str = Field(min_length=1, max_length=settings.agent_max_message_chars)
    filters: dict[str, str | bool | int | float] = Field(default_factory=dict)
    top_k: int = Field(default=6, ge=1, le=30)
    min_score: float = Field(default=0.15, ge=0.0, le=1.0)
    include_context: bool = False


class Citation(BaseModel):
    index: int | None = None
    source_file: str
    source_unit: str | None = None
    category: str | None = None
    heading_path: str | None = None
    parent_heading_path: str | None = None
    page_start: int | None = None
    page_end: int | None = None
    distance: float | None = None
    score: float | None = None


class RagContext(BaseModel):
    index: int
    content: str
    citation: Citation
    metadata: dict[str, Any] = Field(default_factory=dict)


class RagQueryResponse(BaseModel):
    answer: str
    citations: list[Citation] = Field(default_factory=list)
    confidence: float = 0.0
    retrieved_count: int = 0
    answer_type: str = "knowledge"
    contexts: list[RagContext] | None = None
    fallback_reason: str | None = None
    citation_validation: dict[str, Any] | None = None


class RagEvidenceResponse(BaseModel):
    found: bool
    citations: list[Citation] = Field(default_factory=list)
    confidence: float = 0.0
    retrieved_count: int = 0
    contexts: list[RagContext] = Field(default_factory=list)
    fallback_reason: str | None = None
    top_score: float | None = None
    top_gap: float | None = None


class IngestRebuildResponse(BaseModel):
    documents_seen: int
    documents_indexed: int
    chunks_indexed: int
    errors: list[dict] = Field(default_factory=list)


class IngestFileRequest(BaseModel):
    path: str = Field(min_length=1, max_length=1024)


class IngestFileResponse(BaseModel):
    chunks_indexed: int
