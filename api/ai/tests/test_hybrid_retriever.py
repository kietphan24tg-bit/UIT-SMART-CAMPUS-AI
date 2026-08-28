"""Unit tests for HybridRetriever and Reciprocal Rank Fusion logic."""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest

from src.core.config import Settings
from src.retrieval.hybrid_retriever import HybridRetriever


def _make_row(chunk_id: int, content: str = "test", distance: float = 0.2) -> dict:
    return {
        "id": chunk_id,
        "document_id": 1,
        "content": content,
        "heading_path": "Dieu 1",
        "parent_heading_path": None,
        "page_start": 1,
        "page_end": 1,
        "metadata": {},
        "source_file": f"doc_{chunk_id}.md",
        "source_path": None,
        "source_url": None,
        "source_unit": "DAA",
        "category": "exam",
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
        hybrid_phrase_boost_weight=0.15,
        hybrid_domain_boost_weight=0.12,
        hybrid_authority_boost_weight=0.08,
        reranker_enabled=False,
        answer_min_vector_confidence=0.32,
        answer_min_hybrid_confidence=0.38,
        answer_min_reranker_confidence=0.55,
        answer_min_top_gap=0.03,
        answer_min_lexical_coverage=0.20,
    )
    defaults.update(overrides)
    return Settings(**defaults)


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

        assert fused_ids[0] == 2
        assert fused_scores[2] > fused_scores[1]
        assert fused_scores[2] > fused_scores[4]
        assert all(0.0 <= score <= 1.0 for score in fused_scores.values())

    def test_rrf_normalization_is_compatible_with_confidence_thresholds(self):
        config = _make_config()
        retriever = HybridRetriever.__new__(HybridRetriever)
        retriever.config = config

        fused = retriever._reciprocal_rank_fusion([_make_row(1)], [_make_row(1)])

        assert fused[0][1] == pytest.approx(1.0)


class TestHybridRetriever:
    def _make_retriever(self, config: Settings) -> HybridRetriever:
        mock_embedder = MagicMock()
        mock_embedder.embed_query.return_value = [0.1] * 768

        mock_store = MagicMock()
        mock_store.vector_search.return_value = [_make_row(1, distance=0.1), _make_row(2, distance=0.2)]
        mock_store.keyword_search.return_value = [_make_row(2), _make_row(3)]

        return HybridRetriever(config=config, embedder=mock_embedder, vector_store=mock_store)

    def test_hybrid_returns_merged_results(self):
        config = _make_config()
        retriever = self._make_retriever(config)

        results = retriever.retrieve("dieu kien du thi")

        assert len(results) > 0
        assert results[0].raw["id"] == 2

    def test_hybrid_disabled_uses_only_vector(self):
        config = _make_config(hybrid_search_enabled=False)
        retriever = self._make_retriever(config)

        results = retriever.retrieve("dieu kien du thi")

        retriever.vector_store.keyword_search.assert_not_called()
        assert len(results) > 0

    def test_keyword_search_failure_falls_back_to_vector(self):
        config = _make_config()
        retriever = self._make_retriever(config)
        retriever.vector_store.keyword_search.side_effect = Exception("search_vector missing")

        results = retriever.retrieve("dieu kien du thi")

        assert len(results) > 0

    def test_min_score_filters_results(self):
        config = _make_config(retrieval_min_score=1.01)
        retriever = self._make_retriever(config)

        results = retriever.retrieve("dieu kien du thi")

        assert results == []

    def test_top_k_limits_results(self):
        config = _make_config(rag_top_k=1, retrieval_min_score=0.0)
        retriever = self._make_retriever(config)

        results = retriever.retrieve("dieu kien du thi", top_k=1)

        assert len(results) <= 1

    def test_phrase_and_domain_boost_favor_exam_policy(self):
        config = _make_config()
        mock_embedder = MagicMock()
        mock_embedder.embed_query.return_value = [0.1] * 768

        exam_row = _make_row(1, content="Dieu kien du thi cuoi ky", distance=0.25)
        exam_row["source_file"] = "daa-quy-che-thi.pdf"
        exam_row["heading_path"] = "Dieu kien du thi"
        learning_row = _make_row(2, content="Chuan dau ra nganh", distance=0.35)
        learning_row["source_file"] = "chuan-dau-ra.pdf"
        learning_row["category"] = "learning_outcome"
        learning_row["metadata"] = {"taxonomy_domain": "learning_outcome"}

        mock_store = MagicMock()
        mock_store.vector_search.return_value = [learning_row, exam_row]
        mock_store.keyword_search.return_value = [learning_row, exam_row]

        retriever = HybridRetriever(config=config, embedder=mock_embedder, vector_store=mock_store)
        results = retriever.retrieve("dieu kien du thi cuoi ky")

        assert results[0].raw["id"] == 1

    def test_filters_are_forwarded_to_vector_and_keyword_search(self):
        config = _make_config()
        retriever = self._make_retriever(config)

        retriever.retrieve("dieu kien du thi", filters={"category": "exam"})

        assert retriever.vector_store.vector_search.call_args.kwargs["filters"] == {"category": "exam"}
        assert retriever.vector_store.keyword_search.call_args.kwargs["filters"] == {"category": "exam"}
