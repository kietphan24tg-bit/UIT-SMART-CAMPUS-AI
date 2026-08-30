from __future__ import annotations

import csv
import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from statistics import mean
from typing import Any

from .metrics import bootstrap_ci, mean_metric, paired_bootstrap_delta, paired_stats

HARD_GATES: dict[str, tuple[str, float]] = {
    "retrieval_recall_at_5": (">=", 0.90),
    "citation_correctness": (">=", 0.95),
    "faithfulness": (">=", 0.90),
    "answer_relevance": (">=", 0.90),
    "completeness": (">=", 0.85),
    "retrieval_p95_latency_seconds": ("<", 15.0),
    "provider_error_rate": ("<", 0.02),
}


def evaluate_gate(metric: str, value: float) -> bool:
    operator, threshold = HARD_GATES[metric]
    if operator == ">=":
        return value >= threshold
    if operator == "<":
        return value < threshold
    if operator == "==":
        return value == threshold
    raise ValueError(f"Unsupported gate operator: {operator}")


def _percentile(values: list[float], percentile: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    index = max(0, min(len(ordered) - 1, int((len(ordered) * percentile) + 0.999999) - 1))
    return ordered[index]


def _retrieval_diagnostic(rows: list[dict[str, Any]]) -> dict[str, float | int]:
    answerable_rows = [row for row in rows if row.get("answerable") == 1.0]
    corpus_gap_rows = [row for row in rows if row.get("corpus_gap") == 1.0]
    out_of_scope_security_rows = [
        row for row in corpus_gap_rows if row.get("category") in {"out_of_scope", "security"}
    ]
    latencies = [float(row["latency_seconds"]) for row in rows if isinstance(row.get("latency_seconds"), int | float)]

    def average(key: str, selected_rows: list[dict[str, Any]]) -> float:
        return mean_metric(
            float(row[key]) for row in selected_rows if isinstance(row.get(key), int | float)
        )

    return {
        "sample_count": len(rows),
        "answerable_count": len(answerable_rows),
        "corpus_gap_count": len(corpus_gap_rows),
        "corpus_coverage": len(answerable_rows) / len(rows) if rows else 0.0,
        "answerable_recall_at_5": average("retrieval_recall_at_5", answerable_rows),
        "answerable_primary_recall_at_5": average(
            "retrieval_primary_recall_at_5", answerable_rows
        ),
        "answerable_primary_heading_recall_at_5": average(
            "retrieval_primary_heading_recall_at_5", answerable_rows
        ),
        "answerable_precision_at_5": average("retrieval_precision_at_5", answerable_rows),
        "answerable_mrr": average("retrieval_mrr", answerable_rows),
        "answerable_ndcg_at_5": average("retrieval_ndcg_at_5", answerable_rows),
        "corpus_gap_fallback_accuracy": average("fallback_accuracy", corpus_gap_rows),
        "fallback_accuracy_out_of_scope_security": average(
            "fallback_accuracy", out_of_scope_security_rows
        ),
        "provider_error_rate": average("provider_error", rows),
        "latency_p50_seconds": _percentile(latencies, 0.50),
        "latency_p95_seconds": _percentile(latencies, 0.95),
        "latency_p99_seconds": _percentile(latencies, 0.99),
    }


def summarize_rows(rows: list[dict[str, Any]]) -> dict[str, Any]:
    numeric_keys = sorted({key for row in rows for key, value in row.items() if isinstance(value, int | float)})
    metrics = {}
    for key in numeric_keys:
        values = [float(row[key]) for row in rows if isinstance(row.get(key), int | float)]
        if values:
            low, high = bootstrap_ci(values, resamples=1000)
            metrics[key] = {"mean": mean(values), "ci95": [low, high]}

    category_rows: dict[str, list[dict[str, Any]]] = defaultdict(list)
    config_rows: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        category_rows[str(row.get("category", "unknown"))].append(row)
        config_rows[str(row.get("config", "default"))].append(row)

    by_category = {}
    for category, category_values in category_rows.items():
        by_category[category] = {
            key: mean_metric(float(row[key]) for row in category_values if isinstance(row.get(key), int | float))
            for key in numeric_keys
        }
    by_config = {}
    for config, config_values in config_rows.items():
        by_config[config] = {
            key: mean_metric(float(row[key]) for row in config_values if isinstance(row.get(key), int | float))
            for key in numeric_keys
        }

    retrieval_rows = [row for row in rows if row.get("suite") == "retrieval"]
    answerable_rows = [row for row in retrieval_rows if row.get("answerable") == 1.0]
    diagnostic = {
        "corpus_coverage": mean_metric(float(row.get("answerable", 0.0)) for row in retrieval_rows) if retrieval_rows else 0.0,
        "answerable_recall_at_5": mean_metric(float(row["retrieval_recall_at_5"]) for row in answerable_rows if isinstance(row.get("retrieval_recall_at_5"), int | float)),
        "source_unit_correct": mean_metric(float(row["source_unit_correct"]) for row in retrieval_rows if isinstance(row.get("source_unit_correct"), int | float)),
        "domain_correct": mean_metric(float(row["domain_correct"]) for row in retrieval_rows if isinstance(row.get("domain_correct"), int | float)),
    }
    retrieval_by_config = {
        config: _retrieval_diagnostic(config_values)
        for config, config_values in sorted(config_rows.items())
        if any(row.get("suite") == "retrieval" for row in config_values)
    }
    retrieval_by_category_config = {
        config: {
            category: _retrieval_diagnostic(
                [row for row in config_values if row.get("category") == category]
            )
            for category in sorted({str(row.get("category", "unknown")) for row in config_values})
        }
        for config, config_values in sorted(config_rows.items())
        if any(row.get("suite") == "retrieval" for row in config_values)
    }
    paired_deltas: dict[str, Any] = {}
    if retrieval_rows:
        baseline = [row for row in retrieval_rows if row.get("config") == "vector_baseline"]
        baseline_by_id = {row["sample_id"]: row for row in baseline}
        for candidate_name in sorted({str(row.get("config")) for row in retrieval_rows if row.get("config") != "vector_baseline"}):
            candidate_rows = [row for row in retrieval_rows if row.get("config") == candidate_name]
            baseline_values: list[float] = []
            candidate_values: list[float] = []
            for row in candidate_rows:
                baseline_row = baseline_by_id.get(row["sample_id"])
                if not baseline_row:
                    continue
                if not isinstance(row.get("retrieval_recall_at_5"), int | float):
                    continue
                if not isinstance(baseline_row.get("retrieval_recall_at_5"), int | float):
                    continue
                baseline_values.append(float(baseline_row["retrieval_recall_at_5"]))
                candidate_values.append(float(row["retrieval_recall_at_5"]))
            if baseline_values and candidate_values:
                delta, ci = paired_bootstrap_delta(baseline_values, candidate_values, resamples=1000)
                paired_deltas[candidate_name] = {"recall_at_5_delta": delta, "ci95": list(ci)}

    answer_rows = [row for row in rows if row.get("suite") == "answer"]
    answer_paired_bootstrap: dict[str, Any] = {}
    answer_by_config: dict[str, Any] = {}
    if answer_rows:
        for config, config_values in sorted(config_rows.items()):
            ans_cfg_rows = [r for r in config_values if r.get("suite") == "answer"]
            if not ans_cfg_rows:
                continue

            valid_rows = [
                r for r in ans_cfg_rows
                if float(r.get("provider_error", 0.0)) == 0.0 and float(r.get("judge_error_rate", 0.0)) == 0.0
            ]

            def cfg_mean(key: str, selected: list[dict[str, Any]]) -> float:
                vals = [float(r[key]) for r in selected if key in r and isinstance(r.get(key), (int, float))]
                return mean(vals) if vals else 0.0

            def cfg_latencies(key: str, selected: list[dict[str, Any]]) -> dict[str, float] | None:
                vals = [float(r[key]) for r in selected if key in r and isinstance(r.get(key), (int, float))]
                if not vals:
                    return None
                return {
                    "mean": mean(vals),
                    "p50": _percentile(vals, 0.50),
                    "p95": _percentile(vals, 0.95),
                    "p99": _percentile(vals, 0.99),
                }

            answer_by_config[config] = {
                "sample_count": len(ans_cfg_rows),
                "valid_sample_count": len(valid_rows),
                "provider_error_rate": cfg_mean("provider_error", ans_cfg_rows),
                "judge_error_rate": cfg_mean("judge_error_rate", ans_cfg_rows),
                "faithfulness": cfg_mean("faithfulness", valid_rows),
                "answer_relevance": cfg_mean("answer_relevance", valid_rows),
                "completeness": cfg_mean("completeness", valid_rows),
                "citation_correctness": cfg_mean("citation_correctness", valid_rows),
                "rag_latency": cfg_latencies("rag_latency_seconds", ans_cfg_rows) if "rag_latency_seconds" in ans_cfg_rows[0] else cfg_latencies("latency_seconds", ans_cfg_rows),
                "llm_latency": cfg_latencies("llm_latency_seconds", ans_cfg_rows),
                "judge_latency": cfg_latencies("judge_latency_seconds", ans_cfg_rows),
                "eval_wall_time": cfg_latencies("eval_wall_time_seconds", ans_cfg_rows),
            }

        baseline_answer = [row for row in answer_rows if row.get("config") == "vector_baseline"]
        if baseline_answer:
            candidate_names = sorted(
                {str(row.get("config")) for row in answer_rows if row.get("config") != "vector_baseline"}
            )
            for cand_name in candidate_names:
                cand_metrics: dict[str, Any] = {}
                for m in ["faithfulness", "answer_relevance", "completeness", "citation_correctness"]:
                    from .offline_analysis import extract_paired_vectors
                    base_vals, cand_vals, _ = extract_paired_vectors(
                        answer_rows, "vector_baseline", cand_name, m
                    )
                    cand_metrics[m] = paired_stats(base_vals, cand_vals, seed=42, resamples=10000)
                if cand_metrics:
                    answer_paired_bootstrap[cand_name] = cand_metrics

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "sample_count": len(rows),
        "metrics": metrics,
        "by_category": by_category,
        "by_config": by_config,
        "diagnostic": diagnostic,
        "retrieval_by_config": retrieval_by_config,
        "retrieval_by_category_config": retrieval_by_category_config,
        "paired_bootstrap": paired_deltas,
        "answer_by_config": answer_by_config,
        "answer_paired_bootstrap": answer_paired_bootstrap,
    }


def write_report(rows: list[dict[str, Any]], output_dir: Path, *, title: str = "Smart Campus Evaluation") -> dict[str, Any]:
    output_dir.mkdir(parents=True, exist_ok=True)
    summary = summarize_rows(rows)
    summary_path = output_dir / "summary.json"
    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")

    raw_path = output_dir / "raw.jsonl"
    with raw_path.open("w", encoding="utf-8", newline="\n") as file:
        for row in rows:
            file.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")

    csv_path = output_dir / "by_category.csv"
    categories = summary["by_category"]
    fieldnames = ["category"]
    for values in categories.values():
        for key in values:
            if key not in fieldnames:
                fieldnames.append(key)
    with csv_path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        for category, values in sorted(categories.items()):
            writer.writerow({"category": category, **values})

    lines = [f"# {title}", "", f"Generated: {summary['generated_at']}", f"Samples: {summary['sample_count']}", "", "## Metrics"]
    for key, payload in sorted(summary["metrics"].items()):
        ci_low, ci_high = payload["ci95"]
        lines.append(f"- {key}: {payload['mean']:.4f} (95% CI {ci_low:.4f}-{ci_high:.4f})")

    if summary.get("answer_by_config"):
        lines.extend(["", "## Answer Quality By Config", ""])
        lines.append("| Config | Samples | Valid | Provider Error Rate | Faithfulness | Answer Relevance | Completeness | Citation Correctness |")
        lines.append("| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |")
        for cfg, p in summary["answer_by_config"].items():
            lines.append(
                f"| {cfg} | {p['sample_count']} | {p['valid_sample_count']} | {p['provider_error_rate']:.4f} | "
                f"{p['faithfulness']:.4f} | {p['answer_relevance']:.4f} | {p['completeness']:.4f} | {p['citation_correctness']:.4f} |"
            )

        lines.extend(["", "## Answer Latency Distributions (Seconds)", ""])
        lines.append("| Config | RAG Latency (p50/p95/p99/mean) | LLM Latency (p50/p95/p99/mean) | Judge Latency (p50/p95/p99/mean) | Total Wall Time (p50/p95/p99/mean) |")
        lines.append("| --- | --- | --- | --- | --- |")
        def format_latency(payload: dict[str, float] | None) -> str:
            if payload is None:
                return "N/A"
            return (
                f"{payload['p50']:.2f}s / {payload['p95']:.2f}s / "
                f"{payload['p99']:.2f}s (m={payload['mean']:.2f}s)"
            )

        for cfg, p in summary["answer_by_config"].items():
            rag_lat = p["rag_latency"]
            llm_lat = p["llm_latency"]
            jdg_lat = p["judge_latency"]
            wall_lat = p["eval_wall_time"]
            lines.append(
                f"| {cfg} | {format_latency(rag_lat)} | {format_latency(llm_lat)} | "
                f"{format_latency(jdg_lat)} | {format_latency(wall_lat)} |"
            )

    if summary.get("answer_paired_bootstrap"):
        lines.extend(["", "## Answer Paired Differences vs Vector Baseline", ""])
        lines.append("| Candidate Config | Metric | Mean Diff (cand - base) | 95% Bootstrap CI | Paired p-value | Significant (p < 0.05) |")
        lines.append("| --- | --- | ---: | ---: | ---: | :---: |")
        for cand, metrics in summary["answer_paired_bootstrap"].items():
            for m, stats in metrics.items():
                diff = stats["candidate_minus_baseline_mean_diff"]
                ci_low, ci_high = stats["ci95"]
                pval = stats["p_value"]
                sig = "Yes" if pval < 0.05 else "No"
                lines.append(
                    f"| {cand} | {m} | {diff:+.4f} | [{ci_low:+.4f}, {ci_high:+.4f}] | {pval:.4f} | {sig} |"
                )

    if summary["retrieval_by_config"]:
        lines.extend(["", "## Retrieval By Config"])
        for config, payload in summary["retrieval_by_config"].items():
            lines.extend(
                [
                    "",
                    f"### {config}",
                    f"- Answerable Recall@5: {payload['answerable_recall_at_5']:.4f}",
                    f"- Primary-source Recall@5: {payload['answerable_primary_recall_at_5']:.4f}",
                    f"- Primary-heading Recall@5: {payload['answerable_primary_heading_recall_at_5']:.4f}",
                    f"- Answerable Precision@5: {payload['answerable_precision_at_5']:.4f}",
                    f"- MRR: {payload['answerable_mrr']:.4f}",
                    f"- nDCG@5: {payload['answerable_ndcg_at_5']:.4f}",
                    f"- Corpus-gap fallback accuracy: {payload['corpus_gap_fallback_accuracy']:.4f}",
                    f"- P95 latency: {payload['latency_p95_seconds']:.3f}s",
                    f"- Provider error rate: {payload['provider_error_rate']:.4f}",
                ]
            )
    report_path = output_dir / "report.md"
    report_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return summary
