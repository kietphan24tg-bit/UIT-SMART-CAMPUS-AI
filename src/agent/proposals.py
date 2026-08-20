from __future__ import annotations

import hmac
import hashlib
import json
import re
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any, Literal

import psycopg
from psycopg.rows import dict_row

from src.agent.tools import ToolError, ToolOperation, ToolResult
from src.core.config import settings
from src.core.safety import fit_public_payload

ProposalStatus = Literal[
    "pending",
    "executing",
    "executed",
    "rejected",
    "expired",
    "failed",
    "execution_unknown",
]


@dataclass(slots=True)
class ToolProposal:
    id: str
    user_id: str
    role: str
    session_id: str | None
    tool_name: str
    operation_type: str
    risk_level: str
    arguments: dict[str, Any]
    arguments_hash: str
    confirmation_message: str
    summary: str
    status: ProposalStatus
    result: dict[str, Any] | None
    error: dict[str, Any] | None
    request_id: str
    created_at: datetime
    expires_at: datetime
    confirmed_at: datetime | None
    executed_at: datetime | None

    @property
    def is_expired(self) -> bool:
        return self.expires_at <= datetime.now(UTC)


@dataclass(slots=True)
class AuditEvent:
    event_type: str
    request_id: str
    user_id: str
    role: str
    tool_name: str | None
    operation_type: str | None
    proposal_id: str | None
    status: str
    latency_ms: int | None
    error_code: str | None
    metadata: dict[str, Any] | None


class ProposalStore:
    def __init__(self, database_url: str | None = None, schema: str | None = None) -> None:
        self.database_url = database_url or settings.database_url
        self.schema = schema or settings.agent_db_schema

    @property
    def available(self) -> bool:
        return bool(self.database_url)

    def ensure_schema(self) -> None:
        if not self.database_url:
            raise ValueError("DATABASE_URL is required for proposal store")

        schema = self._quoted_schema
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(f"CREATE SCHEMA IF NOT EXISTS {schema}")
                cur.execute(
                    f"""
                    CREATE TABLE IF NOT EXISTS {schema}.tool_proposals (
                        id UUID PRIMARY KEY,
                        user_id TEXT NOT NULL,
                        role TEXT NOT NULL,
                        session_id TEXT,
                        tool_name TEXT NOT NULL,
                        operation_type TEXT NOT NULL,
                        risk_level TEXT NOT NULL DEFAULT 'low',
                        arguments JSONB NOT NULL DEFAULT '{{}}'::jsonb,
                        arguments_hash TEXT NOT NULL,
                        confirmation_message TEXT NOT NULL,
                        summary TEXT NOT NULL,
                        status TEXT NOT NULL,
                        result JSONB,
                        error JSONB,
                        request_id TEXT NOT NULL,
                        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                        expires_at TIMESTAMPTZ NOT NULL,
                        confirmed_at TIMESTAMPTZ,
                        executed_at TIMESTAMPTZ
                    )
                    """
                )
                cur.execute(
                    f"ALTER TABLE {schema}.tool_proposals ADD COLUMN IF NOT EXISTS risk_level TEXT NOT NULL DEFAULT 'low'"
                )
                cur.execute(
                    f"""
                    CREATE TABLE IF NOT EXISTS {schema}.audit_events (
                        id UUID PRIMARY KEY,
                        event_type TEXT NOT NULL,
                        request_id TEXT NOT NULL,
                        user_id TEXT NOT NULL,
                        role TEXT NOT NULL,
                        tool_name TEXT,
                        operation_type TEXT,
                        proposal_id UUID,
                        status TEXT NOT NULL,
                        latency_ms INTEGER,
                        error_code TEXT,
                        metadata JSONB,
                        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
                    )
                    """
                )
                cur.execute(
                    f"CREATE INDEX IF NOT EXISTS tool_proposals_user_status_idx ON {schema}.tool_proposals (user_id, status)"
                )
                cur.execute(
                    f"CREATE INDEX IF NOT EXISTS tool_proposals_expires_at_idx ON {schema}.tool_proposals (expires_at)"
                )
                cur.execute(
                    f"CREATE INDEX IF NOT EXISTS tool_proposals_created_at_idx ON {schema}.tool_proposals (created_at DESC)"
                )
                cur.execute(
                    f"CREATE INDEX IF NOT EXISTS audit_events_user_status_idx ON {schema}.audit_events (user_id, status, created_at DESC)"
                )
                cur.execute(
                    f"CREATE INDEX IF NOT EXISTS audit_events_proposal_idx ON {schema}.audit_events (proposal_id)"
                )
            conn.commit()

    def create(
        self,
        *,
        user_id: str,
        role: str,
        session_id: str | None,
        tool_name: str,
        operation_type: ToolOperation,
        risk_level: str,
        arguments: dict[str, Any],
        confirmation_message: str,
        summary: str,
        request_id: str,
        ttl_seconds: int,
    ) -> ToolProposal:
        expires_at = datetime.now(UTC) + timedelta(seconds=ttl_seconds)
        proposal_id = str(uuid.uuid4())
        arguments_hash = _hash_arguments(arguments)

        with self._connect(row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"""
                    INSERT INTO {self._quoted_schema}.tool_proposals (
                        id, user_id, role, session_id, tool_name, operation_type, risk_level,
                        arguments, arguments_hash, confirmation_message, summary,
                        status, request_id, expires_at
                    )
                    VALUES (
                        %s::uuid, %s, %s, %s, %s, %s, %s,
                        %s::jsonb, %s, %s, %s,
                        'pending', %s, %s
                    )
                    RETURNING *
                    """,
                    (
                        proposal_id,
                        user_id,
                        role,
                        session_id,
                        tool_name,
                        operation_type.value,
                        risk_level,
                        json.dumps(arguments, ensure_ascii=False, sort_keys=True),
                        arguments_hash,
                        confirmation_message,
                        summary,
                        request_id,
                        expires_at,
                    ),
                )
                row = cur.fetchone()
            conn.commit()
        return self._row_to_proposal(row)

    def get_for_user(self, proposal_id: str, user_id: str) -> ToolProposal | None:
        with self._connect(row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT * FROM {self._quoted_schema}.tool_proposals WHERE id = %s::uuid AND user_id = %s",
                    (proposal_id, user_id),
                )
                row = cur.fetchone()
        if not row:
            return None
        return self._row_to_proposal(row)

    def claim_pending_for_execution(self, proposal_id: str, user_id: str, role: str) -> ToolProposal | None:
        with self._connect(row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"""
                    UPDATE {self._quoted_schema}.tool_proposals
                    SET status = 'executing',
                        confirmed_at = now()
                    WHERE id = %s::uuid
                      AND user_id = %s
                      AND role = %s
                      AND status = 'pending'
                      AND expires_at > now()
                    RETURNING *
                    """,
                    (proposal_id, user_id, role),
                )
                row = cur.fetchone()
            conn.commit()
        if not row:
            return None
        return self._row_to_proposal(row)

    def mark_rejected(self, proposal_id: str, user_id: str) -> ToolProposal | None:
        with self._connect(row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"""
                    UPDATE {self._quoted_schema}.tool_proposals
                    SET status = CASE WHEN expires_at <= now() THEN 'expired' ELSE 'rejected' END
                    WHERE id = %s::uuid
                      AND user_id = %s
                      AND status = 'pending'
                    RETURNING *
                    """,
                    (proposal_id, user_id),
                )
                row = cur.fetchone()
            conn.commit()
        if not row:
            return None
        return self._row_to_proposal(row)

    def mark_result(
        self,
        proposal_id: str,
        *,
        status: ProposalStatus,
        result: dict[str, Any] | None = None,
        error: dict[str, Any] | None = None,
    ) -> ToolProposal:
        with self._connect(row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"""
                    UPDATE {self._quoted_schema}.tool_proposals
                    SET status = %s,
                        result = %s::jsonb,
                        error = %s::jsonb,
                        executed_at = now()
                    WHERE id = %s::uuid
                    RETURNING *
                    """,
                    (
                        status,
                        json.dumps(result, ensure_ascii=False) if result is not None else None,
                        json.dumps(error, ensure_ascii=False) if error is not None else None,
                        proposal_id,
                    ),
                )
                row = cur.fetchone()
            conn.commit()
        return self._row_to_proposal(row)

    def expire_pending(self, proposal_id: str, user_id: str) -> ToolProposal | None:
        with self._connect(row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"""
                    UPDATE {self._quoted_schema}.tool_proposals
                    SET status = 'expired'
                    WHERE id = %s::uuid
                      AND user_id = %s
                      AND status = 'pending'
                      AND expires_at <= now()
                    RETURNING *
                    """,
                    (proposal_id, user_id),
                )
                row = cur.fetchone()
            conn.commit()
        if not row:
            return None
        return self._row_to_proposal(row)

    def arguments_hash_matches(self, proposal: ToolProposal) -> bool:
        return hmac_compare(_hash_arguments(proposal.arguments), proposal.arguments_hash)

    def clear_terminal_arguments(self) -> int:
        cutoff = datetime.now(UTC) - timedelta(hours=settings.agent_argument_retention_hours)
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"""
                    UPDATE {self._quoted_schema}.tool_proposals
                    SET arguments = '{{}}'::jsonb
                    WHERE status IN ('executed', 'rejected', 'expired', 'failed', 'execution_unknown')
                      AND executed_at IS NOT NULL
                      AND executed_at < %s
                      AND arguments <> '{{}}'::jsonb
                    """,
                    (cutoff,),
                )
                count = cur.rowcount
            conn.commit()
        return count or 0

    def cleanup_retention(self) -> dict[str, int]:
        proposal_cutoff = datetime.now(UTC) - timedelta(days=settings.agent_proposal_retention_days)
        audit_cutoff = datetime.now(UTC) - timedelta(days=settings.agent_audit_retention_days)
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"DELETE FROM {self._quoted_schema}.tool_proposals WHERE created_at < %s",
                    (proposal_cutoff,),
                )
                proposals_deleted = cur.rowcount or 0
                cur.execute(
                    f"DELETE FROM {self._quoted_schema}.audit_events WHERE created_at < %s",
                    (audit_cutoff,),
                )
                audits_deleted = cur.rowcount or 0
            conn.commit()
        return {"proposals_deleted": proposals_deleted, "audit_events_deleted": audits_deleted}

    def log_event(self, event: AuditEvent) -> None:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"""
                    INSERT INTO {self._quoted_schema}.audit_events (
                        id, event_type, request_id, user_id, role, tool_name,
                        operation_type, proposal_id, status, latency_ms, error_code, metadata
                    )
                    VALUES (
                        %s::uuid, %s, %s, %s, %s, %s,
                        %s, %s::uuid, %s, %s, %s, %s::jsonb
                    )
                    """,
                    (
                        str(uuid.uuid4()),
                        event.event_type,
                        event.request_id,
                        event.user_id,
                        event.role,
                        event.tool_name,
                        event.operation_type,
                        event.proposal_id,
                        event.status,
                        event.latency_ms,
                        event.error_code,
                        json.dumps(fit_public_payload(event.metadata), ensure_ascii=False)
                        if event.metadata is not None
                        else None,
                    ),
                )
            conn.commit()

    def _connect(self, **kwargs: Any):
        if not self.database_url:
            raise ValueError("DATABASE_URL is required for proposal store")
        return psycopg.connect(self.database_url, **kwargs)

    @property
    def _quoted_schema(self) -> str:
        if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", self.schema):
            raise ValueError("AGENT_DB_SCHEMA must be alphanumeric/underscore only")
        return f'"{self.schema}"'

    @staticmethod
    def _row_to_proposal(row: dict[str, Any]) -> ToolProposal:
        return ToolProposal(
            id=str(row["id"]),
            user_id=row["user_id"],
            role=row["role"],
            session_id=row["session_id"],
            tool_name=row["tool_name"],
            operation_type=row["operation_type"],
            risk_level=row.get("risk_level", "low"),
            arguments=row["arguments"] or {},
            arguments_hash=row["arguments_hash"],
            confirmation_message=row["confirmation_message"],
            summary=row["summary"],
            status=row["status"],
            result=row["result"],
            error=row["error"],
            request_id=row["request_id"],
            created_at=row["created_at"],
            expires_at=row["expires_at"],
            confirmed_at=row["confirmed_at"],
            executed_at=row["executed_at"],
        )


def classify_action_result(result: ToolResult) -> ProposalStatus:
    if result.ok:
        return "executed"
    if result.error and result.error.code in {"timeout", "rate_limited", "upstream_error"}:
        return "execution_unknown"
    return "failed"


def tool_error_payload(error: ToolError | None) -> dict[str, Any] | None:
    return error.model_dump(exclude_none=True) if error else None


def tool_result_payload(result: ToolResult | None, public_result: dict[str, Any] | None = None) -> dict[str, Any] | None:
    if public_result is not None:
        return public_result
    return result.model_dump(exclude_none=True) if result else None


def hmac_compare(left: str, right: str) -> bool:
    return hmac.compare_digest(left, right)


def _hash_arguments(arguments: dict[str, Any]) -> str:
    raw = json.dumps(arguments, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()
