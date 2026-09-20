from __future__ import annotations

import httpx
import pytest

from src.agent.tools import ToolContext, build_tool_registry
from src.agent.tools.nest_client import NestApiClient


class FakeRagResponse:
    def to_response(self):
        return self

    def model_dump(self, exclude_none: bool = True) -> dict:
        del exclude_none
        return {
            "found": True,
            "citations": [{"index": 1, "source_file": "quy-che.md", "heading_path": "Dieu 5"}],
            "confidence": 0.88,
            "retrieved_count": 1,
            "contexts": [
                {
                    "index": 1,
                    "content": "Noi dung quy che.",
                    "citation": {"index": 1, "source_file": "quy-che.md", "heading_path": "Dieu 5"},
                    "metadata": {},
                }
            ],
        }


class FakeRagService:
    def retrieve_evidence(self, question: str, top_k: int | None = None):
        del question, top_k
        return FakeRagResponse()


@pytest.mark.parametrize(
    ("tool_name", "role", "arguments", "method", "path", "query", "body"),
    [
        (
            "get_available_class_sections",
            "student",
            {},
            "GET",
            "/api/v1/registrations/available-class-sections",
            {},
            b"",
        ),
        (
            "get_my_registrations",
            "student",
            {"status": "active"},
            "GET",
            "/api/v1/registrations/me",
            {"status": "active"},
            b"",
        ),
        (
            "get_attendance_qr_token",
            "lecturer",
            {"session_id": "session-1", "display_key": "display-1"},
            "GET",
            "/api/v1/attendance/session/session-1/qr-token",
            {"displayKey": "display-1"},
            b"",
        ),
        (
            "start_attendance_session",
            "lecturer",
            {"class_section_id": "section-1", "duration_minutes": 15},
            "POST",
            "/api/v1/attendance/session/start",
            {},
            b'{"classSectionId":"section-1","durationMinutes":15}',
        ),
        (
            "delete_notifications",
            "student",
            {"category": "academic", "unread_only": True},
            "DELETE",
            "/api/v1/notifications",
            {"category": "academic", "unreadOnly": "true"},
            b"",
        ),
        (
            "get_sos_route",
            "student",
            {"sos_id": "sos-1", "from_lat": 10.1, "from_lng": 106.2},
            "GET",
            "/api/v1/sos/sos-1/route",
            {"fromLat": "10.1", "fromLng": "106.2"},
            b"",
        ),
        (
            "search_study_materials",
            "student",
            {"query": "AI", "category": "exam", "page": 2, "limit": 10},
            "GET",
            "/api/v1/study-materials",
            {"q": "AI", "category": "exam", "page": "2", "limit": "10"},
            b"",
        ),
    ],
)
def test_tools_execute_expected_nest_contract(
    tool_name,
    role,
    arguments,
    method,
    path,
    query,
    body,
):
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["method"] = request.method
        captured["path"] = request.url.path
        captured["query"] = dict(request.url.params)
        captured["body"] = request.content
        return httpx.Response(200, json={"data": {"items": []}})

    registry = build_tool_registry(
        nest_client=NestApiClient(base_url="http://nest.test", api_prefix="/api/v1", transport=httpx.MockTransport(handler)),
        rag_service=FakeRagService(),
    )
    context = ToolContext(user_id="u1", role=role, access_token="token", request_id="req-1")

    result = registry.get(tool_name).execute(context, arguments)

    assert result.ok is True
    assert captured["method"] == method
    assert captured["path"] == path
    assert captured["query"] == query
    assert captured["body"] == body


def test_event_limit_matches_nest_dto_maximum():
    registry = build_tool_registry(
        nest_client=NestApiClient(
            base_url="http://nest.test",
            api_prefix="/api/v1",
            transport=httpx.MockTransport(lambda request: httpx.Response(200, json={"data": []})),
        ),
        rag_service=FakeRagService(),
    )
    context = ToolContext(user_id="u1", role="student", access_token="token", request_id="req-1")

    result = registry.get("list_upcoming_events").execute(context, {"limit": 51})

    assert result.ok is False
    assert result.error is not None
    assert result.error.code == "validation_error"


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
    assert rag_result.data["found"] is True
    assert rag_result.data["contexts"][0]["index"] == 1


def test_read_tool_preserves_role_unique_structured_payload_without_cross_user_data():
    role_payloads = {
        "student-token": {"userId": "student-fixture-001", "items": [{"courseCode": "SE101"}]},
        "lecturer-token": {"userId": "lecturer-fixture-001", "items": [{"courseCode": "SE202"}]},
        "admin-token": {"userId": "admin-fixture-001", "items": [{"courseCode": "SE303"}]},
    }

    def handler(request: httpx.Request) -> httpx.Response:
        token = request.headers["authorization"].removeprefix("Bearer ")
        return httpx.Response(200, json={"data": role_payloads[token]})

    registry = build_tool_registry(
        nest_client=NestApiClient(
            base_url="http://nest.test",
            api_prefix="/api/v1",
            transport=httpx.MockTransport(handler),
        ),
        rag_service=FakeRagService(),
    )

    results = {
        role: registry.get("get_current_schedule").execute(
            ToolContext(user_id=f"{role}-fixture-001", role=role, access_token=f"{role}-token", request_id=f"req-{role}"),
            {},
        )
        for role in ("student", "lecturer", "admin")
    }

    for role, result in results.items():
        assert result.ok is True
        assert result.data == role_payloads[f"{role}-token"]
        assert result.data["userId"] == f"{role}-fixture-001"
        other_roles = [other for other in results if other != role]
        assert all(results[other].data["userId"] != result.data["userId"] for other in other_roles)
