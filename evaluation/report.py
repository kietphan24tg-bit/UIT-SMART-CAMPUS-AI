from __future__ import annotations

import csv
import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from statistics import mean
from typing import Any

from .metrics import bootstrap_ci, mean_metric

HARD_GATES: dict[str, tuple[str, float]] = {
    "tool_selection_accuracy": (">=", 0.95),
    "retrieval_recall_at_5": (">=", 0.90),
    "citation_correctness": (">=", 0.95),
    "faithfulness": (">=", 0.90),
    "answer_relevance": (">=", 0.90),
    "completeness": (">=", 0.85),
    "pre_confirm_action_count": ("==", 0.0),
    "cross_user_access_count": ("==", 0.0),
    "duplicate_action_count": ("==", 0.0),
    "read_p95_latency_seconds": ("<", 15.0),
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
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "sample_count": len(rows),
        "metrics": metrics,
        "by_category": by_category,
        "by_config": by_config,
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
    report_path = output_dir / "report.md"
    report_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return summary
