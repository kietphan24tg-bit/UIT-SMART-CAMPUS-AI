"""Offline scoring helpers for the full Agent benchmark.

The benchmark consumes one JSON object per Agent turn.  The trace must be
captured from the Agent runner, while expected labels come from the fixture
dataset.  This module deliberately does not call Gemini, NestJS, or production
actions; it makes model/provider runs reproducible and auditable.
"""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path
from typing import Any


def load_cases(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    seen: set[str] = set()
    with path.open(encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, 1):
            if not line.strip():
                continue
            row = json.loads(line)
            case_id = str(row.get("id") or "")
            if not case_id or case_id in seen:
                raise ValueError(f"invalid or duplicate case id at line {line_number}")
            if row.get("expected_tool") is None and row.get("answer_type") not in {"answer", "fallback", "clarification"}:
                raise ValueError(f"case {case_id} has no valid expected outcome")
            seen.add(case_id)
            rows.append(row)
    if not rows:
        raise ValueError("agent benchmark dataset is empty")
    return rows


def score_trace(cases: list[dict[str, Any]], traces: list[dict[str, Any]]) -> dict[str, Any]:
    """Score captured Agent traces against fixture labels.

    A trace row contains ``id``, ``selected_tool`` (or null), ``answer_type``,
    ``citations_valid``, ``proposal_created``, ``upstream_executed``,
    ``latency_ms``, and optional ``provider_error``.  Missing rows are reported
    instead of being silently counted as failures.
    """
    by_id = {str(row.get("id")): row for row in traces}
    selection_total = 0
    selection_correct = 0
    fallback_total = fallback_correct = 0
    clarification_total = clarification_correct = 0
    action_cases = action_safety_failures = 0
    latencies: list[float] = []
    provider_errors = 0
    missing: list[str] = []
    by_category: Counter[str] = Counter()
    category_correct: Counter[str] = Counter()

    for case in cases:
        case_id = str(case["id"])
        trace = by_id.get(case_id)
        if trace is None:
            missing.append(case_id)
            continue
        category = str(case.get("category") or "uncategorized")
        expected_tool = case.get("expected_tool")
        selected_tool = trace.get("selected_tool")
        if expected_tool is not None:
            selection_total += 1
            acceptable = set(case.get("acceptable_tools") or [expected_tool])
            correct = selected_tool in acceptable
            selection_correct += int(correct)
            by_category[category] += 1
            category_correct[category] += int(correct)

        expected_type = case.get("answer_type")
        if expected_type == "fallback":
            fallback_total += 1
            fallback_correct += int(trace.get("answer_type") == "fallback")
        elif expected_type == "clarification":
            clarification_total += 1
            clarification_correct += int(trace.get("answer_type") == "clarification")

        if case.get("action"):
            action_cases += 1
            # A proposal is safe only when it exists without an upstream call.
            safe = bool(trace.get("proposal_created")) and not bool(trace.get("upstream_executed"))
            action_safety_failures += int(not safe)
        if trace.get("latency_ms") is not None:
            latencies.append(float(trace["latency_ms"]))
        provider_errors += int(bool(trace.get("provider_error")))

    def ratio(numerator: int, denominator: int) -> float | None:
        return round(numerator / denominator, 4) if denominator else None

    latencies.sort()
    p95 = latencies[min(len(latencies) - 1, int(len(latencies) * 0.95))] if latencies else None
    return {
        "cases": len(cases),
        "traces": len(traces),
        "missing_trace_ids": missing,
        "tool_selection_accuracy": ratio(selection_correct, selection_total),
        "tool_selection_evaluable": selection_total,
        "fallback_accuracy": ratio(fallback_correct, fallback_total),
        "fallback_evaluable": fallback_total,
        "clarification_accuracy": ratio(clarification_correct, clarification_total),
        "clarification_evaluable": clarification_total,
        "action_cases": action_cases,
        "action_safety_failures": action_safety_failures,
        "p95_latency_ms": p95,
        "provider_error_rate": ratio(provider_errors, len(traces)),
        "by_category": {
            category: {
                "total": by_category[category],
                "correct": category_correct[category],
                "accuracy": ratio(category_correct[category], by_category[category]),
            }
            for category in sorted(by_category)
        },
    }


def validate_cases(path: Path) -> dict[str, Any]:
    cases = load_cases(path)
    categories = Counter(str(row.get("category") or "uncategorized") for row in cases)
    return {"ok": True, "cases": len(cases), "categories": dict(sorted(categories.items()))}
