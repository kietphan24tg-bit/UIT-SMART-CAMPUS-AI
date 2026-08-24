from __future__ import annotations

import math
import random
import re
import unicodedata
from collections import defaultdict
from statistics import mean
from typing import Iterable


def _dedupe(values: Iterable[str]) -> list[str]:
    seen: set[str] = set()
    output: list[str] = []
    for value in values:
        normalized = value.lower()
        if normalized in seen:
            continue
        seen.add(normalized)
        output.append(value)
    return output


def _source_alias(value: str) -> str:
    doc = value.split("::", 1)[0]
    doc = re.sub(r"\.(md|pdf|html|txt)$", "", doc, flags=re.IGNORECASE)
    normalized = unicodedata.normalize("NFKD", doc).encode("ascii", "ignore").decode("ascii").lower()
    return re.sub(r"[^a-z0-9]+", "-", normalized).strip("-")


def source_matches(expected: str, retrieved: str) -> bool:
    expected_alias = _source_alias(expected)
    retrieved_alias = _source_alias(retrieved)
    if not expected_alias or not retrieved_alias:
        return False
    return (
        expected_alias == retrieved_alias
        or expected_alias in retrieved_alias
        or retrieved_alias in expected_alias
    )


def _is_relevant(expected: list[str], retrieved: str) -> bool:
    return any(source_matches(item, retrieved) for item in expected)


def recall_at_k(expected: list[str], retrieved: list[str], k: int) -> float:
    if not expected:
        return 1.0
    hits = sum(1 for item in _dedupe(expected) if any(source_matches(item, got) for got in _dedupe(retrieved[:k])))
    return hits / len(_dedupe(expected))


def precision_at_k(expected: list[str], retrieved: list[str], k: int) -> float:
    top = _dedupe(retrieved[:k])
    if not top:
        return 0.0
    hits = sum(1 for item in top if _is_relevant(expected, item))
    return hits / len(top)


def reciprocal_rank(expected: list[str], retrieved: list[str]) -> float:
    for rank, item in enumerate(_dedupe(retrieved), start=1):
        if _is_relevant(expected, item):
            return 1.0 / rank
    return 0.0


def ndcg_at_k(expected: list[str], retrieved: list[str], k: int) -> float:
    relevance = {item: 1 for item in expected}
    return graded_ndcg_at_k(relevance, retrieved, k)


def graded_ndcg_at_k(relevance_by_key: dict[str, int], retrieved_keys: list[str], k: int) -> float:
    if not relevance_by_key:
        return 0.0
    top = _dedupe(retrieved_keys[:k])
    dcg = 0.0
    matched_expected: set[str] = set()
    for rank, key in enumerate(top, start=1):
        expected_key, relevance = _matched_relevance(relevance_by_key, key, matched_expected)
        if expected_key:
            matched_expected.add(expected_key)
        gain = (2**relevance) - 1
        dcg += gain / math.log2(rank + 1)

    ideal_relevance = sorted(relevance_by_key.values(), reverse=True)[:k]
    idcg = sum(((2**rel) - 1) / math.log2(rank + 1) for rank, rel in enumerate(ideal_relevance, start=1))
    return dcg / idcg if idcg > 0 else 0.0


def _matched_relevance(
    relevance_by_key: dict[str, int],
    retrieved_key: str,
    already_matched: set[str],
) -> tuple[str | None, int]:
    matches = [
        (expected_key, relevance)
        for expected_key, relevance in relevance_by_key.items()
        if expected_key not in already_matched and source_matches(expected_key, retrieved_key)
    ]
    if not matches:
        return (None, 0)
    return max(matches, key=lambda item: item[1])


def fallback_accuracy(expected_fallback: bool, produced_fallback: bool) -> float:
    return 1.0 if expected_fallback == produced_fallback else 0.0


def mean_metric(values: Iterable[float]) -> float:
    values_list = list(values)
    return mean(values_list) if values_list else 0.0


def macro_average(rows: list[dict], metric_key: str, group_key: str = "category") -> float:
    grouped: dict[str, list[float]] = defaultdict(list)
    for row in rows:
        grouped[str(row[group_key])].append(float(row.get(metric_key, 0.0)))
    if not grouped:
        return 0.0
    return mean(mean(values) for values in grouped.values())


def bootstrap_ci(values: list[float], *, seed: int = 42, resamples: int = 10_000, alpha: float = 0.05) -> tuple[float, float]:
    if not values:
        return (0.0, 0.0)
    if len(values) == 1:
        return (values[0], values[0])
    rng = random.Random(seed)
    estimates = []
    size = len(values)
    for _ in range(resamples):
        estimates.append(mean(values[rng.randrange(size)] for _ in range(size)))
    estimates.sort()
    low_index = max(0, int((alpha / 2) * resamples) - 1)
    high_index = min(resamples - 1, int((1 - alpha / 2) * resamples) - 1)
    return (estimates[low_index], estimates[high_index])


def paired_bootstrap_delta(
    baseline: list[float],
    candidate: list[float],
    *,
    seed: int = 42,
    resamples: int = 10_000,
) -> tuple[float, tuple[float, float]]:
    if len(baseline) != len(candidate):
        raise ValueError("baseline and candidate must have the same length")
    deltas = [cand - base for base, cand in zip(baseline, candidate, strict=True)]
    return (mean_metric(deltas), bootstrap_ci(deltas, seed=seed, resamples=resamples))


def mean_reciprocal_rank(samples: list[dict]) -> float:
    return mean_metric(reciprocal_rank(row["expected_docs"], row["retrieved_docs"]) for row in samples)


def mean_recall_at_k(samples: list[dict], k: int) -> float:
    return mean_metric(recall_at_k(row["expected_docs"], row["retrieved_docs"], k) for row in samples)


def mean_ndcg_at_k(samples: list[dict], k: int) -> float:
    return mean_metric(ndcg_at_k(row["expected_docs"], row["retrieved_docs"], k) for row in samples)
