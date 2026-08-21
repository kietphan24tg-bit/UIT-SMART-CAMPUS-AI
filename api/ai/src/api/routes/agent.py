from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from src.agent.executor import (
    ProposalConflictError,
    ProposalExpiredError,
    ProposalForbiddenError,
    ProposalNotFoundError,
    agent,
)
from src.agent.proposals import ToolProposal
from src.api.schemas import Citation
from src.core.auth import AuthenticatedUser, CurrentUser
from src.core.config import settings
from src.core.limits import RateLimitPolicy, guardrail_store

router = APIRouter()


class AgentQueryRequest(BaseModel):
    message: str = Field(min_length=1, max_length=settings.agent_max_message_chars)
    session_id: str | None = Field(default=None, max_length=settings.agent_max_session_id_chars)


class AgentProposalResponse(BaseModel):
    id: str
    tool: str
    operation: str
    risk_level: str
    summary: str
    status: str
    expires_at: datetime
    confirm_path: str
    reject_path: str


class AgentQueryResponse(BaseModel):
    answer_type: str
    answer: str
    proposal: AgentProposalResponse | None = None
    citations: list[Citation] = Field(default_factory=list)
    trace: list["AgentTraceStepResponse"] = Field(default_factory=list)


class AgentTraceStepResponse(BaseModel):
    type: str
    label: str
    status: str
    tool: str | None = None


class ProposalStatusResponse(BaseModel):
    id: str
    tool: str
    operation: str
    risk_level: str
    summary: str
    status: str
    expires_at: datetime
    confirmed_at: datetime | None = None
    executed_at: datetime | None = None
    result: dict[str, Any] | None = None
    error: dict[str, Any] | None = None


class ProposalConfirmResponse(BaseModel):
    answer: str
    status: str
    result: dict[str, Any] | None = None


@router.post("/query", response_model=AgentQueryResponse)
def query_agent(
    req: AgentQueryRequest,
    current_user: AuthenticatedUser = CurrentUser,
) -> AgentQueryResponse:
    _enforce_query_limits(current_user.user_id)
    with guardrail_store.concurrency_slot(
        f"agent:concurrency:{current_user.user_id}",
        settings.agent_max_concurrent_requests_per_user,
    ):
        result = agent.answer_query(
            user=current_user,
            message=req.message.strip(),
            session_id=req.session_id,
        )
    proposal = None
    if result.proposal is not None:
        proposal = AgentProposalResponse(
            id=result.proposal.id,
            tool=result.proposal.tool,
            operation=result.proposal.operation,
            risk_level=result.proposal.risk_level,
            summary=result.proposal.summary,
            status=result.proposal.status,
            expires_at=result.proposal.expires_at,
            confirm_path=result.proposal.confirm_path,
            reject_path=result.proposal.reject_path,
        )
    trace = [
        AgentTraceStepResponse(
            type=step.type,
            label=step.label,
            status=step.status,
            tool=step.tool,
        )
        for step in (result.trace or [])
    ]
    return AgentQueryResponse(
        answer_type=result.answer_type,
        answer=result.answer,
        proposal=proposal,
        citations=result.citations or [],
        trace=trace,
    )


@router.get("/proposals/{proposal_id}", response_model=ProposalStatusResponse)
def get_proposal(
    proposal_id: UUID,
    current_user: AuthenticatedUser = CurrentUser,
) -> ProposalStatusResponse:
    _ensure_actions_storage_available()
    proposal = agent.get_proposal(user=current_user, proposal_id=str(proposal_id))
    if proposal is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal not found.")
    return _proposal_status_response(proposal)


@router.post("/proposals/{proposal_id}/confirm", response_model=ProposalConfirmResponse)
def confirm_proposal(
    proposal_id: UUID,
    current_user: AuthenticatedUser = CurrentUser,
) -> ProposalConfirmResponse:
    _ensure_actions_storage_available()
    guardrail_store.enforce_rate_limit(
        f"agent:confirm:{current_user.user_id}",
        RateLimitPolicy(
            limit=settings.agent_confirm_rate_limit_per_minute,
            window_seconds=60,
            fail_closed=bool(settings.redis_url),
        ),
    )
    try:
        result = agent.confirm_proposal(user=current_user, proposal_id=str(proposal_id))
    except ProposalNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal not found.") from exc
    except ProposalExpiredError as exc:
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Proposal has expired.") from exc
    except ProposalForbiddenError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal not found.") from exc
    except ProposalConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Proposal is no longer pending.") from exc
    return ProposalConfirmResponse(answer=result.answer, status=result.status, result=result.public_result)


@router.post("/proposals/{proposal_id}/reject", response_model=ProposalStatusResponse)
def reject_proposal(
    proposal_id: UUID,
    current_user: AuthenticatedUser = CurrentUser,
) -> ProposalStatusResponse:
    _ensure_actions_storage_available()
    proposal = agent.get_proposal(user=current_user, proposal_id=str(proposal_id))
    if proposal is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal not found.")
    if proposal.status == "pending" and proposal.is_expired:
        proposal = agent.reject_proposal(user=current_user, proposal_id=str(proposal_id)) or proposal
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Proposal has expired.")
    if proposal.status != "pending":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Proposal is no longer pending.")

    rejected = agent.reject_proposal(user=current_user, proposal_id=str(proposal_id))
    if rejected is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal not found.")
    if rejected.status == "expired":
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Proposal has expired.")
    return _proposal_status_response(rejected)


def _proposal_status_response(proposal: ToolProposal) -> ProposalStatusResponse:
    return ProposalStatusResponse(
        id=proposal.id,
        tool=proposal.tool_name,
        operation=proposal.operation_type,
        risk_level=proposal.risk_level,
        summary=proposal.summary,
        status=proposal.status,
        expires_at=proposal.expires_at,
        confirmed_at=proposal.confirmed_at,
        executed_at=proposal.executed_at,
        result=proposal.result,
        error=proposal.error,
    )


def _ensure_actions_storage_available() -> None:
    if not agent.proposal_store.available:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Agent action storage is not configured.",
        )


def _enforce_query_limits(user_id: str) -> None:
    guardrail_store.enforce_rate_limit(
        f"agent:query:{user_id}",
        RateLimitPolicy(
            limit=settings.agent_query_rate_limit_per_minute,
            window_seconds=60,
            fail_closed=False,
        ),
    )
