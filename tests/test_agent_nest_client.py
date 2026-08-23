from __future__ import annotations

import httpx

from src.agent.tools import ToolContext
from src.agent.tools.nest_client import NestApiClient, NestApiClientError


def test_nest_client_forwards_auth_and_unwraps_data():
    seen = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["auth"] = request.headers.get("Authorization")
        seen["request_id"] = request.headers.get("X-Request-ID")
        seen["path"] = request.url.path
        seen["query"] = request.url.query.decode()
        return httpx.Response(200, json={"data": {"value": 123}})

    client = NestApiClient(
        base_url="http://nest.test",
        api_prefix="/api/v1",
        transport=httpx.MockTransport(handler),
    )
    context = ToolContext(user_id="u1", role="student", access_token="token-123", request_id="req-abc")

    result = client.request(
        context=context,
        method="GET",
        path="/grades/current",
        params={"semesterId": "hk1"},
    )

    assert result == {"value": 123}
    assert seen["auth"] == "Bearer token-123"
    assert seen["request_id"] == "req-abc"
    assert seen["path"] == "/api/v1/grades/current"
    assert seen["query"] == "semesterId=hk1"


def test_nest_client_maps_http_errors():
    mapping = {
        401: "unauthorized",
        403: "forbidden",
        404: "not_found",
        409: "conflict",
        422: "validation_error",
        429: "rate_limited",
        500: "upstream_error",
    }
    context = ToolContext(user_id="u1", role="student", access_token="token-123", request_id="req-abc")

    for status_code, error_code in mapping.items():
        client = NestApiClient(
            base_url="http://nest.test",
            api_prefix="/api/v1",
            transport=httpx.MockTransport(
                lambda request, status_code=status_code: httpx.Response(
                    status_code, json={"message": f"status-{status_code}"}
                )
            ),
        )

        try:
            client.request(context=context, method="GET", path="/users/me")
            assert False, "expected NestApiClientError"
        except NestApiClientError as exc:
            assert exc.error.code == error_code
            assert "token-123" not in exc.error.message


def test_nest_client_maps_timeout_without_leaking_token():
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("boom", request=request)

    client = NestApiClient(
        base_url="http://nest.test",
        api_prefix="/api/v1",
        transport=httpx.MockTransport(handler),
    )
    context = ToolContext(user_id="u1", role="student", access_token="token-123", request_id="req-abc")

    try:
        client.request(context=context, method="GET", path="/users/me")
        assert False, "expected NestApiClientError"
    except NestApiClientError as exc:
        assert exc.error.code == "timeout"
        assert "token-123" not in exc.error.message
