from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace

from google.genai import types
from pydantic import BaseModel, Field

from src.agent.executor import SmartCampusAgent
from src.agent.proposals import ToolProposal
from src.agent.tools import ToolContext, ToolOperation, ToolRegistry
from src.agent.tools.base import AgentTool, ToolArgumentsModel
from src.agent.tools.results import ToolResult
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
        return ToolResult(ok=True, tool=self.name, status="success", data={"ok": True})


class FakeModels:
    def __init__(self, responses: list[object]) -> None:
        self.responses = list(responses)
        self.calls: list[dict] = []

    def generate_content(self, **kwargs):
        self.calls.append(kwargs)
        return self.responses.pop(0)


class FakeClient:
    def __init__(self, responses: list[object]) -> None:
        self.models = FakeModels(responses)


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


def _user(role: str = "student") -> AuthenticatedUser:
    return AuthenticatedUser(user_id="u1", role=role, access_token="token-1", profile={"id": "u1", "role": role})


def _response_with_call(name: str, args: dict) -> object:
    return SimpleNamespace(
        text="",
        function_calls=[SimpleNamespace(name=name, args=args)],
        candidates=[SimpleNamespace(content=types.Content(role="model", parts=[]))],
    )


def _response_with_text(text: str) -> object:
    return SimpleNamespace(text=text, function_calls=[], candidates=[SimpleNamespace(content=types.Content(role="model", parts=[]))])


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
    assert len(client.models.calls) == 2
    assert result.trace is not None
    assert [(step.type, step.status) for step in result.trace] == [
        ("analysis", "completed"),
        ("tool", "completed"),
        ("answer", "completed"),
    ]
    assert result.trace[1].tool == "get_current_schedule"


def test_executor_creates_proposal_for_action_without_executing_tool(monkeypatch):
    monkeypatch.setattr("src.agent.executor.settings.agent_actions_enabled", True)
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


def test_executor_rejects_multiple_tool_calls_safely(monkeypatch):
    monkeypatch.setattr("src.agent.executor.settings.agent_model", "gemini-test")
    registry = ToolRegistry()
    registry.register(ReadTool())
    registry.register(ActionTool())
    client = FakeClient(
        [
            SimpleNamespace(
                text="",
                function_calls=[
                    SimpleNamespace(name="get_current_schedule", args={}),
                    SimpleNamespace(name="cancel_room_booking", args={"id": "rb-1"}),
                ],
                candidates=[SimpleNamespace(content=types.Content(role="model", parts=[]))],
            )
        ]
    )

    agent = SmartCampusAgent(client=client, registry=registry, proposal_store=FakeStore())
    result = agent.answer_query(user=_user(), message="Lam hai viec")

    assert result.answer_type == "answer"
    assert "tung thao tac mot" in result.answer
