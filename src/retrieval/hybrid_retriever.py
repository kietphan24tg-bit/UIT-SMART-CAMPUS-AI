"""Hybrid retrieval: vector search + PostgreSQL full-text search, fused via RRF.

Reciprocal Rank Fusion (RRF) formula:
    rrf_score(doc) = Σ  weight_i / (k + rank_i(doc))

where k=60 (standard default) dampens the importance of very high ranks.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass

from src.core.config import Settings, settings
from src.embeddings.provider import EmbeddingProvider, create_embedding_provider
from src.retrieval.citations import score_from_distance
from src.retrieval.retriever import RetrievalResult
from src.vectorstores.pgvector import PgVectorStore

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class _RankedRow:
    row: dict
    vector_rank: int | None = None   # 1-based; None = not in vector results
    keyword_rank: int | None = None  # 1-based; None = not in keyword results


class HybridRetriever:
    """Combines cosine-distance vector search with PostgreSQL FTS, merged via RRF.

    Usage
    -----
    retriever = HybridRetriever()
    results = retriever.retrieve("điều kiện dự thi", top_k=6)
    """

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
        )

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def retrieve(
        self,
        question: str,
        filters: dict | None = None,
        candidate_k: int | None = None,
        top_k: int | None = None,
        min_score: float | None = None,
    ) -> list[RetrievalResult]:
        """Retrieve and rank chunks relevant to *question*.

        Args:
            question:    User query (Vietnamese natural language).
            filters:     Extra JSONB metadata filters passed to both searches.
            candidate_k: How many raw candidates each search fetches
                         (defaults to ``config.retrieval_candidate_k``).
            top_k:       Final number of chunks returned
                         (defaults to ``config.rag_top_k``).
            min_score:   Drop chunks below this score
                         (defaults to ``config.retrieval_min_score``).
        """
        _candidate_k = candidate_k if candidate_k is not None else self.config.retrieval_candidate_k
        _top_k = top_k if top_k is not None else self.config.rag_top_k
        _min_score = min_score if min_score is not None else self.config.retrieval_min_score
        _filter_current = self.config.retrieval_filter_current

        # 1. Embed query
        embed_query = getattr(self.embedder, "embed_query", None)
        query_vector: list[float] = (
            embed_query(question) if callable(embed_query)
            else self.embedder.embed([question])[0]
        )

        # 2. Vector search (always)
        vector_rows = self.vector_store.vector_search(
            query_vector,
            filters=filters,
            limit=_candidate_k,
            filter_current=_filter_current,
        )

        # 3. Keyword search (only when hybrid mode is on)
        keyword_rows: list[dict] = []
        if self.config.hybrid_search_enabled:
            try:
                keyword_rows = self.vector_store.keyword_search(
                    question,
                    filters=filters,
                    limit=_candidate_k,
                    filter_current=_filter_current,
                )
            except Exception:
                # search_vector column may not exist yet on the first deploy
                logger.warning(
                    "keyword_search failed (search_vector column missing?). "
                    "Run PgVectorStore.ensure_fts_column() to enable hybrid search. "
                    "Falling back to vector-only retrieval.",
                    exc_info=True,
                )

        # 4. Fuse rankings
        if keyword_rows:
            fused = self._reciprocal_rank_fusion(vector_rows, keyword_rows)
        else:
            # Pure vector path: assign a pseudo-RRF score from cosine distance
            fused = [
                (row, score_from_distance(float(row.get("distance") or 0.0)))
                for row in vector_rows
            ]

        # 5. Apply min_score filter and cap at top_k
        results: list[RetrievalResult] = []
        for row, rrf_score in fused:
            if rrf_score < _min_score:
                continue
            metadata = self._build_metadata(row)
            results.append(
                RetrievalResult(
                    content=row["content"],
                    metadata=metadata,
                    distance=float(row.get("distance") or 0.0),
                    score=rrf_score,
                    raw=dict(row),
                )
            )
            if len(results) >= _top_k:
                break

        return results

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _reciprocal_rank_fusion(
        self,
        vector_rows: list[dict],
        keyword_rows: list[dict],
    ) -> list[tuple[dict, float]]:
        """Merge two ranked lists using Reciprocal Rank Fusion.

        Returns list of (row, rrf_score) sorted by descending score.
        Uses chunk ``id`` as the deduplication key.
        """
        k = self.config.hybrid_rrf_k
        kw_weight = self.config.hybrid_keyword_weight
        vec_weight = self.config.hybrid_vector_weight

        # Map: chunk_id → row dict
        id_to_row: dict[int, dict] = {}
        # Map: chunk_id → accumulated RRF score
        id_to_score: dict[int, float] = {}

        for rank, row in enumerate(vector_rows, start=1):
            cid = int(row["id"])
            id_to_row[cid] = row
            id_to_score[cid] = id_to_score.get(cid, 0.0) + vec_weight / (k + rank)

        for rank, row in enumerate(keyword_rows, start=1):
            cid = int(row["id"])
            if cid not in id_to_row:
                id_to_row[cid] = row
            id_to_score[cid] = id_to_score.get(cid, 0.0) + kw_weight / (k + rank)

        sorted_ids = sorted(id_to_score, key=id_to_score.__getitem__, reverse=True)
        return [(id_to_row[cid], id_to_score[cid]) for cid in sorted_ids]

    @staticmethod
    def _build_metadata(row: dict) -> dict:
        metadata = dict(row.get("metadata") or {})
        metadata.update(
            {
                "source_file": row.get("source_file") or metadata.get("source_file"),
                "source_path": row.get("source_path") or metadata.get("source_path"),
                "source_url": row.get("source_url") or metadata.get("source_url"),
                "source_unit": row.get("source_unit") or metadata.get("source_unit"),
                "category": row.get("category") or metadata.get("category"),
                "document_number": row.get("document_number") or metadata.get("document_number"),
                "issued_date": (
                    str(row["issued_date"]) if row.get("issued_date")
                    else metadata.get("issued_date")
                ),
                "effective_date": (
                    str(row["effective_date"]) if row.get("effective_date")
                    else metadata.get("effective_date")
                ),
                "heading_path": row.get("heading_path") or metadata.get("heading_path"),
                "parent_heading_path": (
                    row.get("parent_heading_path") or metadata.get("parent_heading_path")
                ),
                "page_start": row.get("page_start") or metadata.get("page_start"),
                "page_end": row.get("page_end") or metadata.get("page_end"),
                "is_current": row.get("is_current") or metadata.get("is_current"),
            }
        )
        return metadata
