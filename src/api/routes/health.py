from __future__ import annotations

from fastapi import APIRouter

from src.agent.proposals import ProposalStore
from src.core.auth import ServiceRequest
from src.core.config import settings
from src.core.limits import guardrail_store
from src.rag.service import application_rag_config
from src.vectorstores.pgvector import PgVectorStore

router = APIRouter()


@router.get("/health/live")
def live() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/health", dependencies=[ServiceRequest])
def readiness() -> dict:
    database_ok = False
    agent_database_ok = False
    redis_ok = False
    agent_rag = application_rag_config(settings)

    if settings.database_url:
        try:
            PgVectorStore(settings.database_url, settings.rag_db_schema, settings.embedding_dimensions).ensure_schema()
            ProposalStore().ensure_schema()
            database_ok = True
        except Exception:
            database_ok = False

        try:
            PgVectorStore(
                settings.database_url,
                agent_rag.rag_db_schema,
                agent_rag.embedding_dimensions,
                embedding_provider=agent_rag.embedding_provider,
                embedding_model=agent_rag.embedding_model,
            ).validate_embedding_space()
            agent_database_ok = True
        except Exception:
            agent_database_ok = False

    redis_ok = guardrail_store.ping() if settings.redis_url else False

    return {
        "status": "ok" if database_ok or not settings.database_url else "degraded",
        "database": database_ok,
        "agent_database": agent_database_ok,
        "redis": redis_ok,
        "agent_rag": {
            "schema": agent_rag.rag_db_schema,
            "embedding_provider": agent_rag.embedding_provider,
            "embedding_model": agent_rag.embedding_model,
            "embedding_dimensions": agent_rag.embedding_dimensions,
            "reranker_enabled": agent_rag.reranker_enabled,
        },
        "actions_ready": bool(
            not settings.agent_actions_enabled
            or (database_ok and (redis_ok or not settings.redis_url))
        ),
    }
