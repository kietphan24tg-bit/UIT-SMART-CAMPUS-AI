from fastapi import FastAPI

from src.api.routes.health import router as health_router
from src.api.routes.ingest import router as ingest_router
from src.api.routes.rag import router as rag_router


def create_app() -> FastAPI:
    app = FastAPI(title="UIT Smart Campus AI Service", version="0.1.0")
    app.include_router(health_router)
    app.include_router(rag_router, prefix="/rag", tags=["rag"])
    app.include_router(ingest_router, prefix="/ingest", tags=["ingest"])
    return app


app = create_app()

