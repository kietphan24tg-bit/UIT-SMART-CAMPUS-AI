from __future__ import annotations

import json
from pathlib import Path

import pytest

from evaluation.cache import EvaluationCache
from evaluation.corpus import load_corpus_manifest, validate_corpus, write_corpus_quality_report
from evaluation.dataset import EXPECTED_CATEGORY, EXPECTED_TOTAL, load_dataset, validate_dataset
from evaluation.evidence import load_evidence_sections
from evaluation.schemas import Split
from evaluation.metrics import (
    bootstrap_ci,
    graded_ndcg_at_k,
    precision_at_k,
    recall_at_k,
    reciprocal_rank,
    source_key_matches,
    source_key_recall_at_k,
)
from evaluation.report import evaluate_gate, write_report
from evaluation.runner import document_from_context, source_key_from_context

ROOT = Path(__file__).parents[1]
CORPUS_DIR = ROOT / "evaluation" / "corpus" / "training_exam"


def test_default_dataset_contains_only_training_exam_samples():
    dataset = load_dataset()

    assert validate_dataset(dataset, require_approved=True, strict_ground_truth=True) == []
    assert len(dataset.samples) == EXPECTED_TOTAL == 106
    assert {sample.category for sample in dataset.samples} == {EXPECTED_CATEGORY}
    assert len(dataset.approved_samples()) == EXPECTED_TOTAL == 106
    assert all(sample.metadata.get("human_reviewed") is True for sample in dataset.samples)
    assert all(sample.metadata.get("review_method") == "owner_verified" for sample in dataset.samples)
    assert len(dataset.by_split(Split.DEV)) >= 60
    assert len(dataset.by_split(Split.TEST)) >= 20
    assert not any(
        len({sample.split for sample in dataset.samples if sample.question_group_id == group}) > 1
        for group in {sample.question_group_id for sample in dataset.samples}
    )


def test_dataset_rejects_other_domain_and_invalid_ground_truth():
    dataset = load_dataset()
    sample = dataset.samples[0]
    sample.category = "learning_outcome"
    sample.expected.sources = []
    sample.expected.reference_answer = ""
    sample.reviews.append(sample.reviews[0].model_copy(deep=True))

    errors = validate_dataset(dataset, strict_ground_truth=True)

    assert any("Only category 'training_exam'" in error for error in errors)
    assert any("must declare at least one source" in error for error in errors)
    assert any("must include a non-empty reference_answer" in error for error in errors)
    assert any("duplicate approved reviewers" in error for error in errors)


def test_training_exam_manifest_and_documents_are_consistent():
    manifest = load_corpus_manifest(CORPUS_DIR / "manifest.json")

    assert manifest.corpus_id == "training_exam"
    assert len(manifest.source_files) == 7
    assert len(manifest.retrieval_filters()["source_files"]) == 6
    assert "quy-trinh-to-chuc-thi-quan-ly-diem-bai-thi.pdf" not in manifest.retrieval_filters()["source_files"]
    assert len(list((CORPUS_DIR / "documents").glob("*.md"))) == 7


def test_training_exam_corpus_passes_technical_quality_gates(tmp_path):
    manifest = load_corpus_manifest(CORPUS_DIR / "manifest.json")
    source_root = Path(str(manifest.payload.get("source_root") or ""))
    if not source_root.is_dir():
        pytest.skip("Normalized source corpus is external to the repository")

    report = validate_corpus(manifest, CORPUS_DIR / "authority_matrix.json")
    json_path, markdown_path = write_corpus_quality_report(report, tmp_path)

    assert report["summary"]["document_count"] == 7
    assert report["summary"]["error_count"] == 0
    assert report["summary"]["technical_pass_count"] == 7
    assert report["summary"]["ready_for_dataset_drafting"] is True
    assert report["summary"]["unresolved_authority_count"] == 0
    assert report["summary"]["excluded_unresolved_authority_count"] == 1
    assert report["summary"]["ready_for_final_ground_truth"] is True
    assert sum(document["page_marker_count"] for document in report["documents"]) == 84
    assert json_path.exists()
    assert markdown_path.exists()


def test_evidence_loader_resolves_real_sources_and_legal_headings():
    sections = load_evidence_sections(CORPUS_DIR / "documents")
    manifest = load_corpus_manifest(CORPUS_DIR / "manifest.json")

    assert sections
    assert {section.source_file for section in sections}.issubset(set(manifest.source_files))
    assert any("Điều 4" in (section.heading_path or "") for section in sections)


def test_precision_uses_returned_count_not_cutoff():
    assert precision_at_k(["a.md"], ["a.md"], k=5) == 1.0
    assert precision_at_k(["a.md"], ["a.md", "b.md"], k=5) == 0.5


def test_retrieval_metrics_handle_duplicates_and_graded_relevance():
    assert recall_at_k(["a.md", "b.md"], ["a.md", "a.md", "b.md"], k=3) == 1.0
    assert reciprocal_rank(["a.md"], ["other.md", "a.md"]) == 0.5
    assert graded_ndcg_at_k(
        {"a.md::intro": 2, "b.md::policy": 1},
        ["b.md::policy", "a.md::intro"],
        k=2,
    ) < 1.0


def test_heading_metrics_reject_wrong_article_in_same_document():
    expected = "policy.pdf::Chuong 3 > Dieu 22. Khong hoan tat hoc phan"
    correct = "policy.pdf::Chuong 3 > Dieu 22. Khong hoan tat hoc phan"
    wrong = "policy.pdf::Chuong 2 > Dieu 17. Tam dung hoc tap"

    assert source_key_matches(expected, correct)
    assert not source_key_matches(expected, wrong)
    assert source_key_recall_at_k([expected], [wrong], 5) == 0.0


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


def test_report_writes_training_exam_retrieval_summary(tmp_path):
    rows = [
        {
            "sample_id": "training_exam_001",
            "suite": "retrieval",
            "config": "hybrid",
            "category": "training_exam",
            "answerable": 1.0,
            "corpus_gap": 0.0,
            "retrieval_recall_at_5": 1.0,
            "retrieval_precision_at_5": 0.5,
            "retrieval_mrr": 1.0,
            "retrieval_ndcg_at_5": 1.0,
            "fallback_accuracy": 1.0,
            "source_unit_correct": 1.0,
            "domain_correct": 1.0,
            "latency_seconds": 2.0,
            "provider_error": 0.0,
        }
    ]

    summary = write_report(rows, tmp_path)

    assert summary["retrieval_by_config"]["hybrid"]["answerable_recall_at_5"] == 1.0
    assert (tmp_path / "summary.json").exists()
    assert (tmp_path / "raw.jsonl").exists()
    loaded = json.loads((tmp_path / "summary.json").read_text(encoding="utf-8"))
    assert loaded["sample_count"] == 1


def test_rag_hard_gates():
    assert evaluate_gate("retrieval_recall_at_5", 0.90)
    assert not evaluate_gate("retrieval_recall_at_5", 0.89)
    assert evaluate_gate("retrieval_p95_latency_seconds", 14.99)
    assert not evaluate_gate("retrieval_p95_latency_seconds", 15.0)


def test_context_helpers_support_dict_payload():
    context = {"citation": {"source_file": "policy.md", "heading_path": "Điều kiện dự thi"}}

    assert document_from_context(context) == "policy.md"
    assert source_key_from_context(context) == "policy.md::điều kiện dự thi"
