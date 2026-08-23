from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from src.agent.proposals import ProposalStore
from src.api.routes.agent import router as agent_router
from src.api.routes.health import router as health_router
from src.api.routes.ingest import router as ingest_router
from src.api.routes.rag import router as rag_router
from src.core.config import settings
from src.core.limits import guardrail_store


@asynccontextmanager
async def lifespan(_: FastAPI):
    if settings.database_url:
        ProposalStore().ensure_schema()
    if settings.agent_actions_enabled:
        if not settings.database_url:
            raise RuntimeError("DATABASE_URL is required when AGENT_ACTIONS_ENABLED=true.")
        if settings.redis_url and not guardrail_store.ping():
            raise RuntimeError("REDIS_URL is required and must be reachable when AGENT_ACTIONS_ENABLED=true.")
    yield


def create_app() -> FastAPI:
    production = settings.app_env.lower() == "production"
    app = FastAPI(
        title="UIT Smart Campus AI Service",
        version="0.1.0",
        root_path=settings.ai_root_path,
        docs_url=None if production else "/docs",
        openapi_url=None if production else "/openapi.json",
        lifespan=lifespan,
    )
    app.add_exception_handler(RequestValidationError, _handle_request_validation_error)
    app.add_exception_handler(HTTPException, _handle_http_exception)
    app.include_router(health_router)
    app.include_router(rag_router, prefix="/rag", tags=["rag"])
    app.include_router(ingest_router, prefix="/ingest", tags=["ingest"])
    app.include_router(agent_router, prefix="/agent", tags=["agent"])
    return app


def _handle_request_validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
    message = exc.errors()[0]["msg"] if exc.errors() else "Invalid request."
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": str(message)},
    )


def _handle_http_exception(_: Request, exc: HTTPException) -> JSONResponse:
    detail = exc.detail if isinstance(exc.detail, str) else "Request failed."
    return JSONResponse(status_code=exc.status_code, content={"detail": detail})


app = create_app()
