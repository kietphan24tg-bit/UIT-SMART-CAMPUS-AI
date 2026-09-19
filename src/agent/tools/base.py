from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from typing import Any, Callable, Literal, get_args, get_origin

from pydantic import BaseModel, ConfigDict, Field, ValidationError, create_model

from src.core.config import settings
from src.core.safety import fit_public_payload, json_size_bytes, sanitize_value

from .context import ToolContext
from .nest_client import NestApiClient, NestApiClientError
from .operations import ToolOperation
from .results import ToolError, ToolResult

logger = logging.getLogger(__name__)


class ToolArgumentsModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class NoArguments(ToolArgumentsModel):
    pass


class PayloadInput(ToolArgumentsModel):
    payload: dict[str, Any] = Field(default_factory=dict, min_length=1)


class IdInput(ToolArgumentsModel):
    id: str = Field(min_length=1)


class SearchInput(ToolArgumentsModel):
    query: str = Field(min_length=1)


class AgentTool(ABC):
    risk_level: Literal["low", "medium", "high", "critical"] = "low"
    retry_policy: Literal["never", "once_transient"] = "never"
    name: str
    description: str
    display_name: str
    input_model: type[BaseModel]
    allowed_roles: frozenset[str]
    operation_type: ToolOperation
    requires_confirmation: bool
    sensitive_fields: frozenset[str] = frozenset()
    llm_exposed: bool = True
    action_intent_patterns: tuple[str, ...] = ()

    def validate_arguments(self, arguments: dict) -> BaseModel:
        if json_size_bytes(arguments) > settings.agent_max_argument_bytes:
            raise ValueError("Arguments exceed the allowed size.")
        return self.input_model.model_validate(arguments)

    def execute(self, context: ToolContext, arguments: dict) -> ToolResult:
        try:
            if context.role not in self.allowed_roles:
                return ToolResult(
                    ok=False,
                    tool=self.name,
                    status="failed",
                    error=ToolError(
                        code="forbidden",
                        message=f"Role '{context.role}' is not allowed to execute '{self.name}'.",
                    ),
                )
            validated = self.validate_arguments(arguments)
            return self._execute_validated(context, validated)
        except ValidationError as exc:
            return ToolResult(
                ok=False,
                tool=self.name,
                status="failed",
                error=ToolError(code="validation_error", message=str(exc)),
            )
        except ValueError as exc:
            return ToolResult(
                ok=False,
                tool=self.name,
                status="failed",
                error=ToolError(code="validation_error", message=str(exc)),
            )
        except NestApiClientError as exc:
            return ToolResult(ok=False, tool=self.name, status="failed", error=exc.error)
        except Exception:
            # Tool/provider failures must not escape the Agent route as an
            # unstructured HTTP 500. Keep the traceback in server logs while
            # allowing the agent to produce a controlled fallback.
            logger.exception("Unhandled exception in agent tool %s", self.name)
            return ToolResult(
                ok=False,
                tool=self.name,
                status="failed",
                error=ToolError(
                    code="upstream_error",
                    message="The requested data source is temporarily unavailable.",
                    retryable=True,
                ),
            )

    @abstractmethod
    def _execute_validated(self, context: ToolContext, arguments: BaseModel) -> ToolResult:
        raise NotImplementedError

    def to_llm_definition(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description.strip(),
            "parameters": self.input_model.model_json_schema(),
        }

    def should_expose_to_llm(self) -> bool:
        return self.llm_exposed and not self._has_opaque_payload_schema()

    def allows_action_for_message(self, message: str, arguments: BaseModel) -> bool:
        if self.operation_type is ToolOperation.READ:
            return True
        normalized = " ".join(message.lower().split())
        patterns = self.action_intent_patterns or self._default_action_intent_patterns(arguments)
        return any(pattern in normalized for pattern in patterns)

    def summarize_arguments(self, arguments: BaseModel) -> str:
        cleaned = self.sanitize_arguments(arguments)
        if not cleaned:
            return self.display_name
        parts = [f"{key}={value}" for key, value in cleaned.items()]
        return f"{self.display_name}: {', '.join(parts)}"

    def confirmation_message(self, arguments: BaseModel) -> str:
        return f"Bạn có chắc muốn thực hiện '{self.summarize_arguments(arguments)}' không?"

    def success_message(self, arguments: BaseModel, result: ToolResult) -> str:
        del result
        return f"Đã thực hiện thành công: {self.summarize_arguments(arguments)}."

    def sanitize_arguments(self, arguments: BaseModel) -> dict[str, Any]:
        values = arguments.model_dump(exclude_none=True)
        return sanitize_value(values, sensitive_keys=self.sensitive_fields)

    def to_llm_result(self, result: ToolResult) -> dict[str, Any]:
        payload = {
            "ok": result.ok,
            "tool": result.tool,
            "status": result.status,
            "data": self.project_result_for_llm(result),
            "error": result.error.model_dump(exclude_none=True) if result.error else None,
        }
        return fit_public_payload(payload)

    def to_public_result(self, result: ToolResult) -> dict[str, Any]:
        payload = {
            "ok": result.ok,
            "tool": result.tool,
            "status": result.status,
            "data": self.project_result_for_public(result),
            "error": result.error.model_dump(exclude_none=True) if result.error else None,
        }
        return fit_public_payload(payload)

    def project_result_for_llm(self, result: ToolResult) -> Any:
        return fit_public_payload(sanitize_value(result.data, sensitive_keys=self.sensitive_fields))

    def project_result_for_public(self, result: ToolResult) -> Any:
        return fit_public_payload(sanitize_value(result.data, sensitive_keys=self.sensitive_fields))

    def _has_opaque_payload_schema(self) -> bool:
        for field_name, field_info in self.input_model.model_fields.items():
            if field_name != "payload":
                continue
            annotation = field_info.annotation
            if annotation is dict[str, Any]:
                return True
            origin = get_origin(annotation)
            args = get_args(annotation)
            if origin is dict and (not args or args[-1] is Any):
                return True
        return False

    def _default_action_intent_patterns(self, arguments: BaseModel) -> tuple[str, ...]:
        values = arguments.model_dump(exclude_none=True)
        patterns = list(_ACTION_KEYWORDS.get(self.operation_type, ()))
        for value in values.values():
            if isinstance(value, str) and value.strip():
                patterns.append(value.strip().lower())
        return tuple(dict.fromkeys(patterns))


class NestBackedTool(AgentTool):
    request_builder: Callable[[BaseModel], dict[str, Any]]

    def __init__(self, nest_client: NestApiClient):
        self.nest_client = nest_client

    def _execute_validated(self, context: ToolContext, arguments: BaseModel) -> ToolResult:
        request = self.request_builder(arguments)
        extra_headers = None
        if context.idempotency_key:
            extra_headers = {"X-Idempotency-Key": context.idempotency_key}
        data = self.nest_client.request(context=context, extra_headers=extra_headers, **request)
        return ToolResult(ok=True, tool=self.name, status="success", data=data)


def create_input_model(model_name: str, fields: dict[str, tuple[Any, Any]]) -> type[BaseModel]:
    return create_model(model_name, __base__=ToolArgumentsModel, **fields)


def snake_to_camel(value: str) -> str:
    parts = value.split("_")
    return parts[0] + "".join(part.capitalize() for part in parts[1:])


def build_nest_request(
    *,
    method: str,
    path: str,
    path_params: dict[str, str] | None = None,
    query_params: dict[str, str] | None = None,
    body_params: dict[str, str] | None = None,
    body_field: str | None = None,
    data_field: str | None = None,
) -> Callable[[BaseModel], dict[str, Any]]:
    def _builder(arguments: BaseModel) -> dict[str, Any]:
        values = arguments.model_dump(exclude_none=True)
        resolved_path = path
        if path_params:
            for field_name, placeholder in path_params.items():
                resolved_path = resolved_path.replace(f"{{{placeholder}}}", str(values.pop(field_name)))

        params = None
        if query_params:
            params = {target: values.pop(source) for source, target in query_params.items() if source in values}

        request_json = None
        if body_field:
            request_json = values.pop(body_field, None)
        elif body_params:
            request_json = {target: values.pop(source) for source, target in body_params.items() if source in values}
        elif values:
            request_json = {snake_to_camel(key): value for key, value in values.items()}

        request_data = None
        if data_field:
            request_data = values.pop(data_field, None)

        request: dict[str, Any] = {"method": method, "path": resolved_path}
        if params:
            request["params"] = params
        if request_json is not None:
            request["json"] = request_json
        if request_data is not None:
            request["data"] = request_data
        return request

    return _builder


def create_nest_tool_class(
    *,
    class_name: str,
    name: str,
    description: str,
    input_model: type[BaseModel],
    allowed_roles: frozenset[str],
    operation_type: ToolOperation,
    request_builder: Callable[[BaseModel], dict[str, Any]],
) -> type[NestBackedTool]:
    requires_confirmation = operation_type is not ToolOperation.READ

    class _ConfiguredTool(NestBackedTool):
        pass

    _ConfiguredTool.__name__ = class_name
    _ConfiguredTool.name = name
    _ConfiguredTool.description = description
    _ConfiguredTool.display_name = name.replace("_", " ")
    _ConfiguredTool.input_model = input_model
    _ConfiguredTool.allowed_roles = allowed_roles
    _ConfiguredTool.operation_type = operation_type
    _ConfiguredTool.requires_confirmation = requires_confirmation
    _ConfiguredTool.request_builder = staticmethod(request_builder)
    _ConfiguredTool.risk_level = _DEFAULT_RISK_LEVELS[operation_type]
    _ConfiguredTool.retry_policy = "once_transient" if operation_type is ToolOperation.READ else "never"
    return _ConfiguredTool


_DEFAULT_RISK_LEVELS: dict[ToolOperation, Literal["low", "medium", "high", "critical"]] = {
    ToolOperation.READ: "low",
    ToolOperation.CREATE: "medium",
    ToolOperation.UPDATE: "medium",
    ToolOperation.DELETE: "high",
    ToolOperation.PAYMENT: "critical",
    ToolOperation.EMERGENCY: "critical",
}

_ACTION_KEYWORDS: dict[ToolOperation, tuple[str, ...]] = {
    ToolOperation.CREATE: ("tao", "tạo", "dang ky", "đăng ký", "them", "thêm", "dat", "đặt", "gui", "gửi"),
    ToolOperation.UPDATE: ("cap nhat", "cập nhật", "doi", "đổi", "huy", "hủy", "xac nhan", "xác nhận", "stop", "bat dau", "bắt đầu", "gia han", "gia hạn", "resolve"),
    ToolOperation.DELETE: ("xoa", "xóa", "huy", "hủy", "go", "gỡ", "remove"),
    ToolOperation.PAYMENT: ("thanh toan", "thanh toán", "pay", "momo", "sepay"),
    ToolOperation.EMERGENCY: ("sos", "khan cap", "khẩn cấp", "cuu", "cứu", "checkin", "diem danh", "điểm danh"),
}
