from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

import httpx

from src.core.config import settings

from .context import ToolContext
from .results import ToolError

logger = logging.getLogger(__name__)


class NestApiClientError(RuntimeError):
    def __init__(self, error: ToolError):
        super().__init__(error.message)
        self.error = error


@dataclass(frozen=True)
class NestApiClient:
    base_url: str = settings.nestjs_base_url
    api_prefix: str = settings.nestjs_api_prefix
    timeout_seconds: float = 10.0
    transport: httpx.BaseTransport | None = None

    def request(
        self,
        *,
        context: ToolContext,
        method: str,
        path: str,
        params: dict[str, Any] | None = None,
        json: dict[str, Any] | list[Any] | None = None,
        data: dict[str, Any] | None = None,
        extra_headers: dict[str, str] | None = None,
    ) -> Any:
        url = self._build_url(path)
        headers = {
            "Authorization": f"Bearer {context.access_token}",
            "X-Request-ID": context.request_id,
        }
        if extra_headers:
            headers.update(extra_headers)

        try:
            with httpx.Client(timeout=self.timeout_seconds, transport=self.transport) as client:
                response = client.request(
                    method=method.upper(),
                    url=url,
                    headers=headers,
                    params=params,
                    json=json,
                    data=data,
                )
                response.raise_for_status()
        except httpx.TimeoutException as exc:
            logger.warning("Nest request timeout for %s %s", method.upper(), path)
            raise NestApiClientError(
                ToolError(code="timeout", message="NestJS request timed out.", retryable=True)
            ) from exc
        except httpx.HTTPStatusError as exc:
            status_code = exc.response.status_code
            logger.warning("Nest request failed with status %s for %s %s", status_code, method.upper(), path)
            raise NestApiClientError(self._map_http_error(status_code, exc.response)) from exc
        except httpx.HTTPError as exc:
            logger.error("Nest request transport error for %s %s: %s", method.upper(), path, exc)
            raise NestApiClientError(
                ToolError(
                    code="upstream_error",
                    message="Could not reach NestJS.",
                    retryable=True,
                )
            ) from exc

        payload = response.json()
        if isinstance(payload, dict) and "data" in payload:
            return payload["data"]
        return payload

    def _build_url(self, path: str) -> str:
        normalized_prefix = "/" + self.api_prefix.strip("/")
        normalized_path = "/" + path.strip("/")
        return f"{self.base_url.rstrip('/')}{normalized_prefix}{normalized_path}"

    @staticmethod
    def _map_http_error(status_code: int, response: httpx.Response) -> ToolError:
        detail = NestApiClient._extract_error_message(response)
        if status_code == 401:
            return ToolError(code="unauthorized", message=detail or "Unauthorized request to NestJS.")
        if status_code == 403:
            return ToolError(code="forbidden", message=detail or "Forbidden request to NestJS.")
        if status_code == 404:
            return ToolError(code="not_found", message=detail or "Requested resource was not found.")
        if status_code == 409:
            return ToolError(code="conflict", message=detail or "Request conflicts with current state.")
        if status_code == 422:
            return ToolError(code="validation_error", message=detail or "NestJS rejected the request body.")
        if status_code == 429:
            return ToolError(code="rate_limited", message=detail or "NestJS rate limit exceeded.", retryable=True)
        if status_code >= 500:
            return ToolError(
                code="upstream_error",
                message=detail or "NestJS failed while processing the request.",
                retryable=True,
            )
        return ToolError(code="upstream_error", message=detail or f"Unexpected NestJS status {status_code}.")

    @staticmethod
    def _extract_error_message(response: httpx.Response) -> str | None:
        try:
            payload = response.json()
        except ValueError:
            return None

        if isinstance(payload, dict):
            detail = payload.get("message") or payload.get("detail") or payload.get("error")
            if isinstance(detail, list):
                return "; ".join(str(item) for item in detail)
            if detail is not None:
                return str(detail)
        return None
