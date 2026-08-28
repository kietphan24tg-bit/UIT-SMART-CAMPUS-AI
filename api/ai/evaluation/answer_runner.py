from __future__ import annotations

import time
from typing import Any

from .cache import EvaluationCache
from .judge import GeminiJudge
from .schemas import EvaluationSample


def _context_payload(context: Any) -> dict[str, Any]:
    citation = context.citation.model_dump(mode="json")
    return {
        "index": context.index,
        "content": context.content,
        "citation": citation,
        "metadata": {
            "source_file": context.metadata.get("source_file"),
            "source_unit": context.metadata.get("source_unit"),
            "category": context.metadata.get("category"),
            "heading_path": context.metadata.get("heading_path"),
            "page_start": context.metadata.get("page_start"),
            "page_end": context.metadata.get("page_end"),
        },
    }


def run_answer_evaluation(
    samples: list[EvaluationSample],
    *,
    refresh: bool = False,
    cache: EvaluationCache | None = None,
) -> list[dict[str, Any]]:
    """Run the actual RAG generation path, then score each answer with the judge."""
    from src.rag.service import RagService

    service = RagService()
    judge = GeminiJudge(cache=cache)
    rows: list[dict[str, Any]] = []
    for index, sample in enumerate(samples, start=1):
        print(f"[answer:{index}/{len(samples)}] {sample.id}", flush=True)
        started = time.perf_counter()
        error = None
        response = None
        try:
            response = service.answer(sample.question, include_context=True)
        except Exception as exc:  # Provider/database failures belong in the report.
            error = type(exc).__name__

        contexts = [_context_payload(context) for context in (response.contexts or [])] if response else []
        generated_answer = response.answer if response else ""
        score = None
        if response and not error:
            try:
                score = judge.score(sample, generated_answer, contexts, refresh=refresh)
            except Exception as exc:
                error = type(exc).__name__

        row: dict[str, Any] = {
            "sample_id": sample.id,
            "suite": "answer",
            "config": "rag_local_e5_groq",
            "category": sample.category,
            "difficulty": sample.difficulty.value,
            "question": sample.question,
            "reference_answer": sample.expected.reference_answer,
            "generated_answer": generated_answer,
            "answer_type": response.answer_type if response else "error",
            "citations": [citation.model_dump(mode="json") for citation in (response.citations if response else [])],
            "contexts": contexts,
            "confidence": response.confidence if response else 0.0,
            "retrieved_count": response.retrieved_count if response else 0,
            "latency_seconds": time.perf_counter() - started,
            "provider_error": 1.0 if error else 0.0,
            "error": error,
        }
        if score:
            row.update(score.model_dump(mode="json"))
        rows.append(row)
    return rows
