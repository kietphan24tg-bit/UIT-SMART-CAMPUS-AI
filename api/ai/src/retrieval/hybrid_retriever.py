"""Hybrid retrieval: vector search + PostgreSQL full-text search, fused via RRF."""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass

from src.core.config import Settings, settings
from src.embeddings.provider import EmbeddingProvider, create_embedding_provider
from src.retrieval.citations import score_from_distance
from src.retrieval.retriever import RetrievalResult
from src.retrieval.taxonomy import QueryHint, authority_score, classify_query, enrich_metadata
from src.vectorstores.pgvector import PgVectorStore

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class FusedRow:
    row: dict
    score: float
    score_kind: str
    ranking_score: float


class HybridRetriever:
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

    def retrieve(
        self,
        question: str,
        filters: dict | None = None,
        candidate_k: int | None = None,
        top_k: int | None = None,
        min_score: float | None = None,
    ) -> list[RetrievalResult]:
        candidate_limit = candidate_k if candidate_k is not None else self.config.retrieval_candidate_k
        top_limit = top_k if top_k is not None else self.config.rag_top_k
        min_limit = min_score if min_score is not None else self.config.retrieval_min_score
        filter_current = self.config.retrieval_filter_current
        hint = classify_query(question)

        embed_query = getattr(self.embedder, "embed_query", None)
        query_vector: list[float] = (
            embed_query(question) if callable(embed_query)
            else self.embedder.embed([question])[0]
        )

        vector_rows = self.vector_store.vector_search(
            query_vector,
            filters=filters,
            limit=candidate_limit,
            filter_current=filter_current,
        )

        keyword_rows: list[dict] = []
        if self.config.hybrid_search_enabled:
            try:
                keyword_rows = self.vector_store.keyword_search(
                    self._keyword_query(question, hint),
                    filters=filters,
                    limit=candidate_limit,
                    filter_current=filter_current,
                )
            except Exception:
                logger.warning("keyword_search failed; falling back to vector-only retrieval", exc_info=True)

        fused = self._fuse_rows(question, hint, vector_rows, keyword_rows)

        results: list[RetrievalResult] = []
        for fused_row in fused:
            if fused_row.score < min_limit:
                continue
            metadata = self._build_metadata(fused_row.row)
            raw = dict(fused_row.row)
            raw["score_kind"] = fused_row.score_kind
            raw["hybrid_score"] = fused_row.score
            results.append(
                RetrievalResult(
                    content=fused_row.row["content"],
                    metadata=metadata,
                    distance=float(fused_row.row.get("distance") or 0.0),
                    score=fused_row.score,
                    raw=raw,
                )
            )
            if len(results) >= top_limit:
                break
        return results

    def _fuse_rows(
        self,
        question: str,
        hint: QueryHint,
        vector_rows: list[dict],
        keyword_rows: list[dict],
    ) -> list[FusedRow]:
        if keyword_rows:
            fused_scores = self._reciprocal_rank_fusion(vector_rows, keyword_rows)
            score_kind = "hybrid_rrf"
        else:
            fused_scores = [
                (row, score_from_distance(float(row.get("distance") or 0.0)))
                for row in vector_rows
            ]
            score_kind = "vector"

        boosted: list[FusedRow] = []
        for row, base_score in fused_scores:
            ranking_score = base_score + self._soft_boost(question, hint, row)
            final_score = min(1.0, max(0.0, ranking_score))
            boosted.append(
                FusedRow(
                    row=row,
                    score=final_score,
                    score_kind=score_kind,
                    ranking_score=ranking_score,
                )
            )
        boosted.sort(key=lambda item: item.ranking_score, reverse=True)
        return boosted

    def _soft_boost(self, question: str, hint: QueryHint, row: dict) -> float:
        metadata = self._build_metadata(row)
        boost = 0.0

        if hint.domain and metadata.get("taxonomy_domain") == hint.domain:
            boost += self.config.hybrid_domain_boost_weight
        if hint.source_units and str(metadata.get("source_unit") or "").upper() in {
            unit.upper() for unit in hint.source_units
        }:
            boost += self.config.hybrid_domain_boost_weight / 2
        if any(self._phrase_in_row(alias, row) for alias in hint.aliases):
            boost += self.config.hybrid_phrase_boost_weight

        boost += authority_score(metadata) * self.config.hybrid_authority_boost_weight
        if str(metadata.get("is_current") or "").lower() == "true":
            boost += 0.03
        if self._query_mentions_category(question, metadata):
            boost += 0.04
        return min(boost, 0.35)

    @staticmethod
    def _query_mentions_category(question: str, metadata: dict) -> bool:
        category = str(metadata.get("category") or "")
        if not category:
            return False
        words = re.findall(r"[a-z0-9]+", category.lower())
        question_words = set(re.findall(r"[a-z0-9]+", question.lower()))
        return any(word in question_words for word in words if len(word) >= 4)

    @staticmethod
    def _phrase_in_row(phrase: str, row: dict) -> bool:
        haystack = " ".join(
            str(part or "")
            for part in (
                row.get("content"),
                row.get("heading_path"),
                row.get("source_file"),
                row.get("category"),
                (row.get("metadata") or {}).get("title"),
            )
        ).lower()
        return phrase.lower() in haystack

    @staticmethod
    def _keyword_query(question: str, hint: QueryHint) -> str:
        aliases = [f"\"{alias}\"" for alias in hint.aliases[:3]]
        if not aliases:
            return question
        return " ".join([question, *aliases])

    def _reciprocal_rank_fusion(
        self,
        vector_rows: list[dict],
        keyword_rows: list[dict],
    ) -> list[tuple[dict, float]]:
        k = self.config.hybrid_rrf_k
        kw_weight = self.config.hybrid_keyword_weight
        vec_weight = self.config.hybrid_vector_weight

        id_to_row: dict[int, dict] = {}
        id_to_score: dict[int, float] = {}
        seen_documents: dict[str, int] = {}

        for rank, row in enumerate(vector_rows, start=1):
            chunk_id = int(row["id"])
            id_to_row[chunk_id] = row
            id_to_score[chunk_id] = id_to_score.get(chunk_id, 0.0) + vec_weight / (k + rank)

        for rank, row in enumerate(keyword_rows, start=1):
            chunk_id = int(row["id"])
            if chunk_id not in id_to_row:
                id_to_row[chunk_id] = row
            id_to_score[chunk_id] = id_to_score.get(chunk_id, 0.0) + kw_weight / (k + rank)

        sorted_ids = sorted(id_to_score, key=id_to_score.__getitem__, reverse=True)
        max_score = (kw_weight + vec_weight) / (k + 1)
        fused: list[tuple[dict, float]] = []
        for chunk_id in sorted_ids:
            row = id_to_row[chunk_id]
            source_file = str(row.get("source_file") or "")
            if source_file:
                count = seen_documents.get(source_file, 0)
                seen_documents[source_file] = count + 1
                doc_penalty = 1.0 if count == 0 else max(0.85 - (count * 0.1), 0.55)
            else:
                doc_penalty = 1.0
            fused.append((row, min((id_to_score[chunk_id] / max_score) * doc_penalty, 1.0)))
        return fused

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
        return enrich_metadata(
            metadata,
            source_unit=metadata.get("source_unit"),
            category=metadata.get("category"),
        )
