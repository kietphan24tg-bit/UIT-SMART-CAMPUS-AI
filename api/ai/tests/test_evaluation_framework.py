from __future__ import annotations

import json

import pytest

from evaluation.cache import EvaluationCache
from evaluation.dataset import EXPECTED_DISTRIBUTION, load_dataset, validate_dataset
from evaluation.metrics import (
    bootstrap_ci,
    graded_ndcg_at_k,
    precision_at_k,
    recall_at_k,
    reciprocal_rank,
    source_matches,
)
from evaluation.report import evaluate_gate, write_report
from evaluation.runner import document_from_context, source_key_from_context


def test_dataset_seed_has_expected_distribution():
    dataset = load_dataset()
    errors = validate_dataset(dataset)

    assert errors == []
    assert len(dataset.samples) == 160
    assert len(dataset.by_split(dataset.samples[0].split.DEV)) == 112
    assert len(dataset.by_split(dataset.samples[0].split.TEST)) == 48
    assert {category for category in EXPECTED_DISTRIBUTION} == {
        sample.category for sample in dataset.samples
    }
    assert len(dataset.approved_samples()) == 0


def test_dataset_requires_two_approvals_when_requested():
    dataset = load_dataset()

    errors = validate_dataset(dataset, require_two_approvals=True)

    assert errors
    assert "do not have two approvals" in errors[-1]


def test_precision_uses_returned_count_not_cutoff():
    assert precision_at_k(["a.md"], ["a.md"], k=5) == 1.0
    assert precision_at_k(["a.md"], ["a.md", "b.md"], k=5) == 0.5


def test_retrieval_metrics_handle_duplicates_and_graded_relevance():
    assert recall_at_k(["a.md", "b.md"], ["a.md", "a.md", "b.md"], k=3) == 1.0
    assert graded_ndcg_at_k(
        {"a.md::intro": 2, "b.md::policy": 1},
        ["b.md::policy", "a.md::intro"],
        k=2,
    ) < 1.0


def test_source_alias_matching_for_seed_ground_truth():
    assert source_matches("quy-che-dao-tao.md", "daa-790-qd-dhcntt_28-9-22_quy_che_dao_tao.pdf")
    assert source_matches("chuan-dau-ra.md", "chuan-dau-ra-cu-nhan-nganh-he-thong-thong-tin-page-1.html")
    assert recall_at_k(["quy-che-dao-tao.md"], ["cap-nhat-quy-che-dao-tao-tin-chi-1393-2023.pdf"], 5) == 1.0
    assert reciprocal_rank(["quy-che-dao-tao.md"], ["other.pdf", "daa-507-quy_che_dao_tao.pdf"]) == 0.5


def test_graded_ndcg_does_not_double_count_alias_pages():
    score = graded_ndcg_at_k(
        {"chuan-dau-ra.md::": 2},
        [
            "chuan-dau-ra-cu-nhan-nganh-a-page-1.html::intro",
            "chuan-dau-ra-cu-nhan-nganh-a-page-2.html::intro",
            "chuan-dau-ra-cu-nhan-nganh-a-page-3.html::intro",
        ],
        k=3,
    )
    assert score == 1.0


def test_bootstrap_ci_is_reproducible():
    first = bootstrap_ci([0.0, 1.0, 1.0], resamples=100, seed=42)
    second = bootstrap_ci([0.0, 1.0, 1.0], resamples=100, seed=42)
    assert first == second


def test_cache_key_ignores_secret_like_fields(tmp_path):
    cache = EvaluationCache(tmp_path)

    left = cache.key({"sample": "x", "service_token": "secret-a"})
    right = cache.key({"sample": "x", "service_token": "secret-b"})

    assert left == right
    cache.set(left, {"ok": True})
    assert cache.get(right) == {"ok": True}


def test_report_writes_summary_and_raw_rows(tmp_path):
    rows = [
        {"sample_id": "a", "category": "training_exam", "tool_selection_accuracy": 1.0},
        {"sample_id": "b", "category": "training_exam", "tool_selection_accuracy": 0.0},
    ]

    summary = write_report(rows, tmp_path)

    assert summary["sample_count"] == 2
    assert (tmp_path / "summary.json").exists()
    assert (tmp_path / "raw.jsonl").exists()
    assert (tmp_path / "report.md").exists()
    loaded = json.loads((tmp_path / "summary.json").read_text(encoding="utf-8"))
    assert loaded["metrics"]["tool_selection_accuracy"]["mean"] == pytest.approx(0.5)


def test_hard_gate_evaluation():
    assert evaluate_gate("tool_selection_accuracy", 0.95)
    assert not evaluate_gate("tool_selection_accuracy", 0.94)
    assert evaluate_gate("pre_confirm_action_count", 0.0)
    assert not evaluate_gate("pre_confirm_action_count", 1.0)


def test_context_helpers_support_pydantic_like_and_dict():
    dict_context = {
        "citation": {
            "source_file": "policy.md",
            "heading_path": "Điều kiện dự thi",
        }
    }

    assert document_from_context(dict_context) == "policy.md"
    assert source_key_from_context(dict_context) == "policy.md::điều kiện dự thi"
