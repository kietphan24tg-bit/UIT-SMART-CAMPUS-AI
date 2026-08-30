from dataclasses import dataclass

from src.core.config import Settings, settings
from src.embeddings.provider import EmbeddingProvider, create_embedding_provider
from src.retrieval.citations import score_from_distance
from src.vectorstores.pgvector import PgVectorStore


@dataclass(frozen=True)
class RetrievalResult:
    content: str
    metadata: dict
    distance: float
    score: float
    raw: dict


class Retriever:
    def __init__(
        self,
        config: Settings = settings,
        embedder: EmbeddingProvider | None = None,
        vector_store: PgVectorStore | None = None,
    ) -> None:
        self.config = config
        self.embedder = embedder or create_embedding_provider(config, batch_size=1)
        self.vector_store = vector_store or PgVectorStore(
            database_url=config.database_url or "",
            schema=config.rag_db_schema,
            dimensions=config.embedding_dimensions,
            embedding_provider=config.embedding_provider,
            embedding_model=config.embedding_model,
        )

    def retrieve(
        self,
        question: str,
        filters: dict | None = None,
        top_k: int = 8,
        min_score: float = 0.15,
    ) -> list[RetrievalResult]:
        embed_query = getattr(self.embedder, "embed_query", None)
        query_vector = embed_query(question) if callable(embed_query) else self.embedder.embed([question])[0]
        rows = self.vector_store.search(query_vector, filters=filters, limit=top_k)
        results: list[RetrievalResult] = []
        for row in rows:
            distance = float(row.get("distance") or 0.0)
            score = score_from_distance(distance)
            if score < min_score:
                continue
            metadata = dict(row.get("metadata") or {})
            metadata.update(
                {
                    "source_file": row.get("source_file") or metadata.get("source_file"),
                    "source_path": row.get("source_path") or metadata.get("source_path"),
                    "source_url": row.get("source_url") or metadata.get("source_url"),
                    "source_unit": row.get("source_unit") or metadata.get("source_unit"),
                    "category": row.get("category") or metadata.get("category"),
                    "document_number": row.get("document_number") or metadata.get("document_number"),
                    "issued_date": str(row.get("issued_date")) if row.get("issued_date") else metadata.get("issued_date"),
                    "effective_date": str(row.get("effective_date")) if row.get("effective_date") else metadata.get("effective_date"),
                    "heading_path": row.get("heading_path") or metadata.get("heading_path"),
                    "parent_heading_path": row.get("parent_heading_path") or metadata.get("parent_heading_path"),
                    "page_start": row.get("page_start") or metadata.get("page_start"),
                    "page_end": row.get("page_end") or metadata.get("page_end"),
                }
            )
            results.append(
                RetrievalResult(
                    content=row["content"],
                    metadata=metadata,
                    distance=distance,
                    score=score,
                    raw=dict(row),
                )
            )
        return results
