from __future__ import annotations

import json
from typing import Any

from src.core.config import settings

DEFAULT_SENSITIVE_KEYS = {
    "access_token",
    "authorization",
    "cookie",
    "id_token",
    "password",
    "refresh_token",
    "secret",
    "token",
}


def json_size_bytes(value: Any) -> int:
    encoded = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return len(encoded.encode("utf-8"))


def limit_text(value: str, max_chars: int | None = None) -> str:
    cap = max_chars or settings.agent_max_answer_chars
    if len(value) <= cap:
        return value
    return value[: max(cap - 3, 0)].rstrip() + "..."


def sanitize_value(
    value: Any,
    *,
    sensitive_keys: set[str] | frozenset[str] | None = None,
    max_list_items: int | None = None,
) -> Any:
    sensitive = {key.lower() for key in (sensitive_keys or set())} | DEFAULT_SENSITIVE_KEYS
    list_limit = max_list_items or settings.agent_max_list_items

    if isinstance(value, dict):
        sanitized: dict[str, Any] = {}
        for key, item in value.items():
            if str(key).lower() in sensitive:
                sanitized[str(key)] = "***"
            else:
                sanitized[str(key)] = sanitize_value(
                    item,
                    sensitive_keys=sensitive,
                    max_list_items=list_limit,
                )
        return sanitized

    if isinstance(value, list):
        return [
            sanitize_value(item, sensitive_keys=sensitive, max_list_items=list_limit)
            for item in value[:list_limit]
        ]

    if isinstance(value, tuple):
        return [
            sanitize_value(item, sensitive_keys=sensitive, max_list_items=list_limit)
            for item in value[:list_limit]
        ]

    if isinstance(value, str):
        return limit_text(value, settings.agent_max_tool_result_bytes)

    return value


def fit_public_payload(value: Any) -> Any:
    sanitized = sanitize_value(value)
    if json_size_bytes(sanitized) <= settings.agent_max_tool_result_bytes:
        return sanitized

    if isinstance(sanitized, dict):
        compact: dict[str, Any] = {}
        for key, item in sanitized.items():
            compact[key] = item
            if json_size_bytes(compact) > settings.agent_max_tool_result_bytes:
                compact.pop(key, None)
                compact["_truncated"] = True
                break
        return compact

    if isinstance(sanitized, list):
        compact_list: list[Any] = []
        for item in sanitized:
            compact_list.append(item)
            if json_size_bytes(compact_list) > settings.agent_max_tool_result_bytes:
                compact_list.pop()
                compact_list.append({"_truncated": True})
                break
        return compact_list

    if isinstance(sanitized, str):
        return limit_text(sanitized, settings.agent_max_tool_result_bytes // 2)

    return sanitized
