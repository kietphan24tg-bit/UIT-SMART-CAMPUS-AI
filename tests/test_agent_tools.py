from __future__ import annotations

import httpx

from src.agent.tools import ToolContext, ToolOperation, build_tool_catalog, build_tool_registry
from src.agent.tools.nest_client import NestApiClient


class FakeRagResponse:
    def to_response(self):
        return self

    def model_dump(self, exclude_none: bool = True) -> dict:
        del exclude_none
        return {
            "found": True,
            "citations": [
                {
                    "index": 1,
                    "source_file": "quy-che.md",
                    "heading_path": "Dieu 5",
                    "score": 0.9,
                }
            ],
            "confidence": 0.9,
            "retrieved_count": 1,
            "contexts": [
                {
                    "index": 1,
                    "content": "Dieu 5 noi dung.",
                    "citation": {"index": 1, "source_file": "quy-che.md", "heading_path": "Dieu 5"},
                    "metadata": {},
                }
            ],
        }


class FakeRagService:
    def retrieve_evidence(self, question: str, top_k: int | None = None):
        del question, top_k
        return FakeRagResponse()


class CapturingRagService(FakeRagService):
    def __init__(self) -> None:
        self.top_k: int | None = None

    def retrieve_evidence(self, question: str, top_k: int | None = None):
        del question
        self.top_k = top_k
        return FakeRagResponse()


def _catalog():
    return build_tool_catalog(nest_client=NestApiClient(transport=httpx.MockTransport(lambda request: httpx.Response(200, json={"data": {"ok": True}}))), rag_service=FakeRagService())


def _sample_value(schema: dict):
    if "enum" in schema:
        return schema["enum"][0]
    if "const" in schema:
        return schema["const"]
    for branch in schema.get("anyOf", []):
        if branch.get("type") != "null":
            return _sample_value(branch)

    value_type = schema.get("type")
    if value_type == "string":
        return "value"
    if value_type == "integer":
        return max(1, schema.get("minimum", 1))
    if value_type == "number":
        return 1.0
    if value_type == "boolean":
        return True
    if value_type == "array":
        return [_sample_value(schema.get("items", {"type": "string"}))]
    if value_type == "object":
        return {"field": "value"}
    return "value"


def test_tool_catalog_has_unique_names_and_metadata():
    tools = _catalog()

    names = [tool.name for tool in tools]
    assert len(names) == len(set(names))
    assert "get_current_schedule" in names
    assert "create_room_booking" in names
    assert "search_university_policies" in names

    for tool in tools:
        assert tool.display_name
        assert tool.description
        assert tool.allowed_roles
        assert tool.input_model is not None
        if tool.operation_type is ToolOperation.READ:
            assert tool.requires_confirmation is False
        else:
            assert tool.requires_confirmation is True


def test_rag_tool_defaults_to_three_contexts_for_synthesis():
    rag_service = CapturingRagService()
    registry = build_tool_registry(
        nest_client=NestApiClient(
            transport=httpx.MockTransport(
                lambda request: httpx.Response(200, json={"data": {}})
            )
        ),
        rag_service=rag_service,
    )

    result = registry.get("search_university_policies").execute(
        ToolContext(
            user_id="u1",
            role="student",
            access_token="token",
            request_id="req-rag",
        ),
        {"query": "dieu kien du thi"},
    )

    assert result.ok is True
    assert rag_service.top_k == 3


def test_every_nest_tool_can_build_request_from_required_arguments():
    tools = [tool for tool in _catalog() if tool.name != "search_university_policies"]

    for tool in tools:
        schema = tool.input_model.model_json_schema()
        required = set(schema.get("required", []))
        values = {
            name: _sample_value(field_schema)
            for name, field_schema in schema.get("properties", {}).items()
            if name in required
        }
        arguments = tool.input_model.model_validate(values)
        request = tool.request_builder(arguments)

        assert request["method"] in {"GET", "POST", "PUT", "PATCH", "DELETE"}, tool.name
        assert request["path"].startswith("/"), tool.name
        assert "{" not in request["path"], tool.name


def test_tool_validation_rejects_extra_identity_or_url_fields():
    registry = build_tool_registry(nest_client=NestApiClient(transport=httpx.MockTransport(lambda request: httpx.Response(200, json={"data": {}}))), rag_service=FakeRagService())
    tool = registry.get("get_semester_schedule")
    context = ToolContext(user_id="u1", role="student", access_token="secret-token", request_id="req-1")

    result = tool.execute(
        context,
        {
            "semester_id": "hk1",
            "user_id": "override-me",
            "url": "https://evil.example.com",
        },
    )

    assert result.ok is False
    assert result.error is not None
    assert result.error.code == "validation_error"
    assert "Extra inputs are not permitted" in result.error.message
    assert "secret-token" not in result.error.message


def test_registry_filters_tools_by_role():
    registry = build_tool_registry(
        nest_client=NestApiClient(transport=httpx.MockTransport(lambda request: httpx.Response(200, json={"data": {}}))),
        rag_service=FakeRagService(),
    )

    student_names = {tool.name for tool in registry.for_role("student")}
    lecturer_names = {tool.name for tool in registry.for_role("lecturer")}
    canteen_admin_names = {tool.name for tool in registry.for_role("canteen_admin")}
    admin_names = {tool.name for tool in registry.for_role("admin")}

    assert "register_class_section" in student_names
    assert "update_grade_sheet" not in student_names
    assert "update_grade_sheet" in lecturer_names
    assert "create_canteen_product" in canteen_admin_names
    assert "list_users" not in canteen_admin_names
    assert "list_users" in admin_names


def test_registry_definitions_only_expose_llm_fields():
    registry = build_tool_registry(
        nest_client=NestApiClient(transport=httpx.MockTransport(lambda request: httpx.Response(200, json={"data": {}}))),
        rag_service=FakeRagService(),
    )
    definition = next(item for item in registry.definitions_for_role("student") if item["name"] == "register_class_section")

    assert set(definition.keys()) == {"name", "description", "parameters"}
    assert "Authorization" not in str(definition)
    assert "access_token" not in str(definition)


def test_registry_hides_tools_with_opaque_payload_schema_from_llm():
    registry = build_tool_registry(
        nest_client=NestApiClient(transport=httpx.MockTransport(lambda request: httpx.Response(200, json={"data": {}}))),
        rag_service=FakeRagService(),
    )

    student_definitions = {item["name"] for item in registry.definitions_for_role("student")}
    admin_definitions = {item["name"] for item in registry.definitions_for_role("admin")}

    assert "register_class_section" in student_definitions
    assert "create_room_booking" not in student_definitions
    assert "create_canteen_product" not in admin_definitions


def test_registry_shortlists_tools_by_business_domain():
    registry = build_tool_registry(
        nest_client=NestApiClient(transport=httpx.MockTransport(lambda request: httpx.Response(200, json={"data": {}}))),
        rag_service=FakeRagService(),
    )

    names = {
        item["name"]
        for item in registry.definitions_for_query(
            "student",
            "Đăng ký lớp học phần SE104.N21 cho tôi.",
        )
    }

    assert "register_class_section" in names
    assert "search_university_policies" not in names
    assert "create_canteen_momo_payment" not in names
    assert "create_parking_momo_payment" not in names
    assert "get_current_schedule" not in names
    assert len(names) <= 6
    assert len(names) < len(registry.definitions_for_role("student"))


def test_registry_keeps_ambiguous_payment_domains_available():
    registry = build_tool_registry(
        nest_client=NestApiClient(transport=httpx.MockTransport(lambda request: httpx.Response(200, json={"data": {}}))),
        rag_service=FakeRagService(),
    )

    names = {
        item["name"]
        for item in registry.definitions_for_query("student", "Tôi muốn thanh toán bằng MoMo.")
    }

    assert "create_canteen_momo_payment" in names
    assert "create_parking_momo_payment" in names


def test_registry_narrows_explicit_mark_all_notifications_action():
    registry = build_tool_registry(
        nest_client=NestApiClient(
            transport=httpx.MockTransport(
                lambda request: httpx.Response(200, json={"data": {}})
            )
        ),
        rag_service=FakeRagService(),
    )

    names = {
        item["name"]
        for item in registry.definitions_for_query(
            "student",
            "Đánh dấu tất cả thông báo của tôi là đã đọc.",
        )
    }

    assert names == {"mark_all_notifications_read"}


def test_mark_all_notifications_accepts_vietnamese_action_intent():
    registry = build_tool_registry(
        nest_client=NestApiClient(
            transport=httpx.MockTransport(
                lambda request: httpx.Response(200, json={"data": {}})
            )
        ),
        rag_service=FakeRagService(),
    )
    tool = registry.get("mark_all_notifications_read")
    arguments = tool.validate_arguments({})

    assert tool.allows_action_for_message(
        "Đánh dấu tất cả thông báo của tôi là đã đọc.",
        arguments,
    )
    assert not tool.allows_action_for_message("Xem thông báo của tôi.", arguments)


def test_every_exposed_tool_is_reachable_through_a_domain_shortlist():
    registry = build_tool_registry(
        nest_client=NestApiClient(transport=httpx.MockTransport(lambda request: httpx.Response(200, json={"data": {}}))),
        rag_service=FakeRagService(),
    )
    roles = ("student", "lecturer", "canteen_admin", "admin", "super_admin")
    domain_queries = (
        "Đăng ký học phần, xem lịch học và điểm.",
        "Xem danh sách học kỳ.",
        "Kiểm tra điểm danh chuyên cần.",
        "Xem căn tin và đơn hàng căn tin.",
        "Tìm sách thư viện và khoản mượn.",
        "Xem phòng học, tòa nhà và đặt phòng.",
        "Xem thông báo và sự kiện.",
        "Xem bãi xe, phương tiện, SOS và báo cháy.",
        "Xem hồ sơ, tài khoản và người dùng.",
        "Tìm học liệu.",
        "Tra cứu quy chế và thủ tục.",
    )

    reached: set[str] = set()
    for role in roles:
        for query in domain_queries:
            reached.update(item["name"] for item in registry.definitions_for_query(role, query))

    expected = {tool.name for tool in registry.all() if tool.should_expose_to_llm()}
    assert reached == expected


def test_rag_tool_definition_is_retrieval_only():
    registry = build_tool_registry(
        nest_client=NestApiClient(transport=httpx.MockTransport(lambda request: httpx.Response(200, json={"data": {}}))),
        rag_service=FakeRagService(),
    )

    definition = next(item for item in registry.definitions_for_role("student") if item["name"] == "search_university_policies")

    assert "include_context" not in str(definition["parameters"])
