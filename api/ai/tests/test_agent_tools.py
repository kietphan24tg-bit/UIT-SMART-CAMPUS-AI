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


def _catalog():
    return build_tool_catalog(nest_client=NestApiClient(transport=httpx.MockTransport(lambda request: httpx.Response(200, json={"data": {"ok": True}}))), rag_service=FakeRagService())


def test_tool_catalog_has_unique_names_and_metadata():
    tools = _catalog()

    names = [tool.name for tool in tools]
    assert len(names) == len(set(names))
    assert "get_current_schedule" in names
    assert "create_room_booking" in names
    assert "search_university_policies" in names

    for tool in tools:
        assert tool.description
        assert tool.allowed_roles
        assert tool.input_model is not None
        if tool.operation_type is ToolOperation.READ:
            assert tool.requires_confirmation is False
        else:
            assert tool.requires_confirmation is True


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


def test_rag_tool_definition_is_retrieval_only():
    registry = build_tool_registry(
        nest_client=NestApiClient(transport=httpx.MockTransport(lambda request: httpx.Response(200, json={"data": {}}))),
        rag_service=FakeRagService(),
    )

    definition = next(item for item in registry.definitions_for_role("student") if item["name"] == "search_university_policies")

    assert "include_context" not in str(definition["parameters"])
