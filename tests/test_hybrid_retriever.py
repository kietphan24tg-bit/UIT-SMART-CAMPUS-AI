"""Unit tests for HybridRetriever and Reciprocal Rank Fusion logic.

These tests use only in-memory mocks — no database required.
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from src.core.config import Settings
from src.retrieval.hybrid_retriever import HybridRetriever


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


def _make_row(chunk_id: int, content: str = "test", distance: float = 0.2) -> dict:
    return {
        "id": chunk_id,
        "document_id": 1,
        "content": content,
        "heading_path": "Điều 1",
        "parent_heading_path": None,
        "page_start": 1,
        "page_end": 1,
        "metadata": {},
        "source_file": f"doc_{chunk_id}.md",
        "source_path": None,
        "source_url": None,
        "source_unit": "phòng đào tạo",
        "category": "exam_regulation",
        "document_number": None,
        "issued_date": None,
        "effective_date": None,
        "is_current": "true",
        "distance": distance,
    }


def _make_config(**overrides) -> Settings:
    defaults = dict(
        database_url="postgresql://test",
        rag_db_schema="rag",
        embedding_dimensions=768,
        retrieval_candidate_k=10,
        rag_top_k=5,
        retrieval_min_score=0.0,
        retrieval_filter_current=False,
        hybrid_search_enabled=True,
        hybrid_rrf_k=60,
        hybrid_keyword_weight=1.0,
        hybrid_vector_weight=1.0,
        reranker_enabled=False,
    )
    defaults.update(overrides)
    return Settings(**defaults)


# ---------------------------------------------------------------------------
# RRF unit tests
# ---------------------------------------------------------------------------


class TestRRF:
    def test_rrf_scores_higher_for_doc_in_both_lists(self):
        config = _make_config()
        retriever = HybridRetriever.__new__(HybridRetriever)
        retriever.config = config

        vector_rows = [_make_row(1), _make_row(2), _make_row(3)]
        keyword_rows = [_make_row(2), _make_row(4), _make_row(5)]

        fused = retriever._reciprocal_rank_fusion(vector_rows, keyword_rows)
        fused_ids = [row["id"] for row, _ in fused]
        fused_scores = {row["id"]: score for row, score in fused}

        # Chunk 2 appears in both lists → should score higher than chunk 1 or 4 alone
        assert fused_ids[0] == 2, "Chunk found in both lists should rank first"
        assert fused_scores[2] > fused_scores[1]
        assert fused_scores[2] > fused_scores[4]
        assert all(0.0 <= score <= 1.0 for score in fused_scores.values())

    def test_rrf_normalization_is_compatible_with_confidence_thresholds(self):
        config = _make_config()
        retriever = HybridRetriever.__new__(HybridRetriever)
        retriever.config = config

        fused = retriever._reciprocal_rank_fusion([_make_row(1)], [_make_row(1)])

        assert fused[0][1] == pytest.approx(1.0)

    def test_rrf_all_unique_docs(self):
        config = _make_config()
        retriever = HybridRetriever.__new__(HybridRetriever)
        retriever.config = config

        vector_rows = [_make_row(i) for i in range(1, 6)]
        keyword_rows = [_make_row(i) for i in range(6, 11)]

        fused = retriever._reciprocal_rank_fusion(vector_rows, keyword_rows)
        # All 10 unique docs should be present
        assert len(fused) == 10
        # First doc of each list should have higher score than last doc
        fused_dict = {row["id"]: score for row, score in fused}
        assert fused_dict[1] > fused_dict[5]
        assert fused_dict[6] > fused_dict[10]

    def test_rrf_empty_keyword_results(self):
        config = _make_config()
        retriever = HybridRetriever.__new__(HybridRetriever)
        retriever.config = config

        vector_rows = [_make_row(1), _make_row(2)]
        fused = retriever._reciprocal_rank_fusion(vector_rows, [])

        assert len(fused) == 2
        fused_ids = [row["id"] for row, _ in fused]
        assert fused_ids == [1, 2]  # order preserved


# ---------------------------------------------------------------------------
# Integration-level mock tests
# ---------------------------------------------------------------------------


class TestHybridRetriever:
    def _make_retriever(self, config: Settings) -> HybridRetriever:
        mock_embedder = MagicMock()
        mock_embedder.embed_query.return_value = [0.1] * 768

        mock_store = MagicMock()
        mock_store.vector_search.return_value = [_make_row(1, distance=0.1), _make_row(2, distance=0.2)]
        mock_store.keyword_search.return_value = [_make_row(2), _make_row(3)]

        retriever = HybridRetriever(config=config, embedder=mock_embedder, vector_store=mock_store)
        return retriever

    def test_hybrid_returns_merged_results(self):
        config = _make_config()
        retriever = self._make_retriever(config)
        results = retriever.retrieve("điều kiện dự thi")

        # Chunk 2 is in both → should rank first
        assert len(results) > 0
        assert results[0].raw["id"] == 2

    def test_hybrid_disabled_uses_only_vector(self):
        config = _make_config(hybrid_search_enabled=False)
        retriever = self._make_retriever(config)
        results = retriever.retrieve("điều kiện dự thi")

        # keyword_search should NOT have been called
        retriever.vector_store.keyword_search.assert_not_called()
        assert len(results) > 0

    def test_keyword_search_failure_falls_back_to_vector(self):
        config = _make_config()
        retriever = self._make_retriever(config)
        retriever.vector_store.keyword_search.side_effect = Exception("search_vector missing")

        # Should not raise; falls back to pure vector results
        results = retriever.retrieve("điều kiện dự thi")
        assert len(results) > 0

    def test_min_score_filters_results(self):
        config = _make_config(retrieval_min_score=1.01)
        retriever = self._make_retriever(config)
        results = retriever.retrieve("điều kiện dự thi")

        # Normalized RRF scores cannot exceed 1.0.
        assert results == []

    def test_top_k_limits_results(self):
        config = _make_config(rag_top_k=1, retrieval_min_score=0.0)
        retriever = self._make_retriever(config)
        results = retriever.retrieve("điều kiện dự thi", top_k=1)

        assert len(results) <= 1
