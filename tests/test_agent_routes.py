from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient

from src.agent.models import AgentProposalExecutionResult, AgentQueryResult, AgentTraceStep, ProposalPreview
from src.agent.proposals import ToolProposal
from src.api.schemas import Citation
from src.core.auth import AuthenticatedUser, require_authenticated_user
from src.main import create_app


@dataclass
class FakeAgent:
    proposal_store: object

    def __post_init__(self) -> None:
        self.query_calls = []
        self.proposals: dict[str, ToolProposal] = {}

    def answer_query(self, *, user: AuthenticatedUser, message: str, session_id: str | None = None) -> AgentQueryResult:
        self.query_calls.append((user.user_id, message, session_id))
        return AgentQueryResult(
            answer_type="confirmation_required",
            answer="Ban co chac muon huy dat phong rb-1 khong?",
            proposal=ProposalPreview(
                id="11111111-1111-1111-1111-111111111111",
                tool="cancel_room_booking",
                operation="update",
                risk_level="medium",
                summary="cancel room booking: id=rb-1",
                status="pending",
                expires_at=datetime.now(UTC) + timedelta(minutes=5),
                confirm_path="/agent/proposals/11111111-1111-1111-1111-111111111111/confirm",
                reject_path="/agent/proposals/11111111-1111-1111-1111-111111111111/reject",
            ),
            citations=[Citation(index=1, source_file="quy-che.md", heading_path="Dieu 5")],
            trace=[
                AgentTraceStep(type="analysis", label="Da phan tich yeu cau", status="completed"),
                AgentTraceStep(
                    type="confirmation",
                    label="cancel room booking",
                    status="pending",
                    tool="cancel_room_booking",
                ),
            ],
        )

    def get_proposal(self, *, user: AuthenticatedUser, proposal_id: str) -> ToolProposal | None:
        del user
        return self.proposals.get(proposal_id)

    def confirm_proposal(self, *, user: AuthenticatedUser, proposal_id: str) -> AgentProposalExecutionResult:
        del user, proposal_id
        return AgentProposalExecutionResult(
            answer="Da thuc hien thanh cong.",
            status="executed",
            public_result={"ok": True, "tool": "cancel_room_booking", "status": "success", "data": {"ok": True}},
        )

    def reject_proposal(self, *, user: AuthenticatedUser, proposal_id: str) -> ToolProposal | None:
        del user
        proposal = self.proposals.get(proposal_id)
        if proposal is None:
            return None
        proposal.status = "rejected"
        return proposal


class FakeStore:
    available = True


def _proposal(status: str = "pending") -> ToolProposal:
    return ToolProposal(
        id="11111111-1111-1111-1111-111111111111",
        user_id="u1",
        role="student",
        session_id="s1",
        tool_name="cancel_room_booking",
        operation_type="update",
        risk_level="medium",
        arguments={"id": "rb-1"},
        arguments_hash="hash-1",
        confirmation_message="Ban co chac muon huy dat phong rb-1 khong?",
        summary="cancel room booking: id=rb-1",
        status=status,  # type: ignore[arg-type]
        result=None,
        error=None,
        request_id="req-1",
        created_at=datetime.now(UTC),
        expires_at=datetime.now(UTC) + timedelta(minutes=5),
        confirmed_at=None,
        executed_at=None,
    )


def _current_user() -> AuthenticatedUser:
    return AuthenticatedUser(user_id="u1", role="student", access_token="token", profile={"id": "u1", "role": "student"})


def test_agent_query_and_confirm_routes(monkeypatch):
    app = create_app()
    app.dependency_overrides[require_authenticated_user] = _current_user
    fake_agent = FakeAgent(proposal_store=FakeStore())
    fake_agent.proposals["11111111-1111-1111-1111-111111111111"] = _proposal()
    monkeypatch.setattr("src.api.routes.agent.agent", fake_agent)

    client = TestClient(app)

    query_response = client.post("/agent/query", json={"message": "Huy dat phong rb-1", "session_id": "s1"})
    assert query_response.status_code == 200
    payload = query_response.json()
    assert payload["answer_type"] == "confirmation_required"
    assert payload["proposal"]["id"] == "11111111-1111-1111-1111-111111111111"
    assert payload["proposal"]["risk_level"] == "medium"
    assert payload["citations"][0]["source_file"] == "quy-che.md"
    assert payload["trace"] == [
        {"type": "analysis", "label": "Da phan tich yeu cau", "status": "completed", "tool": None},
        {
            "type": "confirmation",
            "label": "cancel room booking",
            "status": "pending",
            "tool": "cancel_room_booking",
        },
    ]

    get_response = client.get("/agent/proposals/11111111-1111-1111-1111-111111111111")
    assert get_response.status_code == 200
    assert get_response.json()["status"] == "pending"

    confirm_response = client.post(
        "/agent/proposals/11111111-1111-1111-1111-111111111111/confirm",
    )
    assert confirm_response.status_code == 200
    assert confirm_response.json()["result"]["tool"] == "cancel_room_booking"


def test_agent_reject_route_returns_conflict_when_not_pending(monkeypatch):
    app = create_app()
    app.dependency_overrides[require_authenticated_user] = _current_user
    fake_agent = FakeAgent(proposal_store=FakeStore())
    fake_agent.proposals["11111111-1111-1111-1111-111111111111"] = _proposal(status="executed")
    monkeypatch.setattr("src.api.routes.agent.agent", fake_agent)

    client = TestClient(app)
    response = client.post("/agent/proposals/11111111-1111-1111-1111-111111111111/reject")

    assert response.status_code == 409
