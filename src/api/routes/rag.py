from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, status

from src.api.schemas import RagQueryRequest, RagQueryResponse
from src.core.auth import ServiceRequest
from src.core.config import settings
from src.core.limits import RateLimitPolicy, guardrail_store
from src.rag.service import RagService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/query", response_model=RagQueryResponse, dependencies=[ServiceRequest])
def query_rag(payload: RagQueryRequest) -> RagQueryResponse:
    guardrail_store.enforce_rate_limit(
        "rag:query:service",
        RateLimitPolicy(
            limit=settings.agent_rag_rate_limit_per_minute,
            window_seconds=60,
            fail_closed=bool(settings.redis_url),
        ),
    )
    try:
        return RagService().answer(
            question=payload.question,
            filters=payload.filters,
            top_k=payload.top_k,
            min_score=payload.min_score,
            include_context=payload.include_context,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="RAG service is not configured.") from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=_safe_provider_error(exc)) from exc
    except Exception as exc:
        logger.exception("Unhandled RAG request failure")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="RAG backend is temporarily unavailable.",
        ) from exc


def _safe_provider_error(exc: RuntimeError) -> str:
    message = str(exc)
    if "PERMISSION_DENIED" in message or "403" in message:
        return "RAG provider denied access."
    if "RESOURCE_EXHAUSTED" in message or "429" in message:
        return "RAG provider rate limit was reached. Retry later."
    return "RAG provider request failed."
