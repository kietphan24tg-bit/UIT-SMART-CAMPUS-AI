import pytest
from fastapi import HTTPException

from src.core.limits import GuardrailStore, RateLimitPolicy


def test_rate_limit_includes_retry_after_header(monkeypatch):
    monkeypatch.setattr("src.core.limits.settings.redis_url", None)
    store = GuardrailStore()
    policy = RateLimitPolicy(limit=1, window_seconds=60)

    store.enforce_rate_limit("rate:test-user", policy)
    with pytest.raises(HTTPException) as captured:
        store.enforce_rate_limit("rate:test-user", policy)

    assert captured.value.status_code == 429
    assert captured.value.detail == "Too many requests. Retry later."
    assert captured.value.headers == {"Retry-After": "60"}


def test_concurrency_limit_includes_retry_after_header(monkeypatch):
    monkeypatch.setattr("src.core.limits.settings.redis_url", None)
    monkeypatch.setattr("src.core.limits.settings.agent_total_timeout_seconds", 30.0)
    store = GuardrailStore()

    with store.concurrency_slot("concurrency:test-user", limit=1):
        with pytest.raises(HTTPException) as captured:
            with store.concurrency_slot("concurrency:test-user", limit=1):
                raise AssertionError("concurrency guard should reject before entering")

    assert captured.value.status_code == 429
    assert captured.value.detail == "Too many concurrent requests for this user."
    assert captured.value.headers == {"Retry-After": "30"}
