"""Evaluation runner for the RAG pipeline.

Usage
-----
# Run against the live service (requires DATABASE_URL + GEMINI_KEY + GROQ_KEY):
    python -m tests.evaluation.run_eval --config vector_baseline

# Or compare multiple configs:
    python -m tests.evaluation.run_eval --config hybrid --config hybrid_reranker

Each run prints a results table and saves JSON results to tests/evaluation/results/.

Configs
-------
    vector_baseline  : pure vector search, no hybrid, no reranker
    hybrid           : hybrid_search_enabled=True, reranker_enabled=False
    hybrid_reranker  : hybrid_search_enabled=True, reranker_enabled=True
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

# Allow running as: python -m tests.evaluation.run_eval
sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from src.core.config import settings
from src.rag.service import RagService
from tests.evaluation.metrics import (
    mean_ndcg_at_k,
    mean_recall_at_k,
    mean_reciprocal_rank,
)

DATASET_PATH = Path(__file__).parent / "dataset" / "samples.json"
RESULTS_DIR = Path(__file__).parent / "results"

# Config presets: override settings fields
CONFIG_PRESETS: dict[str, dict] = {
    "vector_baseline": {
        "hybrid_search_enabled": False,
        "reranker_enabled": False,
    },
    "hybrid": {
        "hybrid_search_enabled": True,
        "reranker_enabled": False,
    },
    "hybrid_reranker": {
        "hybrid_search_enabled": True,
        "reranker_enabled": True,
    },
}


@dataclass
class EvalResult:
    sample_id: str
    question: str
    answer_type: str
    confidence: float
    retrieved_docs: list[str]
    expected_docs: list[str]
    recall_at_5: float
    mrr: float
    ndcg_at_5: float
    answer: str = ""
    error: str = ""
    extra: dict = field(default_factory=dict)


def load_dataset(path: Path = DATASET_PATH) -> list[dict]:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def run_eval(config_name: str, k: int = 5) -> list[EvalResult]:
    """Run the full evaluation for a given config preset."""
    preset = CONFIG_PRESETS.get(config_name)
    if preset is None:
        raise ValueError(f"Unknown config: {config_name!r}. Choose from {list(CONFIG_PRESETS)}")

    # Patch settings via env vars (pydantic-settings reads env at construction time)
    for key, value in preset.items():
        os.environ[key.upper()] = str(value).lower()

    # Re-create settings with patched env
    from src.core.config import Settings
    patched_settings = Settings()

    service = RagService(config=patched_settings)
    samples = load_dataset()

    results: list[EvalResult] = []
    for i, sample in enumerate(samples, start=1):
        print(f"  [{i}/{len(samples)}] {sample['id']}: {sample['question'][:60]}...")
        try:
            response = service.answer(
                question=sample["question"],
                include_context=True,
            )
            retrieved_docs = [
                c.citation.source_file
                for c in (response.contexts or [])
                if c.citation.source_file
            ]
            expected_docs: list[str] = sample.get("expected_documents") or []

            rr = mean_reciprocal_rank([{"expected_docs": expected_docs, "retrieved_docs": retrieved_docs}])
            r5 = mean_recall_at_k([{"expected_docs": expected_docs, "retrieved_docs": retrieved_docs}], k=k)
            n5 = mean_ndcg_at_k([{"expected_docs": expected_docs, "retrieved_docs": retrieved_docs}], k=k)

            # Out-of-scope check: expected_answer == "fallback"
            if sample.get("expected_answer") == "fallback":
                rr = r5 = n5 = 1.0 if response.answer_type == "fallback" else 0.0

            results.append(EvalResult(
                sample_id=sample["id"],
                question=sample["question"],
                answer_type=response.answer_type,
                confidence=response.confidence,
                retrieved_docs=retrieved_docs,
                expected_docs=expected_docs,
                recall_at_5=r5,
                mrr=rr,
                ndcg_at_5=n5,
                answer=response.answer[:200],
            ))
        except Exception as exc:
            results.append(EvalResult(
                sample_id=sample["id"],
                question=sample["question"],
                answer_type="error",
                confidence=0.0,
                retrieved_docs=[],
                expected_docs=sample.get("expected_documents") or [],
                recall_at_5=0.0,
                mrr=0.0,
                ndcg_at_5=0.0,
                error=str(exc),
            ))

    return results


def print_summary(config_name: str, results: list[EvalResult]) -> None:
    avg_r5 = sum(r.recall_at_5 for r in results) / len(results) if results else 0
    avg_mrr = sum(r.mrr for r in results) / len(results) if results else 0
    avg_ndcg = sum(r.ndcg_at_5 for r in results) / len(results) if results else 0
    errors = sum(1 for r in results if r.error)
    fallbacks = sum(1 for r in results if r.answer_type == "fallback")

    print(f"\n{'='*60}")
    print(f"Config: {config_name}")
    print(f"{'='*60}")
    print(f"  Samples  : {len(results)}")
    print(f"  Errors   : {errors}")
    print(f"  Fallbacks: {fallbacks}")
    print(f"  Recall@5 : {avg_r5:.3f}")
    print(f"  MRR      : {avg_mrr:.3f}")
    print(f"  NDCG@5   : {avg_ndcg:.3f}")
    print(f"{'='*60}\n")


def save_results(config_name: str, results: list[EvalResult]) -> Path:
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    out_path = RESULTS_DIR / f"{config_name}_{ts}.json"
    payload = [r.__dict__ for r in results]
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print(f"Results saved → {out_path}")
    return out_path


def main() -> None:
    parser = argparse.ArgumentParser(description="RAG evaluation runner")
    parser.add_argument(
        "--config",
        action="append",
        dest="configs",
        default=[],
        choices=list(CONFIG_PRESETS),
        help="Config preset to evaluate (can specify multiple times)",
    )
    parser.add_argument("--k", type=int, default=5, help="Cut-off rank for Recall@K and NDCG@K")
    args = parser.parse_args()

    configs = args.configs or ["vector_baseline"]

    for config_name in configs:
        print(f"\nRunning evaluation: {config_name} …")
        results = run_eval(config_name, k=args.k)
        print_summary(config_name, results)
        save_results(config_name, results)


if __name__ == "__main__":
    main()
