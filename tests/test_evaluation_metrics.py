"""Unit tests for evaluation metrics (Recall@K, MRR, NDCG@K, Precision@K)."""

from __future__ import annotations

import pytest

from evaluation.metrics import (
    mean_ndcg_at_k,
    mean_recall_at_k,
    mean_reciprocal_rank,
    ndcg_at_k,
    precision_at_k,
    recall_at_k,
    reciprocal_rank,
)


class TestRecallAtK:
    def test_perfect_recall(self):
        assert recall_at_k(["a.md", "b.md"], ["a.md", "b.md", "c.md"], k=5) == 1.0

    def test_zero_recall(self):
        assert recall_at_k(["a.md"], ["b.md", "c.md"], k=5) == 0.0

    def test_partial_recall(self):
        assert recall_at_k(["a.md", "b.md"], ["a.md", "c.md"], k=5) == 0.5

    def test_k_cutoff_excludes_later_hits(self):
        # b.md is at rank 3, k=2 so it's excluded
        assert recall_at_k(["a.md", "b.md"], ["a.md", "c.md", "b.md"], k=2) == 0.5

    def test_empty_expected_returns_one(self):
        assert recall_at_k([], ["a.md"], k=5) == 1.0


class TestReciprocalRank:
    def test_first_hit(self):
        assert reciprocal_rank(["a.md"], ["a.md", "b.md"]) == 1.0

    def test_second_hit(self):
        assert reciprocal_rank(["b.md"], ["a.md", "b.md", "c.md"]) == pytest.approx(0.5)

    def test_no_hit(self):
        assert reciprocal_rank(["z.md"], ["a.md", "b.md"]) == 0.0

    def test_empty_retrieved(self):
        assert reciprocal_rank(["a.md"], []) == 0.0


class TestNDCG:
    def test_perfect_ndcg(self):
        # Both expected docs at ranks 1 and 2
        assert ndcg_at_k(["a.md", "b.md"], ["a.md", "b.md", "c.md"], k=5) == pytest.approx(1.0)

    def test_zero_ndcg(self):
        assert ndcg_at_k(["z.md"], ["a.md", "b.md"], k=5) == 0.0

    def test_partial_ndcg(self):
        # Only 1 of 2 expected docs retrieved
        score = ndcg_at_k(["a.md", "b.md"], ["a.md", "c.md", "d.md"], k=5)
        assert 0.0 < score < 1.0

    def test_empty_expected(self):
        assert ndcg_at_k([], ["a.md"], k=5) == 0.0


class TestMeanMetrics:
    def _samples(self):
        return [
            {"expected_docs": ["a.md"], "retrieved_docs": ["a.md", "b.md"]},
            {"expected_docs": ["c.md"], "retrieved_docs": ["b.md", "c.md"]},
        ]

    def test_mrr(self):
        # Sample 1: RR=1.0, Sample 2: RR=0.5 → MRR=0.75
        assert mean_reciprocal_rank(self._samples()) == pytest.approx(0.75)

    def test_recall_at_k(self):
        assert mean_recall_at_k(self._samples(), k=5) == pytest.approx(1.0)

    def test_empty_samples(self):
        assert mean_reciprocal_rank([]) == 0.0
        assert mean_recall_at_k([], k=5) == 0.0
        assert mean_ndcg_at_k([], k=5) == 0.0
