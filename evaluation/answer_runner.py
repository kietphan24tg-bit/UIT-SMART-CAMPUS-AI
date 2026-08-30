from __future__ import annotations

import time
from typing import Any

from .cache import EvaluationCache
from .judge import GeminiJudge
from .runner import apply_retrieval_config
from .schemas import EvaluationSample


class TimedChatClient:
    """Wrapper around ChatClient to measure LLM generation latency."""

    def __init__(self, inner_client: Any) -> None:
        self.inner_client = inner_client
        self.last_latency_seconds: float = 0.0

    def chat(self, system_prompt: str, user_prompt: str) -> str:
        started = time.perf_counter()
        try:
            return self.inner_client.chat(system_prompt, user_prompt)
        finally:
            self.last_latency_seconds = time.perf_counter() - started


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
    retrieval_config: str = "vector_baseline",
    filters: dict | None = None,
    refresh: bool = False,
    cache: EvaluationCache | None = None,
    existing_rows: list[dict[str, Any]] | None = None,
) -> list[dict[str, Any]]:
    """Run the actual RAG generation path, then score each answer with the judge.

    Supports deterministic resume via `existing_rows`: samples with valid judge scores
    and no provider errors are reused without re-running.
    """
    from src.rag.service import RagService

    existing_by_id: dict[str, dict[str, Any]] = {}
    if existing_rows and not refresh:
        for r in existing_rows:
            if (
                r.get("config") == retrieval_config
                and float(r.get("provider_error", 0.0)) == 0.0
                and float(r.get("judge_error_rate", 0.0)) == 0.0
                and "faithfulness" in r
            ):
                existing_by_id[r["sample_id"]] = r

    config = apply_retrieval_config(retrieval_config)
    service = RagService(config=config)
    timed_llm = TimedChatClient(service.llm_client)
    service.llm_client = timed_llm

    judge = GeminiJudge(
        api_key=config.gemini_key,
        provider=config.eval_judge_provider,
        model=config.eval_judge_model,
        ollama_base_url=config.ollama_base_url,
        cache=cache,
    )
    rows: list[dict[str, Any]] = []
    for index, sample in enumerate(samples, start=1):
        if sample.id in existing_by_id:
            print(f"[answer:{index}/{len(samples)}] {sample.id} (resumed from cache/results)", flush=True)
            rows.append(existing_by_id[sample.id])
            continue

        print(f"[answer:{index}/{len(samples)}] {sample.id}", flush=True)
        step_started = time.perf_counter()
        timed_llm.last_latency_seconds = 0.0

        rag_started = time.perf_counter()
        generation_error = None
        judge_error = None
        response = None
        try:
            response = service.answer(
                sample.question,
                filters=filters,
                include_context=True,
            )
        except Exception as exc:  # Provider/database failures belong in the report.
            generation_error = type(exc).__name__
        rag_latency = time.perf_counter() - rag_started
        llm_latency = timed_llm.last_latency_seconds if response and not generation_error else 0.0

        contexts = [_context_payload(context) for context in (response.contexts or [])] if response else []
        generated_answer = response.answer if response else ""
        score = None

        judge_started = time.perf_counter()
        if response and not generation_error:
            try:
                score = judge.score(sample, generated_answer, contexts, refresh=refresh)
            except Exception as exc:
                judge_error = type(exc).__name__
        judge_latency = time.perf_counter() - judge_started
        eval_wall_time = time.perf_counter() - step_started

        row: dict[str, Any] = {
            "sample_id": sample.id,
            "suite": "answer",
            "config": retrieval_config,
            "generation_model": config.llm_model,
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
            "latency_seconds": rag_latency,  # Production RAG path latency (excludes judge)
            "rag_latency_seconds": rag_latency,
            "llm_latency_seconds": llm_latency,
            "judge_latency_seconds": judge_latency,
            "eval_wall_time_seconds": eval_wall_time,
            "provider_error": 1.0 if generation_error else 0.0,
            "judge_error_rate": 1.0 if judge_error else 0.0,
            "generation_error": generation_error,
            "judge_error": judge_error,
        }
        if score:
            row.update(score.model_dump(mode="json"))
        rows.append(row)
    return rows
