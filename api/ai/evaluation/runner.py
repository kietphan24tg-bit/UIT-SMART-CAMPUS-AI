from __future__ import annotations

import os
import time
from dataclasses import dataclass
from typing import Any

from .metrics import (
    fallback_accuracy,
    graded_ndcg_at_k,
    precision_at_k,
    recall_at_k,
    reciprocal_rank,
)
from .schemas import EvaluationSample
from src.retrieval.taxonomy import classify_query

RETRIEVAL_CONFIGS: dict[str, dict[str, Any]] = {
    "vector_baseline": {"hybrid_search_enabled": False, "reranker_enabled": False},
    "hybrid": {"hybrid_search_enabled": True, "reranker_enabled": False},
    "hybrid_reranker": {"hybrid_search_enabled": True, "reranker_enabled": True},
}


@dataclass(slots=True)
class RunOptions:
    config_name: str
    k: int = 5
    refresh: bool = False


def apply_retrieval_config(config_name: str):
    preset = RETRIEVAL_CONFIGS.get(config_name)
    if preset is None:
        raise ValueError(f"Unknown retrieval config: {config_name}")
    for key, value in preset.items():
        os.environ[key.upper()] = str(value).lower()
    from src.core.config import Settings

    return Settings()


def source_key_from_context(context: Any) -> str:
    citation = getattr(context, "citation", None)
    if citation is None and isinstance(context, dict):
        citation = context.get("citation") or {}
    if hasattr(citation, "source_file"):
        source_file = citation.source_file or ""
        heading_path = citation.heading_path or ""
    else:
        source_file = citation.get("source_file") or ""
        heading_path = citation.get("heading_path") or ""
    return f"{source_file}::{heading_path}".lower()


def document_from_context(context: Any) -> str:
    citation = getattr(context, "citation", None)
    if citation is None and isinstance(context, dict):
        citation = context.get("citation") or {}
    if hasattr(citation, "source_file"):
        return citation.source_file or ""
    return citation.get("source_file") or ""


def run_retrieval(
    samples: list[EvaluationSample],
    *,
    config_name: str,
    k: int = 5,
    filters: dict | None = None,
) -> list[dict[str, Any]]:
    from src.rag.service import RagService

    service = RagService(config=apply_retrieval_config(config_name))
    rows: list[dict[str, Any]] = []
    for index, sample in enumerate(samples, start=1):
        print(f"[retrieval:{config_name}] {index}/{len(samples)} {sample.id}", flush=True)
        started = time.perf_counter()
        error = None
        evidence = None
        try:
            evidence = service.retrieve_evidence(question=sample.question, filters=filters, top_k=k)
        except Exception as exc:  # pragma: no cover - live provider/db dependent
            error = type(exc).__name__
        latency = time.perf_counter() - started

        contexts = evidence.contexts if evidence else []
        retrieved_docs = [document_from_context(context) for context in contexts if document_from_context(context)]
        retrieved_keys = [source_key_from_context(context) for context in contexts]
        expected_docs = sample.expected_documents
        expected_keys = sample.expected_source_keys
        hint = classify_query(sample.question)
        answerable = sample.answerable
        expected_fallback = sample.expected.answer_type == "fallback"
        produced_fallback = not evidence or not evidence.found
        first_context = contexts[0] if contexts else None
        first_metadata = first_context.metadata if first_context else {}
        source_unit_ok = 1.0 if not answerable else _expected_source_unit_ok(sample, first_metadata)
        domain_ok = 1.0 if not answerable else _expected_domain_ok(sample, first_metadata)

        rows.append(
            {
                "sample_id": sample.id,
                "suite": "retrieval",
                "config": config_name,
                "category": sample.category,
                "difficulty": sample.difficulty.value,
                "answerable": 1.0 if answerable else 0.0,
                "corpus_gap": 1.0 if sample.corpus_gap else 0.0,
                "retrieval_recall_at_5": recall_at_k(expected_docs, retrieved_docs, k) if answerable else None,
                "retrieval_precision_at_5": precision_at_k(expected_docs, retrieved_docs, k) if answerable else None,
                "retrieval_mrr": reciprocal_rank(expected_docs, retrieved_docs) if answerable else None,
                "retrieval_ndcg_at_5": graded_ndcg_at_k(expected_keys, retrieved_keys, k) if answerable else None,
                "fallback_accuracy": fallback_accuracy(expected_fallback, produced_fallback),
                "expected_docs": expected_docs,
                "retrieved_docs": retrieved_docs,
                "retrieved_keys": retrieved_keys,
                "confidence": evidence.confidence if evidence else 0.0,
                "retrieved_count": evidence.retrieved_count if evidence else 0,
                "expected_domain": _expected_domain(sample),
                "predicted_domain": str(first_metadata.get("taxonomy_domain") or hint.domain or ""),
                "domain_correct": domain_ok,
                "source_unit_correct": source_unit_ok,
                "latency_seconds": latency,
                "provider_error": 1.0 if error else 0.0,
                "error": error,
            }
        )
    return rows


def _expected_domain(sample: EvaluationSample) -> str:
    return "exam" if sample.category == "training_exam" else ""


def _expected_domain_ok(sample: EvaluationSample, metadata: dict[str, Any]) -> float:
    expected = _expected_domain(sample)
    if not expected:
        return 1.0
    return 1.0 if str(metadata.get("taxonomy_domain") or "") == expected else 0.0


def _expected_source_unit_ok(sample: EvaluationSample, metadata: dict[str, Any]) -> float:
    expected_units = {"DAA"} if sample.category == "training_exam" else None
    if not expected_units:
        return 1.0
    return 1.0 if str(metadata.get("source_unit") or "").upper() in expected_units else 0.0
