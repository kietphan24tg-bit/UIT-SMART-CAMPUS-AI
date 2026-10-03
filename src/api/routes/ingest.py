from __future__ import annotations

from fastapi import APIRouter

from src.api.schemas import IngestFileRequest, IngestFileResponse, IngestRebuildResponse
from src.core.auth import AdminRequest
from src.core.config import settings
from src.core.limits import RateLimitPolicy, guardrail_store
from src.ingestion.pipeline import IngestionPipeline
from src.vectorstores.pgvector import PgVectorStore

router = APIRouter(dependencies=[AdminRequest])


@router.post("/rebuild", response_model=IngestRebuildResponse)
def rebuild_index() -> IngestRebuildResponse:
    _enforce_ingest_limit("ingest:rebuild")
    result = IngestionPipeline().rebuild()
    return IngestRebuildResponse(
        documents_seen=result.documents_seen,
        documents_indexed=result.documents_indexed,
        chunks_indexed=result.chunks_indexed,
        errors=result.errors,
    )


@router.post("/index-file", response_model=IngestFileResponse)
def index_file(payload: IngestFileRequest) -> IngestFileResponse:
    _enforce_ingest_limit("ingest:index-file")
    chunks_indexed = IngestionPipeline().index_file(payload.path)
    return IngestFileResponse(chunks_indexed=chunks_indexed)


@router.get("/status")
def ingest_status() -> dict:
    _enforce_ingest_limit("ingest:status")
    store = PgVectorStore(settings.database_url or "", settings.rag_db_schema, settings.embedding_dimensions)
    store.ensure_schema()
    return store.status()


def _enforce_ingest_limit(scope: str) -> None:
    guardrail_store.enforce_rate_limit(
        scope,
        RateLimitPolicy(
            limit=settings.agent_ingest_rate_limit_per_hour,
            window_seconds=3600,
            # Ingestion is already protected by AI_ADMIN_TOKEN. Keep the
            # per-process limiter available when a deployment intentionally
            # runs without Redis instead of blocking all maintenance calls.
            fail_closed=False,
        ),
    )
