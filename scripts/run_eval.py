"""Run retrieval evaluation: vector-only vs hybrid search.

Measures Recall@K, MRR, Precision@K for each configuration.
Compares whether hybrid search actually improves retrieval quality.
"""
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.core.config import settings
from src.retrieval.hybrid_retriever import HybridRetriever
from src.vectorstores.pgvector import PgVectorStore
from src.embeddings.provider import create_embedding_provider


def load_samples():
    path = Path(__file__).resolve().parents[1] / "tests" / "evaluation" / "dataset" / "samples.json"
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def compute_recall(expected_docs: list[str], retrieved_docs: list[str], k: int) -> float:
    if not expected_docs:
        return 0.0
    retrieved_set = set(retrieved_docs[:k])
    expected_set = set(expected_docs)
    hits = len(retrieved_set & expected_set)
    return hits / len(expected_set)


def compute_mrr(expected_docs: list[str], retrieved_docs: list[str]) -> float:
    if not expected_docs:
        return 0.0
    expected_set = set(expected_docs)
    for i, doc in enumerate(retrieved_docs):
        if doc in expected_set:
            return 1.0 / (i + 1)
    return 0.0


def compute_precision(expected_docs: list[str], retrieved_docs: list[str], k: int) -> float:
    if not expected_docs:
        return 0.0
    retrieved_set = set(retrieved_docs[:k])
    expected_set = set(expected_docs)
    hits = len(retrieved_set & expected_set)
    return hits / min(k, len(retrieved_docs)) if retrieved_docs else 0.0


def run_eval_config(config_name: str, hybrid_enabled: bool, samples: list[dict], top_k: int = 6):
    """Run evaluation for a single configuration."""
    print(f"\n{'='*60}")
    print(f"CONFIG: {config_name}")
    print(f"  hybrid_search_enabled = {hybrid_enabled}")
    print(f"  top_k = {top_k}")
    print(f"{'='*60}")

    # Override hybrid setting
    settings.hybrid_search_enabled = hybrid_enabled

    embedder = create_embedding_provider(settings, batch_size=1)
    store = PgVectorStore(
        database_url=settings.database_url or "",
        schema=settings.rag_db_schema,
        dimensions=settings.embedding_dimensions,
    )
    retriever = HybridRetriever(config=settings, embedder=embedder, vector_store=store)
    
    from src.reranking.provider import create_reranker
    reranker = create_reranker(settings) if config_name == "hybrid_rerank" else None

    recalls = []
    mrrs = []
    precisions = []
    latencies = []
    category_metrics = {}

    in_scope_samples = [s for s in samples if s["category"] != "out_of_scope"]
    oos_samples = [s for s in samples if s["category"] == "out_of_scope"]

    # Evaluate in-scope questions
    for i, sample in enumerate(in_scope_samples):
        question = sample["question"]
        expected_docs = sample.get("expected_documents", [])
        cat = sample["category"]

        start = time.time()
        try:
            candidate_k = settings.retrieval_candidate_k if reranker else top_k
            results = retriever.retrieve(question, candidate_k=candidate_k, top_k=candidate_k)
            if reranker and results:
                results = reranker.rerank(question, results, top_k=top_k)
                results = [r for r in results if r.score >= settings.reranker_min_score]
        except Exception as e:
            print(f"  ERROR [{sample['id']}]: {e}")
            continue
        elapsed = time.time() - start
        latencies.append(elapsed)

        retrieved_docs = [r.metadata.get("source_file", "") for r in results]
        retrieved_docs_unique = list(dict.fromkeys(retrieved_docs))  # dedupe preserving order

        recall = compute_recall(expected_docs, retrieved_docs_unique, top_k)
        mrr = compute_mrr(expected_docs, retrieved_docs_unique)
        precision = compute_precision(expected_docs, retrieved_docs_unique, top_k)

        recalls.append(recall)
        mrrs.append(mrr)
        precisions.append(precision)

        if cat not in category_metrics:
            category_metrics[cat] = {"recalls": [], "mrrs": [], "precisions": []}
        category_metrics[cat]["recalls"].append(recall)
        category_metrics[cat]["mrrs"].append(mrr)
        category_metrics[cat]["precisions"].append(precision)

        status = "HIT" if recall > 0 else "MISS"
        print(f"  [{status}] {sample['id']:12s} | R@{top_k}={recall:.2f} | MRR={mrr:.2f} | {elapsed:.2f}s | {question[:50]}")

    # Evaluate out-of-scope questions (should return low confidence)
    oos_correct = 0
    for sample in oos_samples:
        question = sample["question"]
        start = time.time()
        try:
            candidate_k = settings.retrieval_candidate_k if reranker else top_k
            results = retriever.retrieve(question, candidate_k=candidate_k, top_k=candidate_k)
            if reranker and results:
                results = reranker.rerank(question, results, top_k=top_k)
                results = [r for r in results if r.score >= settings.reranker_min_score]
            else:
                results = results[:top_k]
        except Exception:
            oos_correct += 1  # Error = no results = correct for OOS
            continue
        elapsed = time.time() - start

        top_score = results[0].score if results else 0.0
        is_low = top_score < settings.answer_min_confidence
        if is_low or not results:
            oos_correct += 1
            status = "OK"
        else:
            status = "BAD"
        print(f"  [{status}] {sample['id']:12s} | score={top_score:.3f} | {elapsed:.2f}s | OOS: {question[:50]}")

    # Summary
    avg_recall = sum(recalls) / len(recalls) if recalls else 0
    avg_mrr = sum(mrrs) / len(mrrs) if mrrs else 0
    avg_precision = sum(precisions) / len(precisions) if precisions else 0
    avg_latency = sum(latencies) / len(latencies) if latencies else 0
    oos_accuracy = oos_correct / len(oos_samples) if oos_samples else 0

    print(f"\n--- SUMMARY: {config_name} ---")
    print(f"  Recall@{top_k}:     {avg_recall:.4f}")
    print(f"  MRR:            {avg_mrr:.4f}")
    print(f"  Precision@{top_k}:  {avg_precision:.4f}")
    print(f"  OOS Accuracy:   {oos_accuracy:.2%} ({oos_correct}/{len(oos_samples)})")
    print(f"  Avg Latency:    {avg_latency:.2f}s")

    # Per-category breakdown
    print(f"\n  Per-category:")
    for cat, m in sorted(category_metrics.items()):
        cr = sum(m["recalls"]) / len(m["recalls"]) if m["recalls"] else 0
        cm = sum(m["mrrs"]) / len(m["mrrs"]) if m["mrrs"] else 0
        print(f"    {cat:25s} | R@{top_k}={cr:.3f} | MRR={cm:.3f} | n={len(m['recalls'])}")

    return {
        "config": config_name,
        "recall": avg_recall,
        "mrr": avg_mrr,
        "precision": avg_precision,
        "oos_accuracy": oos_accuracy,
        "avg_latency": avg_latency,
    }


def main():
    samples = load_samples()
    print(f"Loaded {len(samples)} evaluation samples")

    results = []

    # Config 1: Vector-only baseline
    r1 = run_eval_config("vector_baseline", hybrid_enabled=False, samples=samples)
    results.append(r1)

    # Config 2: Hybrid (vector + keyword + RRF)
    r2 = run_eval_config("hybrid_rrf", hybrid_enabled=True, samples=samples)
    results.append(r2)

    # Config 3: Hybrid + Reranker
    # Reranker is enabled by default now via .env (settings.reranker_enabled)
    r3 = run_eval_config("hybrid_rerank", hybrid_enabled=True, samples=samples)
    results.append(r3)

    # Comparison
    print(f"\n{'='*60}")
    print("COMPARISON")
    print(f"{'='*60}")
    print(f"{'Config':<20s} | {'Recall@6':>10s} | {'MRR':>10s} | {'Precision@6':>12s} | {'OOS Acc':>8s} | {'Latency':>8s}")
    print("-" * 80)
    for r in results:
        print(f"{r['config']:<20s} | {r['recall']:>10.4f} | {r['mrr']:>10.4f} | {r['precision']:>12.4f} | {r['oos_accuracy']:>7.1%} | {r['avg_latency']:>7.2f}s")

    if len(results) >= 3:
        delta_recall = results[2]["recall"] - results[0]["recall"]
        delta_mrr = results[2]["mrr"] - results[0]["mrr"]
        print(f"\nHybrid+Rerank vs Baseline:")
        print(f"  Recall delta: {delta_recall:+.4f}")
        print(f"  MRR delta:    {delta_mrr:+.4f}")

    # Save results
    outpath = Path(__file__).resolve().parents[1] / "tests" / "evaluation" / "results.json"
    with open(outpath, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\nResults saved to {outpath}")


if __name__ == "__main__":
    main()
