from fastapi import APIRouter

from src.core.config import settings
from src.vectorstores.pgvector import PgVectorStore

router = APIRouter()


@router.get("/health")
def health() -> dict[str, str | bool]:
    database_ok = False
    if settings.database_url:
        try:
            PgVectorStore(settings.database_url, settings.rag_db_schema, settings.embedding_dimensions).ensure_schema()
            database_ok = True
        except Exception:
            database_ok = False
    return {"status": "ok", "database": database_ok}
