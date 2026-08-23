from fastapi.testclient import TestClient

from src.main import create_app


def test_create_app_disables_docs_in_production(monkeypatch):
    monkeypatch.setattr("src.main.settings.app_env", "production")
    app = create_app()

    assert app.docs_url is None
    assert app.openapi_url is None


def test_rag_query_requires_service_token(monkeypatch):
    monkeypatch.setattr("src.core.auth.settings.ai_service_token", "svc-token")
    app = create_app()
    client = TestClient(app)

    response = client.post("/rag/query", json={"question": "Hoc phi la gi?"})

    assert response.status_code == 401


def test_ingest_requires_admin_token(monkeypatch):
    monkeypatch.setattr("src.core.auth.settings.ai_admin_token", "admin-token")
    app = create_app()
    client = TestClient(app)

    response = client.get("/ingest/status")

    assert response.status_code == 401
