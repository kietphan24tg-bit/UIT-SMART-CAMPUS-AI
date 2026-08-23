"""One-time migration: add search_vector column to document_chunks.

Run this script once after deploying the hybrid search update:

    python -m scripts.migrate_fts

It is idempotent — safe to run multiple times.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.core.config import settings
from src.vectorstores.pgvector import PgVectorStore


def main() -> None:
    if not settings.database_url:
        print("ERROR: DATABASE_URL is not set. Check your .env file.")
        sys.exit(1)

    store = PgVectorStore(
        database_url=settings.database_url,
        schema=settings.rag_db_schema,
        dimensions=settings.embedding_dimensions,
    )

    print(f"Adding search_vector column to {settings.rag_db_schema}.document_chunks …")
    store.ensure_fts_column()
    print("✓ Done. Full-text search column and GIN index are ready.")
    print()
    print("Next steps:")
    print("  1. Restart the FastAPI service so HybridRetriever picks up HYBRID_SEARCH_ENABLED=true")
    print("  2. The GENERATED ALWAYS AS column is auto-populated from existing content — no re-ingestion needed.")


if __name__ == "__main__":
    main()
