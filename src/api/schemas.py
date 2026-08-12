from typing import Any

from pydantic import BaseModel, Field


class RagQueryRequest(BaseModel):
    question: str = Field(min_length=1)
    filters: dict[str, str | bool | int | float] = Field(default_factory=dict)
    top_k: int = Field(default=8, ge=1, le=20)
    min_score: float = Field(default=0.15, ge=0.0, le=1.0)
    include_context: bool = False


class Citation(BaseModel):
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


class IngestRebuildResponse(BaseModel):
    documents_seen: int
    documents_indexed: int
    chunks_indexed: int
    errors: list[dict] = Field(default_factory=list)


class IngestFileRequest(BaseModel):
    path: str = Field(min_length=1)


class IngestFileResponse(BaseModel):
    chunks_indexed: int
