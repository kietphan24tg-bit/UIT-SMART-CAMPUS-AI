"""Offline error analysis and paired statistics for RAG answer evaluation."""

from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any

from .metrics import mean_metric, paired_stats

METRICS_OF_INTEREST = [
    "faithfulness",
    "answer_relevance",
    "completeness",
    "citation_correctness",
]


def extract_paired_vectors(
    rows: list[dict[str, Any]],
    baseline_config: str,
    candidate_config: str,
    metric_key: str,
) -> tuple[list[float], list[float], list[str]]:
    """Extract paired metric vectors for baseline and candidate configs.

    Fails explicitly if there are missing or duplicate sample IDs.
    """
    baseline_rows = [r for r in rows if r.get("config") == baseline_config]
    candidate_rows = [r for r in rows if r.get("config") == candidate_config]

    if not baseline_rows:
        raise ValueError(f"Baseline config {baseline_config!r} not found in dataset rows")
    if not candidate_rows:
        raise ValueError(f"Candidate config {candidate_config!r} not found in dataset rows")

    baseline_ids = [r["sample_id"] for r in baseline_rows]
    candidate_ids = [r["sample_id"] for r in candidate_rows]

    if len(baseline_ids) != len(set(baseline_ids)):
        duplicates = sorted({x for x in baseline_ids if baseline_ids.count(x) > 1})
        raise ValueError(
            f"Duplicate sample_id found in baseline config {baseline_config!r}: {duplicates}"
        )

    if len(candidate_ids) != len(set(candidate_ids)):
        duplicates = sorted({x for x in candidate_ids if candidate_ids.count(x) > 1})
        raise ValueError(
            f"Duplicate sample_id found in candidate config {candidate_config!r}: {duplicates}"
        )

    if set(baseline_ids) != set(candidate_ids):
        missing = sorted(set(baseline_ids).symmetric_difference(set(candidate_ids)))
        raise ValueError(
            f"Sample ID mismatch between baseline {baseline_config!r} and candidate {candidate_config!r}: missing {missing}"
        )

    baseline_by_id = {r["sample_id"]: r for r in baseline_rows}
    candidate_by_id = {r["sample_id"]: r for r in candidate_rows}

    sample_ids = sorted(baseline_by_id.keys())
    base_vals: list[float] = []
    cand_vals: list[float] = []

    for sid in sample_ids:
        b_val = baseline_by_id[sid].get(metric_key)
        c_val = candidate_by_id[sid].get(metric_key)
        if b_val is None or c_val is None:
            raise ValueError(f"Missing metric {metric_key!r} for sample {sid}")
        base_vals.append(float(b_val))
        cand_vals.append(float(c_val))

    return base_vals, cand_vals, sample_ids


def compute_offline_error_analysis(
    rows: list[dict[str, Any]],
    baseline_config: str = "vector_baseline",
    seed: int = 42,
    resamples: int = 10_000,
) -> dict[str, Any]:
    """Compute paired statistics and per-sample error analysis on evaluation rows."""
    all_configs = sorted({str(r.get("config")) for r in rows if r.get("config")})
    if baseline_config not in all_configs:
        raise ValueError(f"Baseline config {baseline_config!r} not in available configs: {all_configs}")

    candidate_configs = [c for c in all_configs if c != baseline_config]

    baseline_rows = [r for r in rows if r.get("config") == baseline_config]
    baseline_by_id = {r["sample_id"]: r for r in baseline_rows}
    sample_count = len(baseline_rows)

    paired_comparisons: dict[str, dict[str, Any]] = {}
    error_analysis_by_candidate: dict[str, Any] = {}

    for cand_config in candidate_configs:
        cand_rows = [r for r in rows if r.get("config") == cand_config]
        cand_by_id = {r["sample_id"]: r for r in cand_rows}

        metric_paired_stats: dict[str, Any] = {}
        for metric in METRICS_OF_INTEREST:
            base_vals, cand_vals, _ = extract_paired_vectors(
                rows, baseline_config, cand_config, metric
            )
            stats = paired_stats(base_vals, cand_vals, seed=seed, resamples=resamples)
            metric_paired_stats[metric] = {
                "baseline_mean": mean_metric(base_vals),
                "candidate_mean": mean_metric(cand_vals),
                "candidate_minus_baseline_mean_diff": stats["candidate_minus_baseline_mean_diff"],
                "ci95": stats["ci95"],
                "p_value": stats["p_value"],
                "n_samples": stats["n_samples"],
            }
        paired_comparisons[cand_config] = metric_paired_stats

        # Per-sample deltas and error analysis
        sample_deltas: list[dict[str, Any]] = []
        counts: dict[str, dict[str, int]] = {
            metric: {"improvements": 0, "regressions": 0, "ties": 0}
            for metric in METRICS_OF_INTEREST
        }
        counts["overall"] = {"improvements": 0, "regressions": 0, "ties": 0}

        worst_samples: list[dict[str, Any]] = []

        for sid in sorted(baseline_by_id.keys()):
            b_row = baseline_by_id[sid]
            c_row = cand_by_id[sid]

            deltas: dict[str, float] = {}
            has_regression = False
            has_improvement = False

            for metric in METRICS_OF_INTEREST:
                b_val = float(b_row.get(metric, 0.0))
                c_val = float(c_row.get(metric, 0.0))
                delta = c_val - b_val
                deltas[metric] = delta

                if delta > 1e-9:
                    counts[metric]["improvements"] += 1
                    has_improvement = True
                elif delta < -1e-9:
                    counts[metric]["regressions"] += 1
                    has_regression = True
                else:
                    counts[metric]["ties"] += 1

            if has_regression and not has_improvement:
                counts["overall"]["regressions"] += 1
            elif has_improvement and not has_regression:
                counts["overall"]["improvements"] += 1
            elif has_regression and has_improvement:
                sum_delta = sum(deltas.values())
                if sum_delta < 0:
                    counts["overall"]["regressions"] += 1
                elif sum_delta > 0:
                    counts["overall"]["improvements"] += 1
                else:
                    counts["overall"]["ties"] += 1
            else:
                counts["overall"]["ties"] += 1

            sample_entry = {
                "sample_id": sid,
                "candidate_config": cand_config,
                "baseline_config": baseline_config,
                "question": b_row.get("question", ""),
                "category": b_row.get("category", ""),
                "baseline_metrics": {m: float(b_row.get(m, 0.0)) for m in METRICS_OF_INTEREST},
                "candidate_metrics": {m: float(c_row.get(m, 0.0)) for m in METRICS_OF_INTEREST},
                "deltas": deltas,
                "min_delta": min(deltas.values()),
                "has_regression": has_regression,
                "rationale": c_row.get("rationale") or b_row.get("rationale") or "",
            }
            sample_deltas.append(sample_entry)

            if has_regression:
                worst_samples.append(sample_entry)

        worst_samples.sort(key=lambda s: (s["min_delta"], sum(s["deltas"].values())))

        error_analysis_by_candidate[cand_config] = {
            "aggregate_counts": counts,
            "sample_deltas": sample_deltas,
            "worst_samples": worst_samples,
        }

    # Latency breakdown and provider errors by config
    from statistics import mean
    def _percentile(values: list[float], p: float) -> float:
        if not values:
            return 0.0
        ordered = sorted(values)
        index = max(0, min(len(ordered) - 1, int((len(ordered) * p) + 0.999999) - 1))
        return ordered[index]

    latency_by_config: dict[str, dict[str, Any]] = {}
    for cfg in all_configs:
        cfg_rows = [r for r in rows if r.get("config") == cfg]
        val_rows = [r for r in cfg_rows if float(r.get("provider_error", 0.0)) == 0.0]

        def get_lat(key: str) -> dict[str, float] | None:
            vals = [float(r[key]) for r in cfg_rows if key in r and isinstance(r.get(key), (int, float))]
            if not vals:
                return None
            return {
                "mean": mean(vals),
                "p50": _percentile(vals, 0.50),
                "p95": _percentile(vals, 0.95),
                "p99": _percentile(vals, 0.99),
            }

        prov_errs = sum(1 for r in cfg_rows if float(r.get("provider_error", 0.0)) > 0.0)
        jdg_errs = sum(1 for r in cfg_rows if float(r.get("judge_error_rate", 0.0)) > 0.0)

        latency_by_config[cfg] = {
            "sample_count": len(cfg_rows),
            "valid_sample_count": len(val_rows),
            "provider_errors": prov_errs,
            "judge_errors": jdg_errs,
            "rag_latency": get_lat("rag_latency_seconds") if cfg_rows and "rag_latency_seconds" in cfg_rows[0] else get_lat("latency_seconds"),
            "llm_latency": get_lat("llm_latency_seconds"),
            "judge_latency": get_lat("judge_latency_seconds"),
            "eval_wall_time": get_lat("eval_wall_time_seconds"),
        }

    return {
        "baseline_config": baseline_config,
        "sample_count": sample_count,
        "limitations": (
            f"Sample size n={sample_count} provides diagnostic feedback on held-out test split, "
            "but small n limits statistical power. Reported p-values must be interpreted "
            "alongside 95% bootstrap confidence intervals."
        ),
        "paired_comparisons": paired_comparisons,
        "latency_by_config": latency_by_config,
        "error_analysis": error_analysis_by_candidate,
    }


def write_offline_analysis_artifacts(
    analysis: dict[str, Any],
    output_dir: Path,
) -> dict[str, Path]:
    """Write offline error analysis results to JSON, CSV, and Markdown files."""
    output_dir.mkdir(parents=True, exist_ok=True)

    # 1. JSON output
    json_path = output_dir / "paired_analysis.json"
    json_path.write_text(
        json.dumps(analysis, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    # 2. CSV output (sample_deltas.csv)
    csv_path = output_dir / "sample_deltas.csv"
    fieldnames = [
        "sample_id",
        "candidate_config",
        "baseline_config",
        "category",
    ]
    for m in METRICS_OF_INTEREST:
        fieldnames.extend([f"{m}_base", f"{m}_cand", f"{m}_delta"])
    fieldnames.append("has_regression")

    rows_to_write: list[dict[str, Any]] = []
    for cand_config, data in analysis["error_analysis"].items():
        for s in data["sample_deltas"]:
            row_dict: dict[str, Any] = {
                "sample_id": s["sample_id"],
                "candidate_config": cand_config,
                "baseline_config": analysis["baseline_config"],
                "category": s["category"],
            }
            for m in METRICS_OF_INTEREST:
                row_dict[f"{m}_base"] = f"{s['baseline_metrics'][m]:.4f}"
                row_dict[f"{m}_cand"] = f"{s['candidate_metrics'][m]:.4f}"
                row_dict[f"{m}_delta"] = f"{s['deltas'][m]:.4f}"
            row_dict["has_regression"] = s["has_regression"]
            rows_to_write.append(row_dict)

    with csv_path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows_to_write)

    # 3. Markdown output (offline_analysis.md)
    md_path = output_dir / "offline_analysis.md"
    lines = [
        "# Offline Error Analysis & Paired Statistics",
        "",
        f"- Baseline Configuration: `{analysis['baseline_config']}`",
        f"- Sample Count ($n$): {analysis['sample_count']}",
        f"- Limitations: {analysis['limitations']}",
        "",
        "## Paired Comparisons vs Baseline",
        "",
        "| Candidate Config | Metric | Baseline Mean | Candidate Mean | Mean Diff (cand - base) | 95% Bootstrap CI | Paired p-value | Significant (p < 0.05) |",
        "| --- | --- | ---: | ---: | ---: | ---: | ---: | :---: |",
    ]

    for cand_config, metrics_data in analysis["paired_comparisons"].items():
        for metric, stats in metrics_data.items():
            b_mean = stats["baseline_mean"]
            c_mean = stats["candidate_mean"]
            diff = stats["candidate_minus_baseline_mean_diff"]
            ci_low, ci_high = stats["ci95"]
            p_val = stats["p_value"]
            sig = "Yes" if p_val < 0.05 else "No"
            lines.append(
                f"| {cand_config} | {metric} | {b_mean:.4f} | {c_mean:.4f} | {diff:+.4f} | [{ci_low:+.4f}, {ci_high:+.4f}] | {p_val:.4f} | {sig} |"
            )

    if "latency_by_config" in analysis:
        lines.extend(
            [
                "",
                "## Latency Breakdown & Distributions (Seconds)",
                "",
                "| Config | Samples (Valid/Errors) | RAG Latency (p50/p95/p99/mean) | LLM Latency (p50/p95/p99/mean) | Judge Latency (p50/p95/p99/mean) | Total Wall Time (p50/p95/p99/mean) |",
                "| --- | ---: | --- | --- | --- | --- |",
            ]
        )
        def format_latency(payload: dict[str, float] | None) -> str:
            if payload is None:
                return "N/A"
            return (
                f"{payload['p50']:.2f}s / {payload['p95']:.2f}s / "
                f"{payload['p99']:.2f}s (m={payload['mean']:.2f}s)"
            )

        for cfg, p in analysis["latency_by_config"].items():
            rag_lat = p["rag_latency"]
            llm_lat = p["llm_latency"]
            jdg_lat = p["judge_latency"]
            wall_lat = p["eval_wall_time"]
            lines.append(
                f"| {cfg} | {p['sample_count']} ({p['valid_sample_count']} valid, {p['provider_errors']} errors) | "
                f"{format_latency(rag_lat)} | {format_latency(llm_lat)} | "
                f"{format_latency(jdg_lat)} | {format_latency(wall_lat)} |"
            )

    lines.extend(
        [
            "",
            "## Aggregate Error Counts (Improvements / Regressions / Ties)",
            "",
            "| Candidate Config | Metric | Improvements | Regressions | Ties |",
            "| --- | --- | ---: | ---: | ---: |",
        ]
    )

    for cand_config, data in analysis["error_analysis"].items():
        counts = data["aggregate_counts"]
        for metric in METRICS_OF_INTEREST + ["overall"]:
            imp = counts[metric]["improvements"]
            reg = counts[metric]["regressions"]
            tie = counts[metric]["ties"]
            lines.append(f"| {cand_config} | {metric} | {imp} | {reg} | {tie} |")

    lines.extend(
        [
            "",
            "## Worst Regression Samples",
            "",
        ]
    )

    for cand_config, data in analysis["error_analysis"].items():
        worst = data["worst_samples"]
        lines.append(f"### Candidate: `{cand_config}` ({len(worst)} regressions)")
        lines.append("")
        if not worst:
            lines.append("No regressions detected relative to baseline.")
            lines.append("")
            continue

        for s in worst:
            lines.append(f"- **Sample ID**: `{s['sample_id']}`")
            lines.append(f"  - Question: {s['question']}")
            deltas_str = ", ".join(
                f"{m}: {d:+.4f}" for m, d in s["deltas"].items() if abs(d) > 1e-9
            )
            lines.append(f"  - Metric Deltas: {deltas_str}")
            if s["rationale"]:
                lines.append(f"  - Judge Rationale: {s['rationale']}")
            lines.append("")

    md_path.write_text("\n".join(lines) + "\n", encoding="utf-8")

    return {
        "json": json_path,
        "csv": csv_path,
        "markdown": md_path,
    }


def run_offline_analysis(
    raw_path: Path,
    output_dir: Path,
    baseline_config: str = "vector_baseline",
    seed: int = 42,
    resamples: int = 10_000,
) -> dict[str, Any]:
    """Load raw evaluation file and run complete offline analysis."""
    if not raw_path.exists():
        raise FileNotFoundError(f"Raw evaluation file not found: {raw_path}")

    rows: list[dict[str, Any]] = []
    with raw_path.open(encoding="utf-8") as f:
        for line in f:
            if line.strip():
                rows.append(json.loads(line))

    analysis = compute_offline_error_analysis(
        rows, baseline_config=baseline_config, seed=seed, resamples=resamples
    )
    artifacts = write_offline_analysis_artifacts(analysis, output_dir)

    return {
        "summary": {
            "baseline_config": baseline_config,
            "sample_count": analysis["sample_count"],
            "candidates_analyzed": list(analysis["paired_comparisons"].keys()),
            "artifacts_written": {k: str(v) for k, v in artifacts.items()},
        },
        "analysis": analysis,
    }

