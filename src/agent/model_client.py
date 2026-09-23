from __future__ import annotations

import json
import time
from dataclasses import dataclass
from typing import Any, Protocol
from uuid import uuid4

import httpx

from src.core.config import Settings

GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions"


@dataclass(frozen=True, slots=True)
class AgentToolCall:
    id: str
    name: str
    arguments: dict[str, Any]


@dataclass(frozen=True, slots=True)
class AgentModelResponse:
    text: str
    tool_calls: tuple[AgentToolCall, ...]
    assistant_message: dict[str, Any]


class AgentModelUpstreamError(RuntimeError):
    """A sanitized model-provider failure safe to map to the public API."""

    def __init__(self, status_code: int, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code


class AgentModelClient(Protocol):
    def generate(
        self,
        *,
        model: str,
        system_prompt: str,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]],
    ) -> AgentModelResponse:
        ...


class GroqAgentModelClient:
    """OpenAI-compatible local tool-calling client backed by Groq."""

    def __init__(
        self,
        *,
        api_key: str,
        timeout_seconds: float,
        transport: httpx.BaseTransport | None = None,
    ) -> None:
        self.api_key = api_key
        self.timeout_seconds = timeout_seconds
        self.transport = transport

    def generate(
        self,
        *,
        model: str,
        system_prompt: str,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]],
    ) -> AgentModelResponse:
        if not self.api_key:
            raise AgentModelUpstreamError(503, "GROQ_KEY is not configured")

        payload: dict[str, Any] = {
            "model": model,
            "messages": [{"role": "system", "content": system_prompt}, *messages],
            "temperature": 0.2,
            "max_completion_tokens": 600,
        }
        if model.startswith(("openai/gpt-oss-", "qwen/")):
            payload["reasoning_effort"] = "low"
        if tools:
            payload.update(
                {
                    "tools": [
                        {
                            "type": "function",
                            "function": {
                                "name": definition["name"],
                                "description": definition["description"],
                                "parameters": definition["parameters"],
                            },
                        }
                        for definition in tools
                    ],
                    "tool_choice": "auto",
                    # The Agent deliberately executes at most one tool per step.
                    "parallel_tool_calls": False,
                }
            )

        try:
            deadline = time.monotonic() + self.timeout_seconds
            with httpx.Client(timeout=self.timeout_seconds, transport=self.transport) as client:
                for attempt in range(2):
                    remaining = deadline - time.monotonic()
                    if remaining <= 0:
                        raise httpx.ReadTimeout("Groq request timed out")
                    response = client.post(
                        GROQ_CHAT_COMPLETIONS_URL,
                        headers={
                            "Authorization": f"Bearer {self.api_key}",
                            "Content-Type": "application/json",
                        },
                        json=payload,
                        timeout=remaining,
                    )
                    retry_after = _retry_after_seconds(response)
                    if response.status_code == 429 and attempt == 0 and retry_after is not None:
                        if retry_after < deadline - time.monotonic():
                            time.sleep(retry_after)
                            continue
                    response.raise_for_status()
                    body = response.json()
                    break
        except httpx.TimeoutException as exc:
            raise AgentModelUpstreamError(504, "Groq request timed out") from exc
        except httpx.HTTPStatusError as exc:
            status_code = exc.response.status_code
            public_status = status_code if status_code in {408, 429, 500, 502, 503, 504} else 502
            raise AgentModelUpstreamError(public_status, "Groq request failed") from exc
        except (httpx.HTTPError, ValueError) as exc:
            raise AgentModelUpstreamError(502, "Groq response was unavailable") from exc

        try:
            raw_message = body["choices"][0]["message"]
        except (KeyError, IndexError, TypeError) as exc:
            raise AgentModelUpstreamError(502, "Groq returned an invalid response") from exc

        if not isinstance(raw_message, dict):
            raise AgentModelUpstreamError(502, "Groq returned an invalid message")

        content = raw_message.get("content")
        text = content.strip() if isinstance(content, str) else ""
        parsed_calls: list[AgentToolCall] = []
        normalized_calls: list[dict[str, Any]] = []
        for raw_call in raw_message.get("tool_calls") or []:
            if not isinstance(raw_call, dict):
                raise AgentModelUpstreamError(502, "Groq returned a malformed tool call")
            function = raw_call.get("function") or {}
            name = function.get("name")
            if not isinstance(name, str) or not name:
                raise AgentModelUpstreamError(502, "Groq returned a malformed tool call")
            raw_arguments = function.get("arguments") or "{}"
            try:
                arguments = json.loads(raw_arguments) if isinstance(raw_arguments, str) else raw_arguments
            except json.JSONDecodeError as exc:
                raise AgentModelUpstreamError(502, "Groq returned malformed tool arguments") from exc
            if not isinstance(arguments, dict):
                raise AgentModelUpstreamError(502, "Groq returned non-object tool arguments")
            call_id = str(raw_call.get("id") or f"call_{uuid4().hex}")
            parsed_calls.append(AgentToolCall(id=call_id, name=name, arguments=arguments))
            normalized_calls.append(
                {
                    "id": call_id,
                    "type": "function",
                    "function": {
                        "name": name,
                        "arguments": json.dumps(arguments, ensure_ascii=False, separators=(",", ":")),
                    },
                }
            )

        assistant_message: dict[str, Any] = {"role": "assistant", "content": text or None}
        if normalized_calls:
            assistant_message["tool_calls"] = normalized_calls
        return AgentModelResponse(
            text=text,
            tool_calls=tuple(parsed_calls),
            assistant_message=assistant_message,
        )


def _retry_after_seconds(response: httpx.Response) -> float | None:
    value = response.headers.get("retry-after")
    if value is None:
        return None
    try:
        return max(0.0, float(value))
    except ValueError:
        return None


def agent_orchestration_contract(config: Settings) -> tuple[str, str]:
    provider = (config.agent_orchestration_provider or config.llm_provider).strip().lower()
    model = (config.agent_orchestration_model or config.llm_model).strip()
    return provider, model


def create_agent_model_client(config: Settings) -> AgentModelClient:
    provider, _ = agent_orchestration_contract(config)
    if provider == "groq":
        return GroqAgentModelClient(
            api_key=config.groq_key or "",
            timeout_seconds=config.agent_llm_timeout_seconds,
        )
    raise AgentModelUpstreamError(
        503,
        f"Unsupported AGENT_ORCHESTRATION_PROVIDER: {provider}. "
        "The Agent currently requires the Groq/OpenAI-compatible adapter.",
    )
