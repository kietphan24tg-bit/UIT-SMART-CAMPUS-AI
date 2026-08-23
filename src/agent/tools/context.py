from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class ToolContext(BaseModel):
    model_config = ConfigDict(extra="forbid")

    user_id: str
    role: str
    access_token: str
    request_id: str
    session_id: str | None = None
    idempotency_key: str | None = None
