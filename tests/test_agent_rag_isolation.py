from types import SimpleNamespace

from src.agent.tools.rag import SearchUniversityPoliciesTool
from src.core.config import Settings
from src.rag.service import RagService


def test_rag_service_can_select_a_schema_without_mutating_research_config():
    config = Settings(rag_db_schema="rag_training_exam_bge", agent_rag_db_schema="rag_local")

    service = RagService(
        config=config,
        schema_name=config.agent_rag_db_schema,
        retriever=SimpleNamespace(),
        reranker=SimpleNamespace(),
        llm_client=SimpleNamespace(),
    )

    assert service.config.rag_db_schema == "rag_local"
    assert config.rag_db_schema == "rag_training_exam_bge"


def test_agent_policy_tool_uses_application_schema_by_default(monkeypatch):
    captured = {}

    class FakeRag:
        def __init__(self, **kwargs):
            captured.update(kwargs)

    monkeypatch.setattr("src.agent.tools.rag.RagService", FakeRag)
    monkeypatch.setattr("src.agent.tools.rag.settings.agent_rag_db_schema", "rag_local")
    monkeypatch.setattr("src.agent.tools.rag.settings.agent_embedding_provider", "gemini")
    monkeypatch.setattr("src.agent.tools.rag.settings.agent_embedding_model", "gemini-embedding-001")
    monkeypatch.setattr("src.agent.tools.rag.settings.agent_embedding_dimensions", 768)

    tool = SearchUniversityPoliciesTool()
    assert captured["config"].rag_db_schema == "rag_local"
    assert captured["config"].embedding_provider == "gemini"
    assert captured["config"].embedding_model == "gemini-embedding-001"
    assert captured["config"].embedding_dimensions == 768
    assert tool.rag_service is not None
