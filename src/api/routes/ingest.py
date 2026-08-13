from fastapi import APIRouter

from src.api.schemas import IngestFileRequest, IngestFileResponse, IngestRebuildResponse
from src.core.config import settings
from src.ingestion.pipeline import IngestionPipeline
from src.vectorstores.pgvector import PgVectorStore

router = APIRouter()


@router.post("/rebuild", response_model=IngestRebuildResponse)
def rebuild_index() -> IngestRebuildResponse:
    result = IngestionPipeline().rebuild()
    return IngestRebuildResponse(
        documents_seen=result.documents_seen,
        documents_indexed=result.documents_indexed,
        chunks_indexed=result.chunks_indexed,
        errors=result.errors,
    )


@router.post("/index-file", response_model=IngestFileResponse)
def index_file(payload: IngestFileRequest) -> IngestFileResponse:
    chunks_indexed = IngestionPipeline().index_file(payload.path)
    return IngestFileResponse(chunks_indexed=chunks_indexed)


@router.get("/status")
def ingest_status() -> dict:
    store = PgVectorStore(settings.database_url or "", settings.rag_db_schema, settings.embedding_dimensions)
    store.ensure_schema()
    return store.status()
