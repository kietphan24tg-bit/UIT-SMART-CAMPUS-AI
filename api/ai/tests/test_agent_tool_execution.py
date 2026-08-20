from __future__ import annotations

import httpx

from src.agent.tools import ToolContext, build_tool_registry
from src.agent.tools.nest_client import NestApiClient


class FakeRagResponse:
    def model_dump(self, exclude_none: bool = True) -> dict:
        del exclude_none
        return {"answer": "policy answer", "citations": [], "confidence": 0.88}


class FakeRagService:
    def answer(self, question: str, top_k: int | None = None, include_context: bool = False):
        del question, top_k, include_context
        return FakeRagResponse()


def test_read_tool_executes_expected_http_contract():
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["method"] = request.method
        captured["path"] = request.url.path
        captured["query"] = dict(request.url.params)
        return httpx.Response(200, json={"data": {"items": []}})

    registry = build_tool_registry(
        nest_client=NestApiClient(base_url="http://nest.test", api_prefix="/api/v1", transport=httpx.MockTransport(handler)),
        rag_service=FakeRagService(),
    )
    context = ToolContext(user_id="u1", role="student", access_token="token", request_id="req-1")

    result = registry.get("get_available_class_sections").execute(
        context,
        {"semester_id": "sem-1", "query": "AI", "page": 1, "limit": 20},
    )

    assert result.ok is True
    assert captured["method"] == "GET"
    assert captured["path"] == "/api/v1/registrations/available-class-sections"
    assert captured["query"] == {
        "semesterId": "sem-1",
        "query": "AI",
        "page": "1",
        "limit": "20",
    }


def test_action_tool_requires_allowed_role_and_posts_body():
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["method"] = request.method
        captured["path"] = request.url.path
        captured["body"] = request.content.decode()
        return httpx.Response(200, json={"data": {"id": "order-1"}})

    registry = build_tool_registry(
        nest_client=NestApiClient(base_url="http://nest.test", api_prefix="/api/v1", transport=httpx.MockTransport(handler)),
        rag_service=FakeRagService(),
    )
    student_context = ToolContext(user_id="u1", role="student", access_token="token", request_id="req-1")
    lecturer_context = ToolContext(user_id="u2", role="lecturer", access_token="token", request_id="req-2")

    forbidden = registry.get("create_canteen_product").execute(
        student_context,
        {"payload": {"name": "Tea"}},
    )
    assert forbidden.ok is False
    assert forbidden.error is not None
    assert forbidden.error.code == "forbidden"

    allowed = registry.get("create_canteen_product").execute(
        ToolContext(user_id="u3", role="canteen_admin", access_token="token", request_id="req-3"),
        {"payload": {"name": "Tea"}},
    )
    assert allowed.ok is True
    assert captured["method"] == "POST"
    assert captured["path"] == "/api/v1/canteen/products"
    assert '"name":"Tea"' in captured["body"]

    rag_result = registry.get("search_university_policies").execute(
        lecturer_context,
        {"query": "dieu kien du thi"},
    )
    assert rag_result.ok is True
    assert rag_result.data["answer"] == "policy answer"
