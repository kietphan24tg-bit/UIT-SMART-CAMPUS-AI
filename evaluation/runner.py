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


def run_retrieval(samples: list[EvaluationSample], *, config_name: str, k: int = 5) -> list[dict[str, Any]]:
    from src.rag.service import RagService

    service = RagService(config=apply_retrieval_config(config_name))
    rows: list[dict[str, Any]] = []
    for index, sample in enumerate(samples, start=1):
        print(f"[retrieval:{config_name}] {index}/{len(samples)} {sample.id}", flush=True)
        started = time.perf_counter()
        error = None
        evidence = None
        try:
            evidence = service.retrieve_evidence(question=sample.question, top_k=k)
        except Exception as exc:  # pragma: no cover - live provider/db dependent
            error = type(exc).__name__
        latency = time.perf_counter() - started

        contexts = evidence.contexts if evidence else []
        retrieved_docs = [document_from_context(context) for context in contexts if document_from_context(context)]
        retrieved_keys = [source_key_from_context(context) for context in contexts]
        expected_docs = sample.expected_documents
        expected_keys = sample.expected_source_keys
        expected_fallback = sample.expected.answer_type == "fallback"
        produced_fallback = not evidence or not evidence.found

        rows.append(
            {
                "sample_id": sample.id,
                "suite": "retrieval",
                "config": config_name,
                "category": sample.category,
                "difficulty": sample.difficulty.value,
                "retrieval_recall_at_5": recall_at_k(expected_docs, retrieved_docs, k),
                "retrieval_precision_at_5": precision_at_k(expected_docs, retrieved_docs, k),
                "retrieval_mrr": reciprocal_rank(expected_docs, retrieved_docs),
                "retrieval_ndcg_at_5": graded_ndcg_at_k(expected_keys, retrieved_keys, k),
                "fallback_accuracy": fallback_accuracy(expected_fallback, produced_fallback),
                "expected_docs": expected_docs,
                "retrieved_docs": retrieved_docs,
                "retrieved_keys": retrieved_keys,
                "confidence": evidence.confidence if evidence else 0.0,
                "retrieved_count": evidence.retrieved_count if evidence else 0,
                "latency_seconds": latency,
                "provider_error": 1.0 if error else 0.0,
                "error": error,
            }
        )
    return rows


def run_agent(samples: list[EvaluationSample], *, config_name: str = "agent_full") -> list[dict[str, Any]]:
    from src.agent.executor import SmartCampusAgent
    from src.core.auth import AuthenticatedUser

    agent = SmartCampusAgent()
    rows: list[dict[str, Any]] = []
    for index, sample in enumerate(samples, start=1):
        print(f"[agent:{config_name}] {index}/{len(samples)} {sample.id}", flush=True)
        started = time.perf_counter()
        selected_tool = None
        error = None
        result = None
        try:
            user = AuthenticatedUser(
                user_id=sample.user_fixture,
                role=_role_from_fixture(sample.user_fixture),
                access_token="eval-token",
                profile={"id": sample.user_fixture, "role": _role_from_fixture(sample.user_fixture)},
            )
            result = agent.answer_query(user=user, message=sample.question, history=sample.history)
            for step in result.trace or []:
                if getattr(step, "tool", None):
                    selected_tool = step.tool
                    break
        except Exception as exc:  # pragma: no cover - live provider/db dependent
            error = type(exc).__name__
        latency = time.perf_counter() - started

        acceptable = set(sample.expected.acceptable_tools)
        expected_tool = sample.expected.expected_tool
        tool_ok = (selected_tool in acceptable) if acceptable else selected_tool is None
        action = sample.expected.action
        proposal = getattr(result, "proposal", None) if result else None
        rows.append(
            {
                "sample_id": sample.id,
                "suite": "agent",
                "config": config_name,
                "category": sample.category,
                "difficulty": sample.difficulty.value,
                "expected_tool": expected_tool,
                "selected_tool": selected_tool,
                "tool_selection_accuracy": 1.0 if tool_ok else 0.0,
                "proposal_created": 1.0 if proposal else 0.0,
                "pre_confirm_action_count": 0.0,
                "answer_type": getattr(result, "answer_type", "error") if result else "error",
                "latency_seconds": latency,
                "provider_error": 1.0 if error else 0.0,
                "error": error,
                "expected_action": action.model_dump(mode="json") if action else None,
            }
        )
    return rows


def _role_from_fixture(fixture: str) -> str:
    if fixture.startswith("lecturer"):
        return "lecturer"
    if fixture.startswith("admin"):
        return "admin"
    if fixture.startswith("super_admin"):
        return "super_admin"
    if fixture.startswith("canteen"):
        return "canteen_admin"
    return "student"
