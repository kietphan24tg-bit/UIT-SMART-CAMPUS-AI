from fastapi import APIRouter, HTTPException

from src.api.schemas import RagQueryRequest, RagQueryResponse
from src.rag.service import RagService

router = APIRouter()


@router.post("/query", response_model=RagQueryResponse)
def query_rag(payload: RagQueryRequest) -> RagQueryResponse:
    try:
        return RagService().answer(
            question=payload.question,
            filters=payload.filters,
            top_k=payload.top_k,
            min_score=payload.min_score,
            include_context=payload.include_context,
        )
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=_safe_provider_error(exc)) from exc


def _safe_provider_error(exc: RuntimeError) -> str:
    message = str(exc)
    if "PERMISSION_DENIED" in message or "403" in message:
        return "Embedding provider denied access. Check GEMINI_KEY/project permissions."
    if "RESOURCE_EXHAUSTED" in message or "429" in message:
        return "Embedding provider quota or rate limit was reached. Retry later."
    return "RAG provider request failed."
