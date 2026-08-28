from __future__ import annotations

import csv
import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from statistics import mean
from typing import Any

from .metrics import bootstrap_ci, mean_metric, paired_bootstrap_delta

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
    if summary["retrieval_by_config"]:
        lines.extend(["", "## Retrieval By Config"])
        for config, payload in summary["retrieval_by_config"].items():
            lines.extend(
                [
                    "",
                    f"### {config}",
                    f"- Answerable Recall@5: {payload['answerable_recall_at_5']:.4f}",
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
