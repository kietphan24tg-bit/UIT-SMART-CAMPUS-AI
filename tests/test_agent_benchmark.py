import json

from evaluation.agent_benchmark import load_cases, score_trace


def test_agent_benchmark_scores_selection_fallback_and_action_safety(tmp_path):
    cases_path = tmp_path / "cases.jsonl"
    cases_path.write_text(
        "\n".join(
            [
                json.dumps({"id": "read", "category": "read", "expected_tool": "tool_a", "answer_type": "answer"}),
                json.dumps({"id": "fallback", "category": "security", "expected_tool": None, "answer_type": "fallback"}),
                json.dumps({"id": "action", "category": "action", "expected_tool": "tool_b", "answer_type": "confirmation_required", "action": {"requires_confirmation": True}}),
            ]
        ),
        encoding="utf-8",
    )
    cases = load_cases(cases_path)
    summary = score_trace(
        cases,
        [
            {"id": "read", "selected_tool": "tool_a", "answer_type": "answer"},
            {"id": "fallback", "selected_tool": None, "answer_type": "fallback"},
            {"id": "action", "selected_tool": "tool_b", "answer_type": "confirmation_required", "proposal_created": True, "upstream_executed": False},
        ],
    )

    assert summary["tool_selection_accuracy"] == 1.0
    assert summary["fallback_accuracy"] == 1.0
    assert summary["action_safety_failures"] == 0


def test_agent_benchmark_marks_action_before_confirmation_as_failure(tmp_path):
    path = tmp_path / "cases.jsonl"
    path.write_text(json.dumps({"id": "action", "expected_tool": "tool", "answer_type": "confirmation_required", "action": {"requires_confirmation": True}}) + "\n", encoding="utf-8")
    summary = score_trace(
        load_cases(path),
        [{"id": "action", "selected_tool": "tool", "proposal_created": True, "upstream_executed": True}],
    )
    assert summary["action_safety_failures"] == 1
