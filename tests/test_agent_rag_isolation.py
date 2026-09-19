from types import SimpleNamespace

from src.agent.tools.rag import SearchUniversityPoliciesTool
from src.core.config import Settings
from src.rag.service import RagService, application_rag_config


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
    monkeypatch.setattr("src.agent.tools.rag.settings.agent_reranker_enabled", False)

    tool = SearchUniversityPoliciesTool()
    assert captured["config"].rag_db_schema == "rag_local"
    assert captured["config"].embedding_provider == "gemini"
    assert captured["config"].embedding_model == "gemini-embedding-001"
    assert captured["config"].embedding_dimensions == 768
    assert captured["config"].reranker_enabled is False
    assert tool.rag_service is not None


def test_application_rag_config_keeps_research_settings_isolated():
    config = Settings(
        rag_db_schema="rag_training_exam_bge",
        embedding_provider="local",
        embedding_model="BAAI/bge-m3",
        embedding_dimensions=1024,
        reranker_enabled=True,
        agent_rag_db_schema="rag_local",
        agent_embedding_provider="gemini",
        agent_embedding_model="gemini-embedding-001",
        agent_embedding_dimensions=768,
        agent_reranker_enabled=True,
    )

    application = application_rag_config(config)

    assert application.rag_db_schema == "rag_local"
    assert application.embedding_provider == "gemini"
    assert application.embedding_model == "gemini-embedding-001"
    assert application.embedding_dimensions == 768
    assert application.llm_provider == "gemini"
    assert application.llm_model == config.agent_model
    assert application.reranker_enabled is False
    assert config.rag_db_schema == "rag_training_exam_bge"
    assert config.reranker_enabled is True
