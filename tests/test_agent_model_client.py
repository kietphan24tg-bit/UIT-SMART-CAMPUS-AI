from __future__ import annotations

import json
from types import SimpleNamespace

import httpx
import pytest

from src.agent.model_client import (
    AgentModelUpstreamError,
    GroqAgentModelClient,
    agent_orchestration_contract,
    create_agent_model_client,
)


def test_groq_client_sends_openai_tools_and_parses_tool_call() -> None:
    captured: dict = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured.update(json.loads(request.content))
        return httpx.Response(
            200,
            json={
                "choices": [
                    {
                        "message": {
                            "role": "assistant",
                            "content": None,
                            "tool_calls": [
                                {
                                    "id": "call-123",
                                    "type": "function",
                                    "function": {
                                        "name": "get_current_schedule",
                                        "arguments": '{"week":2}',
                                    },
                                }
                            ],
                        }
                    }
                ]
            },
        )

    client = GroqAgentModelClient(
        api_key="test-key",
        timeout_seconds=5,
        transport=httpx.MockTransport(handler),
    )
    result = client.generate(
        model="openai/gpt-oss-20b",
        system_prompt="system",
        messages=[{"role": "user", "content": "Lich hoc tuan sau?"}],
        tools=[
            {
                "name": "get_current_schedule",
                "description": "Read the schedule.",
                "parameters": {
                    "type": "object",
                    "properties": {"week": {"type": "integer"}},
                },
            }
        ],
    )

    assert captured["model"] == "openai/gpt-oss-20b"
    assert captured["messages"][0] == {"role": "system", "content": "system"}
    assert captured["tools"][0]["type"] == "function"
    assert captured["tools"][0]["function"]["parameters"]["type"] == "object"
    assert captured["parallel_tool_calls"] is False
    assert captured["reasoning_effort"] == "low"
    assert captured["max_completion_tokens"] == 600
    assert result.tool_calls[0].id == "call-123"
    assert result.tool_calls[0].name == "get_current_schedule"
    assert result.tool_calls[0].arguments == {"week": 2}


def test_groq_client_can_require_a_tool_call() -> None:
    captured: dict = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured.update(json.loads(request.content))
        return httpx.Response(
            200,
            json={
                "choices": [
                    {
                        "message": {
                            "content": None,
                            "tool_calls": [
                                {
                                    "id": "call-required",
                                    "type": "function",
                                    "function": {
                                        "name": "mark_all_notifications_read",
                                        "arguments": "{}",
                                    },
                                }
                            ],
                        }
                    }
                ]
            },
        )

    client = GroqAgentModelClient(
        api_key="test-key",
        timeout_seconds=5,
        transport=httpx.MockTransport(handler),
    )
    client.generate(
        model="openai/gpt-oss-20b",
        system_prompt="system",
        messages=[{"role": "user", "content": "mark all notifications read"}],
        tools=[
            {
                "name": "mark_all_notifications_read",
                "description": "Mark all notifications as read.",
                "parameters": {"type": "object", "properties": {}},
            }
        ],
        require_tool_call=True,
    )

    assert captured["tool_choice"] == "required"


@pytest.mark.parametrize("provider_status", [429, 500, 502, 503, 504])
def test_groq_client_preserves_transient_provider_status(provider_status: int) -> None:
    client = GroqAgentModelClient(
        api_key="test-key",
        timeout_seconds=5,
        transport=httpx.MockTransport(
            lambda request: httpx.Response(provider_status, request=request, json={"error": "upstream"})
        ),
    )

    with pytest.raises(AgentModelUpstreamError) as caught:
        client.generate(model="model", system_prompt="system", messages=[], tools=[])

    assert caught.value.status_code == provider_status


def test_groq_client_retries_one_rate_limit_within_timeout_budget() -> None:
    call_count = 0

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return httpx.Response(429, request=request, headers={"Retry-After": "0"})
        return httpx.Response(200, request=request, json={"choices": [{"message": {"content": "ok"}}]})

    client = GroqAgentModelClient(
        api_key="test-key",
        timeout_seconds=5,
        transport=httpx.MockTransport(handler),
    )

    result = client.generate(model="openai/gpt-oss-20b", system_prompt="system", messages=[], tools=[])

    assert call_count == 2
    assert result.text == "ok"


def test_groq_client_maps_timeout_to_504() -> None:
    def timeout(request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("timed out", request=request)

    client = GroqAgentModelClient(
        api_key="test-key",
        timeout_seconds=0.01,
        transport=httpx.MockTransport(timeout),
    )

    with pytest.raises(AgentModelUpstreamError) as caught:
        client.generate(model="model", system_prompt="system", messages=[], tools=[])

    assert caught.value.status_code == 504


def test_agent_orchestration_defaults_to_application_llm_contract() -> None:
    config = SimpleNamespace(
        agent_orchestration_provider=None,
        agent_orchestration_model=None,
        llm_provider="groq",
        llm_model="openai/gpt-oss-20b",
    )

    assert agent_orchestration_contract(config) == ("groq", "openai/gpt-oss-20b")


def test_agent_orchestration_supports_explicit_override() -> None:
    config = SimpleNamespace(
        agent_orchestration_provider="groq",
        agent_orchestration_model="openai/gpt-oss-120b",
        llm_provider="ollama",
        llm_model="qwen3:1.7b",
    )

    assert agent_orchestration_contract(config) == ("groq", "openai/gpt-oss-120b")


def test_unsupported_orchestration_provider_fails_as_503() -> None:
    config = SimpleNamespace(
        agent_orchestration_provider=None,
        agent_orchestration_model=None,
        llm_provider="ollama",
        llm_model="qwen3:1.7b",
    )

    with pytest.raises(AgentModelUpstreamError) as caught:
        create_agent_model_client(config)

    assert caught.value.status_code == 503
