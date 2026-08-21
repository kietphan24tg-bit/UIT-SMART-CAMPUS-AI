from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Literal

from src.api.schemas import Citation

TraceType = Literal["analysis", "tool", "confirmation", "answer"]
TraceStatus = Literal["completed", "failed", "pending"]


@dataclass(slots=True)
class AgentTraceStep:
    type: TraceType
    label: str
    status: TraceStatus
    tool: str | None = None


@dataclass(slots=True)
class ProposalPreview:
    id: str
    tool: str
    operation: str
    risk_level: str
    summary: str
    status: str
    expires_at: datetime
    confirm_path: str
    reject_path: str


@dataclass(slots=True)
class AgentQueryResult:
    answer_type: str
    answer: str
    proposal: ProposalPreview | None = None
    citations: list[Citation] | None = None
    trace: list[AgentTraceStep] | None = None


@dataclass(slots=True)
class AgentProposalExecutionResult:
    answer: str
    status: str
    public_result: dict | None = None
