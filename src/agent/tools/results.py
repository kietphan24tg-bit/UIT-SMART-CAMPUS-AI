from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict


class ToolError(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: Literal[
        "validation_error",
        "unauthorized",
        "forbidden",
        "not_found",
        "conflict",
        "rate_limited",
        "timeout",
        "upstream_error",
    ]
    message: str
    retryable: bool = False


class ToolResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ok: bool
    tool: str
    status: Literal["success", "failed"]
    data: dict | list | str | None = None
    error: ToolError | None = None
