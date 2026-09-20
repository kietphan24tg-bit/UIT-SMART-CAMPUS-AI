from __future__ import annotations

import os
from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4

import psycopg
import pytest
from psycopg import sql

from src.agent.proposals import ProposalStore
from src.agent.tools import ToolOperation
from src.core.config import settings


pytestmark = pytest.mark.skipif(
    os.environ.get("RUN_REAL_POSTGRES_TESTS") != "1",
    reason="Set RUN_REAL_POSTGRES_TESTS=1 to run isolated real-PostgreSQL integration tests.",
)


def _create_proposal(store: ProposalStore, *, suffix: str = "default"):
    return store.create(
        user_id="agent-action-test-user",
        role="student",
        session_id=f"agent-action-test-session-{suffix}",
        tool_name="cancel_room_booking",
        operation_type=ToolOperation.DELETE,
        risk_level="medium",
        arguments={"id": f"agent-action-test-booking-{suffix}"},
        confirmation_message="Confirm isolated test action",
        summary="Isolated action-safety integration test",
        request_id=f"agent-action-test-request-{suffix}",
        ttl_seconds=300,
    )


def test_real_postgres_proposal_lifecycle_and_atomic_concurrent_claim():
    database_url = settings.database_url
    if not database_url:
        pytest.skip("DATABASE_URL is not configured")

    schema = f"agent_action_test_{uuid4().hex[:12]}"
    assert schema.startswith("agent_action_test_")
    store = ProposalStore(database_url=database_url, schema=schema)

    try:
        store.ensure_schema()

        rejected_proposal = _create_proposal(store, suffix="reject")
        rejected = store.mark_rejected(rejected_proposal.id, rejected_proposal.user_id)
        assert rejected is not None
        assert rejected.status == "rejected"
        assert store.claim_pending_for_execution(rejected.id, rejected.user_id, rejected.role) is None

        wrong_user_proposal = _create_proposal(store, suffix="wrong-user")
        assert store.claim_pending_for_execution(wrong_user_proposal.id, "different-user", wrong_user_proposal.role) is None
        assert store.get_for_user(wrong_user_proposal.id, wrong_user_proposal.user_id).status == "pending"

        confirmed_proposal = _create_proposal(store, suffix="confirm")
        claimed = store.claim_pending_for_execution(
            confirmed_proposal.id,
            confirmed_proposal.user_id,
            confirmed_proposal.role,
        )
        assert claimed is not None
        assert claimed.status == "executing"
        executed = store.mark_result(claimed.id, status="executed", result={"ok": True})
        assert executed.status == "executed"
        assert store.claim_pending_for_execution(executed.id, executed.user_id, executed.role) is None

        concurrent_proposal = _create_proposal(store, suffix="concurrent")

        def claim_once():
            independent_store = ProposalStore(database_url=database_url, schema=schema)
            return independent_store.claim_pending_for_execution(
                concurrent_proposal.id,
                concurrent_proposal.user_id,
                concurrent_proposal.role,
            )

        with ThreadPoolExecutor(max_workers=2) as pool:
            claims = list(pool.map(lambda _: claim_once(), range(2)))

        winners = [claim for claim in claims if claim is not None]
        assert len(winners) == 1
        assert winners[0].status == "executing"
        assert store.claim_pending_for_execution(
            concurrent_proposal.id,
            concurrent_proposal.user_id,
            concurrent_proposal.role,
        ) is None
    finally:
        assert schema.startswith("agent_action_test_")
        with psycopg.connect(database_url) as connection:
            with connection.cursor() as cursor:
                cursor.execute(sql.SQL("DROP SCHEMA IF EXISTS {} CASCADE").format(sql.Identifier(schema)))
                cursor.execute("SELECT to_regnamespace(%s)", (schema,))
                assert cursor.fetchone()[0] is None
            connection.commit()
