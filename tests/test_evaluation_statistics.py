from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from evaluation.answer_runner import TimedChatClient, run_answer_evaluation
from evaluation.cli import build_parser
from evaluation.metrics import (
    bootstrap_ci,
    paired_permutation_p_value,
    paired_stats,
)
from evaluation.offline_analysis import (
    extract_paired_vectors,
    run_offline_analysis,
)
from evaluation.report import summarize_rows, write_report
from evaluation.schemas import (
    Difficulty,
    EvaluationSample,
    ExpectedOutcome,
    ExpectedSource,
    Split,
)


def test_paired_bootstrap_ci_is_deterministic():
    deltas = [-0.1, 0.0, 0.2, -0.05, 0.1, 0.0, 0.0, -0.1]
    ci1 = bootstrap_ci(deltas, seed=42, resamples=1000)
    ci2 = bootstrap_ci(deltas, seed=42, resamples=1000)
    assert ci1 == ci2


def test_paired_permutation_p_value_identical_vectors():
    vec = [1.0, 0.8, 0.9, 1.0]
    p_val = paired_permutation_p_value(vec, vec, seed=42, resamples=1000)
    assert p_val == 1.0


def test_paired_stats_output_structure():
    base = [0.9, 1.0, 0.8, 0.95, 1.0]
    cand = [0.85, 1.0, 0.75, 0.95, 0.9]
    res = paired_stats(base, cand, seed=42, resamples=1000)
    assert "candidate_minus_baseline_mean_diff" in res
    assert "ci95" in res
    assert "p_value" in res
    assert res["n_samples"] == 5
    assert res["candidate_minus_baseline_mean_diff"] < 0.0


def test_extract_paired_vectors_fails_on_duplicate_rows():
    rows = [
        {"sample_id": "s1", "config": "vector_baseline", "faithfulness": 1.0},
        {"sample_id": "s1", "config": "vector_baseline", "faithfulness": 0.8},
        {"sample_id": "s1", "config": "hybrid", "faithfulness": 0.9},
    ]
    with pytest.raises(ValueError, match="Duplicate sample_id found in baseline"):
        extract_paired_vectors(rows, "vector_baseline", "hybrid", "faithfulness")


def test_extract_paired_vectors_fails_on_missing_rows():
    rows = [
        {"sample_id": "s1", "config": "vector_baseline", "faithfulness": 1.0},
        {"sample_id": "s2", "config": "vector_baseline", "faithfulness": 0.8},
        {"sample_id": "s1", "config": "hybrid", "faithfulness": 0.9},
    ]
    with pytest.raises(ValueError, match="Sample ID mismatch"):
        extract_paired_vectors(rows, "vector_baseline", "hybrid", "faithfulness")


def test_offline_analysis_on_synthetic_rows(tmp_path: Path):
    synthetic_rows = [
        {
            "sample_id": "s1",
            "config": "vector_baseline",
            "suite": "answer",
            "category": "training_exam",
            "question": "Question 1?",
            "faithfulness": 1.0,
            "answer_relevance": 1.0,
            "completeness": 1.0,
            "citation_correctness": 1.0,
        },
        {
            "sample_id": "s1",
            "config": "hybrid",
            "suite": "answer",
            "category": "training_exam",
            "question": "Question 1?",
            "faithfulness": 0.8,
            "answer_relevance": 1.0,
            "completeness": 0.9,
            "citation_correctness": 1.0,
        },
        {
            "sample_id": "s2",
            "config": "vector_baseline",
            "suite": "answer",
            "category": "training_exam",
            "question": "Question 2?",
            "faithfulness": 0.9,
            "answer_relevance": 0.9,
            "completeness": 0.9,
            "citation_correctness": 0.9,
        },
        {
            "sample_id": "s2",
            "config": "hybrid",
            "suite": "answer",
            "category": "training_exam",
            "question": "Question 2?",
            "faithfulness": 0.9,
            "answer_relevance": 0.9,
            "completeness": 1.0,
            "citation_correctness": 0.9,
        },
    ]

    raw_path = tmp_path / "raw.jsonl"
    with raw_path.open("w", encoding="utf-8") as f:
        for r in synthetic_rows:
            f.write(json.dumps(r) + "\n")

    result = run_offline_analysis(
        raw_path=raw_path,
        output_dir=tmp_path,
        baseline_config="vector_baseline",
        seed=42,
        resamples=1000,
    )

    assert (tmp_path / "paired_analysis.json").exists()
    assert (tmp_path / "sample_deltas.csv").exists()
    assert (tmp_path / "offline_analysis.md").exists()

    analysis = result["analysis"]
    assert analysis["sample_count"] == 2
    assert "hybrid" in analysis["paired_comparisons"]
    m_stats = analysis["paired_comparisons"]["hybrid"]["faithfulness"]
    assert "candidate_minus_baseline_mean_diff" in m_stats
    assert m_stats["n_samples"] == 2


def test_summarize_rows_with_valid_and_invalid_answer_rows(tmp_path: Path):
    valid_rows = [
        {
            "sample_id": "s1",
            "config": "vector_baseline",
            "suite": "answer",
            "category": "training_exam",
            "faithfulness": 1.0,
            "answer_relevance": 1.0,
            "completeness": 1.0,
            "citation_correctness": 1.0,
        },
        {
            "sample_id": "s1",
            "config": "hybrid",
            "suite": "answer",
            "category": "training_exam",
            "faithfulness": 0.9,
            "answer_relevance": 1.0,
            "completeness": 0.8,
            "citation_correctness": 1.0,
        },
        {
            "sample_id": "s2",
            "config": "vector_baseline",
            "suite": "answer",
            "category": "training_exam",
            "faithfulness": 0.8,
            "answer_relevance": 0.9,
            "completeness": 0.9,
            "citation_correctness": 0.9,
        },
        {
            "sample_id": "s2",
            "config": "hybrid",
            "suite": "answer",
            "category": "training_exam",
            "faithfulness": 0.9,
            "answer_relevance": 0.9,
            "completeness": 1.0,
            "citation_correctness": 0.9,
        },
    ]

    summary = write_report(valid_rows, tmp_path)
    assert "answer_paired_bootstrap" in summary
    assert "hybrid" in summary["answer_paired_bootstrap"]
    assert "faithfulness" in summary["answer_paired_bootstrap"]["hybrid"]

    # Invalid duplicate rows must raise ValueError (fail closed)
    duplicate_rows = [
        {
            "sample_id": "s1",
            "config": "vector_baseline",
            "suite": "answer",
            "faithfulness": 1.0,
            "answer_relevance": 1.0,
            "completeness": 1.0,
            "citation_correctness": 1.0,
        },
        {
            "sample_id": "s1",
            "config": "vector_baseline",
            "suite": "answer",
            "faithfulness": 0.8,
            "answer_relevance": 1.0,
            "completeness": 1.0,
            "citation_correctness": 1.0,
        },
        {
            "sample_id": "s1",
            "config": "hybrid",
            "suite": "answer",
            "faithfulness": 0.9,
            "answer_relevance": 1.0,
            "completeness": 0.8,
            "citation_correctness": 1.0,
        },
    ]
    with pytest.raises(ValueError, match="Duplicate sample_id found in baseline"):
        summarize_rows(duplicate_rows)

    # Invalid missing sample_id rows must raise ValueError (fail closed)
    missing_rows = [
        {
            "sample_id": "s1",
            "config": "vector_baseline",
            "suite": "answer",
            "faithfulness": 1.0,
            "answer_relevance": 1.0,
            "completeness": 1.0,
            "citation_correctness": 1.0,
        },
        {
            "sample_id": "s2",
            "config": "vector_baseline",
            "suite": "answer",
            "faithfulness": 0.8,
            "answer_relevance": 1.0,
            "completeness": 1.0,
            "citation_correctness": 1.0,
        },
        {
            "sample_id": "s1",
            "config": "hybrid",
            "suite": "answer",
            "faithfulness": 0.9,
            "answer_relevance": 1.0,
            "completeness": 0.8,
            "citation_correctness": 1.0,
        },
    ]
    with pytest.raises(ValueError, match="Sample ID mismatch"):
        summarize_rows(missing_rows)


def test_run_answer_evaluation_latency_row_semantics():
    mock_sample = EvaluationSample(
        id="test_001",
        category="training_exam",
        split=Split.TEST,
        difficulty=Difficulty.DIRECT,
        question="Q?",
        user_fixture="regular_student",
        expected=ExpectedOutcome(
            answer_type="answer",
            sources=[ExpectedSource(source_file="doc.md")],
            reference_answer="Ans",
        ),
    )

    mock_response = MagicMock()
    mock_response.answer = "Gen Answer"
    mock_response.answer_type = "knowledge"
    mock_response.citations = []
    mock_response.contexts = []
    mock_response.confidence = 0.9
    mock_response.retrieved_count = 1

    mock_score = MagicMock()
    mock_score.model_dump.return_value = {
        "faithfulness": 1.0,
        "answer_relevance": 1.0,
        "completeness": 1.0,
        "citation_correctness": 1.0,
    }

    with patch("src.rag.service.RagService") as MockRagService, patch(
        "evaluation.answer_runner.GeminiJudge"
    ) as MockGeminiJudge:
        instance_service = MockRagService.return_value
        instance_service.llm_client = MagicMock()
        instance_service.answer.return_value = mock_response

        instance_judge = MockGeminiJudge.return_value
        instance_judge.score.return_value = mock_score

        rows = run_answer_evaluation([mock_sample], retrieval_config="vector_baseline")

        assert len(rows) == 1
        row = rows[0]

        assert "latency_seconds" in row
        assert "rag_latency_seconds" in row
        assert "llm_latency_seconds" in row
        assert "judge_latency_seconds" in row
        assert "eval_wall_time_seconds" in row

        # Semantics check: latency_seconds equals production RAG path latency
        assert row["latency_seconds"] == row["rag_latency_seconds"]
        assert row["eval_wall_time_seconds"] >= row["rag_latency_seconds"]


def test_timed_chat_client_wrapper():
    class DummyClient:
        def chat(self, sys_prompt: str, user_prompt: str) -> str:
            return "dummy answer"

    dummy = DummyClient()
    timed = TimedChatClient(dummy)
    out = timed.chat("sys", "user")

    assert out == "dummy answer"
    assert timed.last_latency_seconds >= 0.0


def test_cli_analyze_parser():
    parser = build_parser()
    args = parser.parse_args(["analyze", "--input", "raw.jsonl", "--seed", "42"])
    assert args.command == "analyze"
    assert args.seed == 42


def test_run_answer_evaluation_deterministic_resume():
    mock_sample1 = EvaluationSample(
        id="test_001",
        category="training_exam",
        split=Split.TEST,
        difficulty=Difficulty.DIRECT,
        question="Q1?",
        user_fixture="regular_student",
        expected=ExpectedOutcome(
            answer_type="answer",
            sources=[ExpectedSource(source_file="doc.md")],
            reference_answer="Ans1",
        ),
    )
    mock_sample2 = EvaluationSample(
        id="test_002",
        category="training_exam",
        split=Split.TEST,
        difficulty=Difficulty.DIRECT,
        question="Q2?",
        user_fixture="regular_student",
        expected=ExpectedOutcome(
            answer_type="answer",
            sources=[ExpectedSource(source_file="doc.md")],
            reference_answer="Ans2",
        ),
    )

    existing = [
        {
            "sample_id": "test_001",
            "config": "vector_baseline",
            "suite": "answer",
            "category": "training_exam",
            "faithfulness": 1.0,
            "answer_relevance": 1.0,
            "completeness": 1.0,
            "citation_correctness": 1.0,
            "provider_error": 0.0,
            "judge_error_rate": 0.0,
            "generated_answer": "Precomputed Answer",
        }
    ]

    mock_response = MagicMock()
    mock_response.answer = "New Answer"
    mock_response.answer_type = "knowledge"
    mock_response.citations = []
    mock_response.contexts = []
    mock_response.confidence = 0.9
    mock_response.retrieved_count = 1

    mock_score = MagicMock()
    mock_score.model_dump.return_value = {
        "faithfulness": 0.9,
        "answer_relevance": 0.9,
        "completeness": 0.9,
        "citation_correctness": 0.9,
    }

    with patch("src.rag.service.RagService") as MockRagService, patch(
        "evaluation.answer_runner.GeminiJudge"
    ) as MockGeminiJudge:
        instance_service = MockRagService.return_value
        instance_service.llm_client = MagicMock()
        instance_service.answer.return_value = mock_response

        instance_judge = MockGeminiJudge.return_value
        instance_judge.score.return_value = mock_score

        rows = run_answer_evaluation(
            [mock_sample1, mock_sample2],
            retrieval_config="vector_baseline",
            existing_rows=existing,
        )

        assert len(rows) == 2
        # test_001 was resumed from existing_rows
        assert rows[0]["generated_answer"] == "Precomputed Answer"
        # test_002 was freshly evaluated
        assert rows[1]["generated_answer"] == "New Answer"
        # Service.answer called only once (for test_002)
        assert instance_service.answer.call_count == 1


def test_ablation_complete_artifact_integrity_and_regeneration():
    ablation_dir = Path(__file__).resolve().parent.parent / "evaluation" / "results" / "training_exam_answer_ablation_complete"
    raw_file = ablation_dir / "raw.jsonl"
    if not raw_file.exists():
        pytest.skip("Generated ablation artifact is excluded from version control")

    rows = []
    with raw_file.open(encoding="utf-8") as f:
        for line in f:
            if line.strip():
                rows.append(json.loads(line))

    assert len(rows) == 90, f"Expected 90 rows in ablation benchmark, found {len(rows)}"

    configs = sorted({r["config"] for r in rows})
    assert configs == ["hybrid", "hybrid_reranker_k10", "vector_baseline"]

    for cfg in configs:
        cfg_rows = [r for r in rows if r["config"] == cfg]
        assert len(cfg_rows) == 30, f"Config {cfg} has {len(cfg_rows)} rows, expected 30"
        prov_errs = sum(1 for r in cfg_rows if float(r.get("provider_error", 0.0)) > 0.0)
        assert prov_errs == 0, f"Config {cfg} has {prov_errs} provider errors"

    # Regenerate summary and offline analysis artifacts to ensure complete paper-ready reports
    summary = write_report(rows, ablation_dir, title="Training and Examination Answer Ablation Complete Evaluation")
    assert "answer_by_config" in summary
    assert "answer_paired_bootstrap" in summary

    offline_res = run_offline_analysis(
        raw_path=raw_file,
        output_dir=ablation_dir,
        baseline_config="vector_baseline",
        seed=42,
        resamples=10000,
    )
    assert (ablation_dir / "summary.json").exists()
    assert (ablation_dir / "report.md").exists()
    assert (ablation_dir / "paired_analysis.json").exists()
    assert (ablation_dir / "sample_deltas.csv").exists()
    assert (ablation_dir / "offline_analysis.md").exists()

