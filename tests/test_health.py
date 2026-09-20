from src.api.routes import health


class _HealthyVectorStore:
    def __init__(self, *args, **kwargs) -> None:
        del args, kwargs

    def validate_embedding_space(self) -> None:
        return None

    def ensure_schema(self) -> None:
        return None


class _HealthyProposalStore:
    def ensure_schema(self) -> None:
        return None


def test_actions_readiness_requires_explicit_tool_allowlist(monkeypatch):
    monkeypatch.setattr(health, "PgVectorStore", _HealthyVectorStore)
    monkeypatch.setattr(health, "ProposalStore", _HealthyProposalStore)
    monkeypatch.setattr(health.settings, "database_url", "postgresql://test")
    monkeypatch.setattr(health.settings, "redis_url", "")
    monkeypatch.setattr(health.settings, "agent_actions_enabled", True)
    monkeypatch.setattr(health.settings, "agent_enabled_action_tools", "")

    result = health.readiness()

    assert result["database"] is True
    assert result["actions_ready"] is False


def test_actions_readiness_accepts_explicit_tool_allowlist(monkeypatch):
    monkeypatch.setattr(health, "PgVectorStore", _HealthyVectorStore)
    monkeypatch.setattr(health, "ProposalStore", _HealthyProposalStore)
    monkeypatch.setattr(health.settings, "database_url", "postgresql://test")
    monkeypatch.setattr(health.settings, "redis_url", "")
    monkeypatch.setattr(health.settings, "agent_actions_enabled", True)
    monkeypatch.setattr(
        health.settings,
        "agent_enabled_action_tools",
        "cancel_room_booking",
    )

    result = health.readiness()

    assert result["database"] is True
    assert result["actions_ready"] is True
