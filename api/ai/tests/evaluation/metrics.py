"""Evaluation metrics for the RAG pipeline.

Metrics implemented:
    - Recall@K      : fraction of expected docs found in top-K retrieved docs
    - MRR           : Mean Reciprocal Rank of first relevant doc
    - NDCG@K        : Normalized Discounted Cumulative Gain
    - Precision@K   : fraction of top-K retrieved docs that are relevant
"""

from __future__ import annotations

import math


# ---------------------------------------------------------------------------
# Retrieval metrics
# ---------------------------------------------------------------------------


def recall_at_k(expected_docs: list[str], retrieved_docs: list[str], k: int) -> float:
    """Fraction of expected documents that appear in the top-K retrieved docs.

    Args:
        expected_docs:  Ground-truth document filenames (source_file).
        retrieved_docs: Retrieved documents in ranked order (top first).
        k:              Cut-off rank.

    Returns:
        Float in [0, 1].  Returns 1.0 if expected_docs is empty.
    """
    if not expected_docs:
        return 1.0
    hits = set(expected_docs) & set(retrieved_docs[:k])
    return len(hits) / len(expected_docs)


def precision_at_k(expected_docs: list[str], retrieved_docs: list[str], k: int) -> float:
    """Fraction of the top-K retrieved docs that are relevant.

    Returns:
        Float in [0, 1].
    """
    if k == 0:
        return 0.0
    hits = sum(1 for doc in retrieved_docs[:k] if doc in set(expected_docs))
    return hits / k


def reciprocal_rank(expected_docs: list[str], retrieved_docs: list[str]) -> float:
    """Reciprocal rank of the first relevant document.

    Returns:
        1/rank (1-based) if any expected doc is found, else 0.0.
    """
    expected_set = set(expected_docs)
    for rank, doc in enumerate(retrieved_docs, start=1):
        if doc in expected_set:
            return 1.0 / rank
    return 0.0


def ndcg_at_k(expected_docs: list[str], retrieved_docs: list[str], k: int) -> float:
    """Normalized Discounted Cumulative Gain at rank K.

    Binary relevance: 1 if doc is in expected_docs, else 0.

    Returns:
        Float in [0, 1].
    """
    expected_set = set(expected_docs)
    dcg = sum(
        1.0 / math.log2(rank + 1)
        for rank, doc in enumerate(retrieved_docs[:k], start=1)
        if doc in expected_set
    )
    # Ideal DCG: all expected docs at the top
    n_relevant = min(len(expected_docs), k)
    idcg = sum(1.0 / math.log2(rank + 1) for rank in range(1, n_relevant + 1))
    return dcg / idcg if idcg > 0 else 0.0


# ---------------------------------------------------------------------------
# Aggregate helpers
# ---------------------------------------------------------------------------


def mean_reciprocal_rank(samples: list[dict]) -> float:
    """Compute MRR over a list of evaluation result dicts.

    Each dict must have keys:
        ``expected_docs`` (list[str]) and ``retrieved_docs`` (list[str]).
    """
    if not samples:
        return 0.0
    return sum(
        reciprocal_rank(s["expected_docs"], s["retrieved_docs"])
        for s in samples
    ) / len(samples)


def mean_recall_at_k(samples: list[dict], k: int) -> float:
    """Average Recall@K across all evaluation samples."""
    if not samples:
        return 0.0
    return sum(
        recall_at_k(s["expected_docs"], s["retrieved_docs"], k)
        for s in samples
    ) / len(samples)


def mean_ndcg_at_k(samples: list[dict], k: int) -> float:
    """Average NDCG@K across all evaluation samples."""
    if not samples:
        return 0.0
    return sum(
        ndcg_at_k(s["expected_docs"], s["retrieved_docs"], k)
        for s in samples
    ) / len(samples)
