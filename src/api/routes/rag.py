from __future__ import annotations

import logging
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Request, Response, status

from src.api.schemas import RagQueryRequest, RagQueryResponse
from src.core.auth import ServiceRequest
from src.core.config import settings
from src.core.limits import RateLimitPolicy, guardrail_store
from src.rag.service import RagService, application_rag_config

router = APIRouter()
# Use Uvicorn's configured error handler so production diagnostics reach the
# container log stream even when application loggers are not configured.
logger = logging.getLogger("uvicorn.error")


@router.post("/query", response_model=RagQueryResponse, dependencies=[ServiceRequest])
def query_rag(payload: RagQueryRequest, request: Request, response: Response) -> RagQueryResponse:
    request_id = request.headers.get("x-request-id") or uuid4().hex
    response.headers["X-Request-ID"] = request_id
    rag_config = application_rag_config(settings)
    logger.info(
        "RAG request start request_id=%s provider=%s model=%s embedding_provider=%s embedding_model=%s reranker=%s",
        request_id,
        rag_config.llm_provider,
        rag_config.llm_model,
        rag_config.embedding_provider,
        rag_config.embedding_model,
        rag_config.reranker_enabled,
    )
    guardrail_store.enforce_rate_limit(
        "rag:query:service",
        RateLimitPolicy(
            limit=settings.agent_rag_rate_limit_per_minute,
            window_seconds=60,
            fail_closed=bool(settings.redis_url),
        ),
    )
    try:
        return RagService(config=rag_config).answer(
            question=payload.question,
            filters=payload.filters,
            top_k=payload.top_k,
            min_score=payload.min_score,
            include_context=payload.include_context,
        )
    except ValueError as exc:
        logger.exception("RAG configuration failure request_id=%s", request_id)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="RAG service is not configured.",
            headers={"X-Request-ID": request_id},
        ) from exc
    except RuntimeError as exc:
        logger.exception(
            "RAG provider failure request_id=%s exception_type=%s",
            request_id,
            type(exc).__name__,
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=_safe_provider_error(exc),
            headers={"X-Request-ID": request_id},
        ) from exc
    except Exception as exc:
        logger.exception(
            "Unhandled RAG request failure request_id=%s exception_type=%s",
            request_id,
            type(exc).__name__,
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="RAG backend is temporarily unavailable.",
            headers={"X-Request-ID": request_id},
        ) from exc


def _safe_provider_error(exc: RuntimeError) -> str:
    message = str(exc)
    if "PERMISSION_DENIED" in message or "403" in message:
        return "RAG provider denied access."
    if "RESOURCE_EXHAUSTED" in message or "429" in message:
        return "RAG provider rate limit was reached. Retry later."
    return "RAG provider request failed."
