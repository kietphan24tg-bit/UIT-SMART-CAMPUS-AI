from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from threading import Barrier, Lock, Thread
from typing import Any

import pytest
from pydantic import BaseModel, Field

from src.agent.executor import ProposalConflictError, ProposalExpiredError, ProposalForbiddenError, ProposalNotFoundError, SmartCampusAgent
from src.agent.model_client import AgentModelResponse, AgentToolCall
from src.agent.proposals import ToolProposal
from src.agent.tools import ToolContext, ToolOperation, ToolRegistry, build_tool_catalog
from src.agent.tools.base import AgentTool, ToolArgumentsModel
from src.agent.tools.nest_client import NestApiClient
from src.agent.tools.results import ToolError, ToolResult
from src.api.schemas import Citation
from src.core.auth import AuthenticatedUser


class EmptyInput(ToolArgumentsModel):
    pass


class IdInput(ToolArgumentsModel):
    id: str = Field(min_length=1)


class ReadTool(AgentTool):
    name = "get_current_schedule"
    display_name = "get current schedule"
    description = "Read current schedule."
    input_model = EmptyInput
    allowed_roles = frozenset({"student"})
    operation_type = ToolOperation.READ
    requires_confirmation = False

    def __init__(self) -> None:
        self.calls = 0
        self.outcome: ToolResult | None = None

    def _execute_validated(self, context: ToolContext, arguments: BaseModel) -> ToolResult:
        del context, arguments
        self.calls += 1
        return ToolResult(ok=True, tool=self.name, status="success", data={"items": ["Mon 1-3"]})


class ActionTool(AgentTool):
    name = "cancel_room_booking"
    display_name = "cancel room booking"
    description = "Cancel a room booking."
    input_model = IdInput
    allowed_roles = frozenset({"student"})
    operation_type = ToolOperation.UPDATE
    requires_confirmation = True
    risk_level = "medium"

    def __init__(self) -> None:
        self.calls = 0

    def _execute_validated(self, context: ToolContext, arguments: BaseModel) -> ToolResult:
        del context, arguments
        self.calls += 1
        return self.outcome or ToolResult(ok=True, tool=self.name, status="success", data={"ok": True})


class RagTool(AgentTool):
    name = "search_university_policies"
    display_name = "search university policies"
    description = "Search indexed university policies."
    input_model = EmptyInput
    allowed_roles = frozenset({"student"})
    operation_type = ToolOperation.READ
    requires_confirmation = False

    def __init__(self, *, found: bool = True) -> None:
        self.found = found
        self.calls = 0

    def _execute_validated(self, context: ToolContext, arguments: BaseModel) -> ToolResult:
        del context, arguments
        self.calls += 1
        return ToolResult(
            ok=True,
            tool=self.name,
            status="success",
            data={
                "found": self.found,
                "confidence": 0.91 if self.found else 0.0,
                "retrieved_count": 1 if self.found else 0,
                "citations": (
                    [
                        Citation(
                            index=1,
                            source_file="quy-che.md",
                            heading_path="Dieu 5",
                            page_start=3,
                            page_end=3,
                            score=0.91,
                        ).model_dump(exclude_none=True)
                    ]
                    if self.found
                    else []
                ),
                "contexts": (
                    [
                        {
                            "index": 1,
                            "content": "Dieu 5 quy dinh dieu kien du thi.",
                            "citation": {"index": 1, "source_file": "quy-che.md", "heading_path": "Dieu 5"},
                            "metadata": {"category": "exam"},
                        }
                    ]
                    if self.found
                    else []
                ),
            },
        )


class FakeClient:
    def __init__(self, responses: list[object]) -> None:
        self.responses = list(responses)
        self.calls: list[dict] = []

    def generate(self, **kwargs):
        self.calls.append(kwargs)
        return self.responses.pop(0)


@dataclass
class FakeStore:
    available: bool = True

    def __post_init__(self) -> None:
        self.ensure_schema_called = 0
        self.created: ToolProposal | None = None

    def ensure_schema(self) -> None:
        self.ensure_schema_called += 1

    def log_event(self, *args, **kwargs) -> None:
        del args, kwargs

    def create(self, **kwargs) -> ToolProposal:
        self.created = ToolProposal(
            id="11111111-1111-1111-1111-111111111111",
            user_id=kwargs["user_id"],
            role=kwargs["role"],
            session_id=kwargs["session_id"],
            tool_name=kwargs["tool_name"],
            operation_type=kwargs["operation_type"].value,
            risk_level=kwargs["risk_level"],
            arguments=kwargs["arguments"],
            arguments_hash="hash-1",
            confirmation_message=kwargs["confirmation_message"],
            summary=kwargs["summary"],
            status="pending",
            result=None,
            error=None,
            request_id=kwargs["request_id"],
            created_at=datetime.now(UTC),
            expires_at=datetime.now(UTC) + timedelta(seconds=kwargs["ttl_seconds"]),
            confirmed_at=None,
            executed_at=None,
        )
        return self.created

    def get_for_user(self, proposal_id: str, user_id: str) -> ToolProposal | None:
        if not self.created or self.created.id != proposal_id or self.created.user_id != user_id:
            return None
        return self.created

    def expire_pending(self, proposal_id: str, user_id: str) -> ToolProposal | None:
        if not self.created or self.created.id != proposal_id or self.created.user_id != user_id:
            return None
        self.created.status = "expired"
        return self.created

    def claim_pending_for_execution(self, proposal_id: str, user_id: str, role: str) -> ToolProposal | None:
        if (
            not self.created
            or self.created.id != proposal_id
            or self.created.user_id != user_id
            or self.created.role != role
            or self.created.status != "pending"
            or self.created.is_expired
        ):
            return None
        self.created.status = "executing"
        self.created.confirmed_at = datetime.now(UTC)
        return self.created

    def arguments_hash_matches(self, proposal: ToolProposal) -> bool:
        return proposal.arguments_hash == "hash-1"

    def mark_result(self, proposal_id: str, *, status: str, result=None, error=None) -> ToolProposal:
        assert self.created and self.created.id == proposal_id
        self.created.status = status
        self.created.result = result
        self.created.error = error
        self.created.executed_at = datetime.now(UTC)
        return self.created

    def mark_rejected(self, proposal_id: str, user_id: str) -> ToolProposal | None:
        if not self.created or self.created.id != proposal_id or self.created.user_id != user_id:
            return None
        self.created.status = "rejected"
        return self.created


class ConcurrentFakeStore(FakeStore):
    """Fixture equivalent of the database's atomic pending-to-executing claim."""

    def __post_init__(self) -> None:
        super().__post_init__()
        self.claim_lock = Lock()

    def claim_pending_for_execution(self, proposal_id: str, user_id: str, role: str) -> ToolProposal | None:
        with self.claim_lock:
            return super().claim_pending_for_execution(proposal_id, user_id, role)


def _user(role: str = "student") -> AuthenticatedUser:
    return AuthenticatedUser(user_id="u1", role=role, access_token="token-1", profile={"id": "u1", "role": role})


def _response_with_call(name: str, args: dict, *, call_id: str = "call-1") -> AgentModelResponse:
    return AgentModelResponse(
        text="",
        tool_calls=(AgentToolCall(id=call_id, name=name, arguments=args),),
        assistant_message={
            "role": "assistant",
            "content": None,
            "tool_calls": [
                {
                    "id": call_id,
                    "type": "function",
                    "function": {"name": name, "arguments": "{}"},
                }
            ],
        },
    )


def _response_with_text(text: str) -> AgentModelResponse:
    return AgentModelResponse(
        text=text,
        tool_calls=(),
        assistant_message={"role": "assistant", "content": text},
    )


def _sample_schema_value(schema: dict[str, Any]) -> Any:
    if "enum" in schema:
        return schema["enum"][0]
    for branch in schema.get("anyOf", []):
        if branch.get("type") != "null":
            return _sample_schema_value(branch)
    value_type = schema.get("type")
    if value_type == "string":
        return "value"
    if value_type == "integer":
        return max(1, schema.get("minimum", 1))
    if value_type == "number":
        return 1.0
    if value_type == "boolean":
        return True
    if value_type == "array":
        return [_sample_schema_value(schema.get("items", {"type": "string"}))]
    if value_type == "object":
        return {
            name: _sample_schema_value(field_schema)
            for name, field_schema in schema.get("properties", {}).items()
            if name in schema.get("required", [])
        }
    return "value"


def _exposed_mutation_tools() -> list[AgentTool]:
    return [
        tool
        for tool in build_tool_catalog(nest_client=NestApiClient())
        if tool.operation_type is not ToolOperation.READ and tool.should_expose_to_llm()
    ]


def _action_message(tool: AgentTool, arguments: dict[str, Any]) -> str:
    verb = {
        ToolOperation.CREATE: "Tao",
        ToolOperation.UPDATE: "Cap nhat",
        ToolOperation.DELETE: "Xoa",
        ToolOperation.PAYMENT: "Thanh toan",
        ToolOperation.EMERGENCY: "SOS",
    }[tool.operation_type]
    return f"{verb} thao tac {tool.name} voi tham so {arguments}."


def test_executor_executes_read_tool_and_returns_final_answer(monkeypatch):
    monkeypatch.setattr("src.agent.executor.settings.agent_model", "gemini-test")
    monkeypatch.setattr("src.agent.executor.settings.agent_max_tool_steps", 3)
    monkeypatch.setattr("src.agent.executor.settings.agent_max_read_tool_calls", 2)

    read_tool = ReadTool()
    registry = ToolRegistry()
    registry.register(read_tool)
    client = FakeClient([
        _response_with_call("get_current_schedule", {}),
        _response_with_text("Lich hoc hien tai cua ban co 1 buoi Mon 1-3."),
    ])

    agent = SmartCampusAgent(client=client, registry=registry, proposal_store=FakeStore())
    result = agent.answer_query(user=_user(), message="Lich hoc hien tai?", session_id="s1")

    assert result.answer_type == "answer"
    assert "Mon 1-3" in result.answer
    assert read_tool.calls == 1
    assert len(client.calls) == 2
    assert "Asia/Ho_Chi_Minh" in client.calls[0]["system_prompt"]
    assert "Never ask the user what today's date" in client.calls[0]["system_prompt"]
    follow_up_messages = client.calls[1]["messages"]
    assert follow_up_messages[-1]["role"] == "tool"
    assert follow_up_messages[-1]["tool_call_id"] == "call-1"
    assert "tool_result" in follow_up_messages[-1]["content"]
    assert result.trace is not None
    assert [(step.type, step.status) for step in result.trace] == [
        ("analysis", "completed"),
        ("tool", "completed"),
        ("answer", "completed"),
    ]
    assert result.trace[1].tool == "get_current_schedule"


def test_executor_returns_clarification_when_required_tool_argument_is_missing(monkeypatch):
    monkeypatch.setattr("src.agent.executor.settings.agent_actions_enabled", True)
    action_tool = ActionTool()
    registry = ToolRegistry()
    registry.register(action_tool)
    client = FakeClient([_response_with_call("cancel_room_booking", {})])

    agent = SmartCampusAgent(client=client, registry=registry, proposal_store=FakeStore())
    result = agent.answer_query(user=_user(), message="Hủy đặt phòng giúp tôi", session_id="s-clarify")

    assert result.answer_type == "clarification"
    assert result.proposal is None
    assert action_tool.calls == 0
    assert result.trace is not None
    assert result.trace[-1].status == "failed"


def test_executor_creates_proposal_for_action_without_executing_tool(monkeypatch):
    monkeypatch.setattr("src.agent.executor.settings.agent_actions_enabled", True)
    monkeypatch.setattr("src.agent.executor.settings.agent_enabled_action_tools", "cancel_room_booking")
    monkeypatch.setattr("src.agent.executor.settings.agent_confirmation_ttl_seconds", 300)

    action_tool = ActionTool()
    registry = ToolRegistry()
    registry.register(action_tool)
    store = FakeStore()
    client = FakeClient([_response_with_call("cancel_room_booking", {"id": "rb-1"})])

    agent = SmartCampusAgent(client=client, registry=registry, proposal_store=store)
    result = agent.answer_query(user=_user(), message="Huy dat phong rb-1", session_id="s9")

    assert result.answer_type == "confirmation_required"
    assert result.proposal is not None
    assert result.proposal.id == "11111111-1111-1111-1111-111111111111"
    assert "cancel room booking" in result.proposal.summary
    assert result.proposal.risk_level == "medium"
    assert action_tool.calls == 0
    assert store.ensure_schema_called == 1
    assert store.created is not None
    assert store.created.arguments == {"id": "rb-1"}
    assert result.trace is not None
    assert result.trace[-1].type == "confirmation"
    assert result.trace[-1].status == "pending"
    assert result.trace[-1].tool == "cancel_room_booking"
    assert "rb-1" not in result.trace[-1].label


def test_every_exposed_mutation_tool_creates_a_safe_proposal_and_rejects_replay(monkeypatch):
    monkeypatch.setattr("src.agent.executor.settings.agent_actions_enabled", True)
    monkeypatch.setattr("src.agent.executor.settings.agent_confirmation_ttl_seconds", 300)

    tools = _exposed_mutation_tools()
    assert len(tools) == 46

    for tool in tools:
        schema = tool.input_model.model_json_schema()
        arguments = {
            name: _sample_schema_value(field_schema)
            for name, field_schema in schema.get("properties", {}).items()
            if name in schema.get("required", [])
        }
        monkeypatch.setattr("src.agent.executor.settings.agent_enabled_action_tools", tool.name)
        registry = ToolRegistry()
        registry.register(tool)
        store = FakeStore()
        client = FakeClient([_response_with_call(tool.name, arguments)])
        user = _user(next(iter(tool.allowed_roles)))
        agent = SmartCampusAgent(client=client, registry=registry, proposal_store=store)

        result = agent.answer_query(
            user=user,
            message=_action_message(tool, arguments),
            session_id=f"matrix-{tool.name}",
        )

        assert result.answer_type == "confirmation_required", tool.name
        assert result.proposal is not None, tool.name
        assert result.proposal.tool == tool.name
        assert result.proposal.operation == tool.operation_type.value
        assert result.proposal.risk_level == tool.risk_level
        assert store.created is not None
        assert store.created.arguments == arguments
        assert agent.reject_proposal(user=user, proposal_id=store.created.id).status == "rejected"
        with pytest.raises(ProposalConflictError):
            agent.confirm_proposal(user=user, proposal_id=store.created.id)


def test_every_exposed_mutation_tool_rejects_a_role_outside_its_allowlist(monkeypatch):
    monkeypatch.setattr("src.agent.executor.settings.agent_actions_enabled", True)

    for tool in _exposed_mutation_tools():
        schema = tool.input_model.model_json_schema()
        arguments = {
            name: _sample_schema_value(field_schema)
            for name, field_schema in schema.get("properties", {}).items()
            if name in schema.get("required", [])
        }
        monkeypatch.setattr("src.agent.executor.settings.agent_enabled_action_tools", tool.name)
        registry = ToolRegistry()
        registry.register(tool)
        store = FakeStore()
        client = FakeClient([_response_with_call(tool.name, arguments)])
        agent = SmartCampusAgent(client=client, registry=registry, proposal_store=store)

        result = agent.answer_query(
            user=_user("guest"),
            message=_action_message(tool, arguments),
            session_id=f"forbidden-{tool.name}",
        )

        assert result.proposal is None, tool.name
        assert store.created is None, tool.name
        assert "quyền" in result.answer.lower() or "quyen" in result.answer.lower(), tool.name


def test_executor_retries_when_model_asks_for_text_confirmation_instead_of_calling_action(monkeypatch):
    monkeypatch.setattr("src.agent.executor.settings.agent_actions_enabled", True)
    monkeypatch.setattr("src.agent.executor.settings.agent_enabled_action_tools", "cancel_room_booking")
    monkeypatch.setattr("src.agent.executor.settings.agent_confirmation_ttl_seconds", 300)

    action_tool = ActionTool()
    registry = ToolRegistry()
    registry.register(action_tool)
    store = FakeStore()
    client = FakeClient(
        [
            _response_with_text("Bạn có muốn xác nhận hủy đặt phòng rb-1 không?"),
            _response_with_call("cancel_room_booking", {"id": "rb-1"}),
        ]
    )

    agent = SmartCampusAgent(client=client, registry=registry, proposal_store=store)
    result = agent.answer_query(user=_user(), message="Hủy đặt phòng rb-1", session_id="s-retry")

    assert len(client.calls) == 2
    assert result.answer_type == "confirmation_required"
    assert result.proposal is not None
    assert result.proposal.tool == "cancel_room_booking"
    assert action_tool.calls == 0


def test_executor_retries_when_model_answers_an_explicit_action_without_calling_tool(monkeypatch):
    monkeypatch.setattr("src.agent.executor.settings.agent_actions_enabled", True)
    monkeypatch.setattr("src.agent.executor.settings.agent_enabled_action_tools", "cancel_room_booking")
    monkeypatch.setattr("src.agent.executor.settings.agent_confirmation_ttl_seconds", 300)

    action_tool = ActionTool()
    registry = ToolRegistry()
    registry.register(action_tool)
    store = FakeStore()
    client = FakeClient(
        [
            _response_with_text("Tôi đã ghi nhận yêu cầu."),
            _response_with_call("cancel_room_booking", {"id": "rb-1"}),
        ]
    )

    agent = SmartCampusAgent(client=client, registry=registry, proposal_store=store)
    result = agent.answer_query(
        user=_user(),
        message="Hủy đặt phòng rb-1",
        session_id="s-explicit-action-retry",
    )

    assert len(client.calls) == 2
    assert result.answer_type == "confirmation_required"
    assert result.proposal is not None
    assert result.proposal.tool == "cancel_room_booking"
    assert action_tool.calls == 0


def test_unrouted_action_retry_normalizes_vietnamese_d_stroke():
    assert SmartCampusAgent._should_retry_unrouted_action(
        "Đánh dấu tất cả thông báo là đã đọc.",
        "Tôi đã ghi nhận.",
    )


def test_executor_action_flag_without_tool_allowlist_fails_closed(monkeypatch):
    monkeypatch.setattr("src.agent.executor.settings.agent_actions_enabled", True)
    monkeypatch.setattr("src.agent.executor.settings.agent_enabled_action_tools", "")
    monkeypatch.setattr("src.agent.executor.settings.agent_enabled_action_risk_levels", "")

    action_tool = ActionTool()
    registry = ToolRegistry()
    registry.register(action_tool)
    store = FakeStore()
    client = FakeClient([_response_with_call("cancel_room_booking", {"id": "rb-1"})])

    agent = SmartCampusAgent(client=client, registry=registry, proposal_store=store)
    result = agent.answer_query(user=_user(), message="Huy dat phong rb-1", session_id="s-closed")

    assert result.proposal is None
    assert action_tool.calls == 0
    assert store.created is None
    assert result.trace is not None
    assert result.trace[-1].status == "failed"


def test_executor_rejects_multiple_tool_calls_safely(monkeypatch):
    monkeypatch.setattr("src.agent.executor.settings.agent_model", "gemini-test")
    registry = ToolRegistry()
    registry.register(ReadTool())
    registry.register(ActionTool())
    client = FakeClient(
        [
            AgentModelResponse(
                text="",
                tool_calls=(
                    AgentToolCall(id="call-1", name="get_current_schedule", arguments={}),
                    AgentToolCall(id="call-2", name="cancel_room_booking", arguments={"id": "rb-1"}),
                ),
                assistant_message={"role": "assistant", "content": None},
            )
        ]
    )

    agent = SmartCampusAgent(client=client, registry=registry, proposal_store=FakeStore())
    result = agent.answer_query(user=_user(), message="Lam hai viec")

    assert result.answer_type == "answer"
    assert "từng thao tác một" in result.answer


def test_executor_uses_rag_evidence_and_returns_citations(monkeypatch):
    monkeypatch.setattr("src.agent.executor.settings.agent_model", "gemini-test")
    registry = ToolRegistry()
    rag_tool = RagTool(found=True)
    registry.register(rag_tool)
    client = FakeClient([
        _response_with_call("search_university_policies", {}),
        _response_with_text("Dieu kien du thi duoc neu trong Dieu 5 [1] [9]"),
    ])

    agent = SmartCampusAgent(client=client, registry=registry, proposal_store=FakeStore())
    result = agent.answer_query(user=_user(), message="Dieu kien du thi la gi?")

    assert result.answer_type == "answer"
    assert result.citations is not None
    assert len(result.citations) == 1
    assert result.citations[0].index == 1
    assert "[9]" not in result.answer
    assert rag_tool.calls == 1


def test_executor_returns_fallback_when_rag_has_no_evidence(monkeypatch):
    monkeypatch.setattr("src.agent.executor.settings.agent_model", "gemini-test")
    registry = ToolRegistry()
    rag_tool = RagTool(found=False)
    registry.register(rag_tool)
    client = FakeClient([_response_with_call("search_university_policies", {})])

    agent = SmartCampusAgent(client=client, registry=registry, proposal_store=FakeStore())
    result = agent.answer_query(user=_user(), message="Cau hoi ngoai pham vi")

    assert result.answer_type == "fallback"
    assert result.fallback_reason == "no_evidence"
    assert "chưa tìm thấy đủ căn cứ" in result.answer
    assert result.citations == []
    assert rag_tool.calls == 1
    assert len(client.calls) == 1


def test_executor_falls_back_when_rag_answer_has_no_citation(monkeypatch):
    monkeypatch.setattr("src.agent.executor.settings.agent_model", "gemini-test")
    registry = ToolRegistry()
    rag_tool = RagTool(found=True)
    registry.register(rag_tool)
    client = FakeClient([
        _response_with_call("search_university_policies", {}),
        _response_with_text("Dieu kien du thi duoc quy dinh trong van ban."),
    ])

    agent = SmartCampusAgent(client=client, registry=registry, proposal_store=FakeStore())
    result = agent.answer_query(user=_user(), message="Dieu kien du thi la gi?")

    assert result.answer_type == "fallback"
    assert result.fallback_reason == "missing_citation"
    assert result.citations == []


def test_executor_marks_explicit_out_of_scope_as_fallback(monkeypatch):
    monkeypatch.setattr("src.agent.executor.settings.agent_model", "gemini-test")
    registry = ToolRegistry()
    client = FakeClient([_response_with_text("Day la mot bai tho ve mua thu.")])

    agent = SmartCampusAgent(client=client, registry=registry, proposal_store=FakeStore())
    result = agent.answer_query(user=_user(), message="Hãy viết một bài thơ về mùa thu.")

    assert result.answer_type == "fallback"
    assert result.fallback_reason == "out_of_scope"


def test_executor_builds_messages_from_history_before_current_message(monkeypatch):
    monkeypatch.setattr("src.agent.executor.settings.agent_model", "gemini-test")
    registry = ToolRegistry()
    client = FakeClient([_response_with_text("Da hieu ngu canh.")])

    agent = SmartCampusAgent(client=client, registry=registry, proposal_store=FakeStore())
    result = agent.answer_query(
        user=_user(),
        message="Con tuan sau thi sao?",
        session_id="s1",
        history=[
            {"role": "user", "content": "Lich SE104?"},
            {"role": "assistant", "content": "SE104 hoc thu ba."},
        ],
    )

    assert result.answer_type == "answer"
    messages = client.calls[0]["messages"]
    assert [item["role"] for item in messages] == ["user", "assistant", "user"]
    assert messages[0]["content"] == "Lich SE104?"
    assert messages[1]["content"] == "SE104 hoc thu ba."
    assert messages[2]["content"] == "Con tuan sau thi sao?"


def _action_agent(monkeypatch, *, outcome: ToolResult | None = None, store: FakeStore | None = None):
    monkeypatch.setattr("src.agent.executor.settings.agent_actions_enabled", True)
    monkeypatch.setattr("src.agent.executor.settings.agent_enabled_action_tools", "cancel_room_booking")
    action_tool = ActionTool()
    action_tool.outcome = outcome
    registry = ToolRegistry()
    registry.register(action_tool)
    store = store or FakeStore()
    client = FakeClient([_response_with_call("cancel_room_booking", {"id": "rb-1"})])
    agent = SmartCampusAgent(client=client, registry=registry, proposal_store=store)
    result = agent.answer_query(user=_user(), message="Huy dat phong rb-1", session_id="s1")
    assert result.answer_type == "confirmation_required"
    assert store.created is not None
    return agent, action_tool, store


def test_concurrent_confirmation_claims_proposal_once(monkeypatch):
    agent, action_tool, store = _action_agent(monkeypatch, store=ConcurrentFakeStore())
    barrier = Barrier(2)
    outcomes = []

    def confirm() -> None:
        barrier.wait()
        try:
            outcomes.append(agent.confirm_proposal(user=_user(), proposal_id=store.created.id))
        except ProposalConflictError:
            outcomes.append("conflict")

    threads = [Thread(target=confirm) for _ in range(2)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()

    assert len(outcomes) == 2
    assert sum(item != "conflict" for item in outcomes) == 1
    assert sum(item == "conflict" for item in outcomes) == 1
    assert action_tool.calls == 1


def test_action_confirmation_replay_is_rejected(monkeypatch):
    agent, action_tool, store = _action_agent(monkeypatch)

    first = agent.confirm_proposal(user=_user(), proposal_id=store.created.id)
    assert first.status == "executed"
    assert action_tool.calls == 1

    try:
        agent.confirm_proposal(user=_user(), proposal_id=store.created.id)
    except ProposalConflictError:
        pass
    else:
        raise AssertionError("A replayed confirmation must be rejected")
    assert action_tool.calls == 1


def test_action_expiry_and_wrong_user_are_rejected(monkeypatch):
    agent, action_tool, store = _action_agent(monkeypatch)
    store.created.expires_at = datetime.now(UTC) - timedelta(seconds=1)

    try:
        agent.confirm_proposal(user=_user(), proposal_id=store.created.id)
    except ProposalExpiredError:
        pass
    else:
        raise AssertionError("An expired proposal must be rejected")
    assert action_tool.calls == 0

    agent, action_tool, store = _action_agent(monkeypatch)
    wrong_user = AuthenticatedUser(user_id="u2", role="student", access_token="token-2", profile={"id": "u2", "role": "student"})
    try:
        agent.confirm_proposal(user=wrong_user, proposal_id=store.created.id)
    except (ProposalConflictError, ProposalForbiddenError, ProposalNotFoundError):
        pass
    else:
        raise AssertionError("A wrong-user confirmation must be rejected")
    assert action_tool.calls == 0


def test_action_timeout_is_marked_execution_unknown(monkeypatch):
    timeout = ToolResult(
        ok=False,
        tool="cancel_room_booking",
        status="failed",
        error=ToolError(code="timeout", message="upstream timeout", retryable=True),
    )
    agent, action_tool, store = _action_agent(monkeypatch, outcome=timeout)

    result = agent.confirm_proposal(user=_user(), proposal_id=store.created.id)

    assert result.status == "execution_unknown"
    assert action_tool.calls == 1


def test_executor_does_not_create_action_from_history_only(monkeypatch):
    monkeypatch.setattr("src.agent.executor.settings.agent_actions_enabled", True)
    registry = ToolRegistry()
    registry.register(ActionTool())
    client = FakeClient([_response_with_call("cancel_room_booking", {"id": "rb-1"})])

    agent = SmartCampusAgent(client=client, registry=registry, proposal_store=FakeStore())
    result = agent.answer_query(
        user=_user(),
        message="Con viec do hien tai trang thai sao?",
        session_id="s1",
        history=[
            {"role": "user", "content": "Huy dat phong rb-1"},
            {"role": "assistant", "content": "Ban co chac muon huy dat phong rb-1 khong?"},
        ],
    )

    assert result.answer_type == "answer"
    assert result.proposal is None
    assert "chưa thấy một yêu cầu hành động đủ rõ ràng" in result.answer.lower()
