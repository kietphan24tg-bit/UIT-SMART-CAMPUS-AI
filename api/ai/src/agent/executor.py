from __future__ import annotations

import json
import logging
import re
import time
from uuid import uuid4

from google import genai
from google.genai import types
from pydantic import BaseModel, ValidationError

from src.agent.models import AgentProposalExecutionResult, AgentQueryResult, AgentTraceStep, ProposalPreview
from src.agent.prompt import AGENT_SYSTEM_PROMPT
from src.agent.proposals import (
    AuditEvent,
    ProposalStore,
    ToolProposal,
    classify_action_result,
    tool_error_payload,
)
from src.agent.tools import ToolContext, ToolRegistry, build_tool_registry
from src.agent.tools.base import AgentTool
from src.agent.tools.results import ToolError, ToolResult
from src.api.schemas import Citation
from src.core.auth import AuthenticatedUser
from src.core.config import settings
from src.core.safety import fit_public_payload, limit_text

logger = logging.getLogger(__name__)

AGENT_HISTORY_LIMIT = 10
AGENT_HISTORY_MAX_CHARS = 16_000


class SmartCampusAgent:
    def __init__(
        self,
        *,
        client: genai.Client | None = None,
        registry: ToolRegistry | None = None,
        proposal_store: ProposalStore | None = None,
    ) -> None:
        self.client = client or genai.Client(
            api_key=settings.gemini_key,
            http_options=types.HttpOptions(timeout=int(settings.agent_llm_timeout_seconds * 1000)),
        )
        self.registry = registry or build_tool_registry()
        self.proposal_store = proposal_store or ProposalStore()

    def answer_query(
        self,
        *,
        user: AuthenticatedUser,
        message: str,
        session_id: str | None = None,
        history: list[dict[str, str]] | None = None,
    ) -> AgentQueryResult:
        request_id = str(uuid4())
        normalized_message = message.strip()
        if len(normalized_message) > settings.agent_max_message_chars:
            return self._simple_answer(
                "Câu hỏi đang quá dài. Bạn vui lòng chia nhỏ nội dung hoặc hỏi cụ thể hơn.",
                request_id=request_id,
            )
        if session_id and len(session_id) > settings.agent_max_session_id_chars:
            return self._simple_answer(
                "Session hiện tại không hợp lệ. Bạn vui lòng bắt đầu lại cuộc hội thoại.",
                request_id=request_id,
            )
        normalized_history = self._normalize_history(history)

        started = time.monotonic()
        deadline = started + settings.agent_total_timeout_seconds
        context = ToolContext(
            user_id=user.user_id,
            role=user.role,
            access_token=user.access_token,
            request_id=request_id,
            session_id=session_id,
        )
        contents: list[types.Content] = self._build_contents(normalized_history, normalized_message)
        trace = [
            AgentTraceStep(
                type="analysis",
                label="Đã phân tích yêu cầu",
                status="completed",
            )
        ]
        read_calls = 0
        rag_calls = 0
        rag_citations: list[Citation] = []
        seen_fingerprints: set[str] = set()

        for _ in range(settings.agent_max_tool_steps):
            if time.monotonic() >= deadline:
                return self._timed_out_answer(trace)

            try:
                response = self.client.models.generate_content(
                    model=settings.agent_model,
                    contents=contents,
                    config=self._generation_config(user.role),
                )
            except Exception:
                logger.exception("Agent generation failed")
                return self._simple_answer(
                    "Tôi chưa thể xử lý yêu cầu này ổn định lúc này. Bạn vui lòng thử lại sau.",
                    trace=trace,
                    request_id=request_id,
                )

            function_calls = list(response.function_calls or [])
            if not function_calls:
                raw_text = (response.text or "").strip() or self._fallback_answer()
                text = limit_text(
                    self._validate_citations(raw_text, len(rag_citations)),
                    settings.agent_max_answer_chars,
                )
                citations = self._used_citations(text, rag_citations)
                self._audit(
                    event_type="agent_answer",
                    request_id=request_id,
                    user=user,
                    status="success",
                    metadata={"trace_steps": len(trace)},
                )
                return AgentQueryResult(
                    answer_type="answer",
                    answer=text,
                    citations=citations,
                    trace=[*trace, AgentTraceStep(type="answer", label="Đã tổng hợp câu trả lời", status="completed")],
                )

            if len(function_calls) != 1:
                return self._simple_answer(
                    "Tôi cần xử lý từng thao tác một để tránh nhầm lẫn. Bạn vui lòng yêu cầu từng việc riêng.",
                    trace=[*trace, AgentTraceStep(type="analysis", label="Không thể xử lý nhiều thao tác cùng lúc", status="failed")],
                    request_id=request_id,
                )

            call = function_calls[0]
            tool = self._get_tool(call.name)
            if tool is None:
                return self._simple_answer(
                    "Tôi chưa thể xử lý yêu cầu này một cách an toàn trong lúc này.",
                    trace=[*trace, AgentTraceStep(type="analysis", label="Không tìm thấy công cụ phù hợp", status="failed")],
                    request_id=request_id,
                )

            try:
                validated = tool.validate_arguments(dict(call.args or {}))
            except (ValidationError, ValueError):
                return self._simple_answer(
                    "Tôi chưa đủ thông tin để thực hiện yêu cầu này. Bạn vui lòng nói rõ hơn giúp tôi.",
                    trace=[*trace, AgentTraceStep(type="analysis", label="Thiếu thông tin cần thiết", status="failed")],
                    request_id=request_id,
                )

            if context.role not in tool.allowed_roles:
                return self._simple_answer(
                    "Tài khoản hiện tại không có quyền thực hiện yêu cầu này.",
                    trace=[*trace, AgentTraceStep(type="analysis", label="Không đủ quyền sử dụng công cụ", status="failed")],
                    request_id=request_id,
                )

            fingerprint = self._tool_fingerprint(tool, validated)
            if tool.operation_type.value == "read":
                if tool.name == "search_university_policies":
                    rag_calls += 1
                    if rag_calls > 1:
                        return self._simple_answer(
                            "Tôi chỉ nên tra cứu tài liệu quy chế một lần trong mỗi lượt để tránh lặp nguồn và tăng nhiễu.",
                            trace=[*trace, AgentTraceStep(type="analysis", label="Đã dừng lặp lại tra cứu quy chế", status="failed")],
                            request_id=request_id,
                        )
                if fingerprint in seen_fingerprints:
                    return self._simple_answer(
                        "Tôi đang lặp lại cùng một tra cứu mà vẫn không có thêm thông tin chắc chắn. Bạn vui lòng đổi câu hỏi cụ thể hơn.",
                        trace=[*trace, AgentTraceStep(type="analysis", label="Đã dừng vòng lặp tra cứu lặp", status="failed")],
                        request_id=request_id,
                    )
                seen_fingerprints.add(fingerprint)
                read_calls += 1
                if read_calls > settings.agent_max_read_tool_calls:
                    return self._simple_answer(
                        "Tôi cần dừng lại để tránh gọi quá nhiều công cụ trong một lượt. Bạn vui lòng hỏi cụ thể hơn.",
                        trace=[*trace, AgentTraceStep(type="analysis", label="Đã đạt giới hạn tra cứu", status="failed")],
                        request_id=request_id,
                    )

                result = self._execute_read_tool(tool, context, validated, deadline)
                if tool.name == "search_university_policies":
                    if not result.ok:
                        return self._simple_answer(
                            "Tôi chưa thể tra cứu tài liệu quy chế ổn định lúc này. Bạn vui lòng thử lại sau.",
                            trace=[*trace, AgentTraceStep(type="tool", label=tool.display_name, status="failed", tool=tool.name)],
                            request_id=request_id,
                        )
                    if not self._rag_result_found(result):
                        return self._simple_answer(
                            "Mình chưa tìm thấy đủ căn cứ trong bộ tài liệu đã index để trả lời chắc chắn cho câu hỏi này.",
                            trace=[*trace, AgentTraceStep(type="tool", label=tool.display_name, status="failed", tool=tool.name)],
                            request_id=request_id,
                        )
                    rag_citations = self._rag_citations(result)
                trace.append(
                    AgentTraceStep(
                        type="tool",
                        label=tool.display_name,
                        status="completed" if result.ok else "failed",
                        tool=tool.name,
                    )
                )
                self._audit(
                    event_type="tool_read",
                    request_id=request_id,
                    user=user,
                    tool=tool,
                    status="success" if result.ok else "failed",
                    error_code=result.error.code if result.error else None,
                    metadata={"tool": tool.name},
                )
                contents.extend(
                    [
                        self._response_content(response),
                        types.Content(
                            role="user",
                            parts=[
                                types.Part.from_function_response(
                                    name=call.name,
                                    response={"tool_result": tool.to_llm_result(result)},
                                )
                            ],
                        ),
                    ]
                )
                continue

            if not tool.allows_action_for_message(normalized_message, validated):
                return self._simple_answer(
                    "Tôi chưa thấy một yêu cầu hành động đủ rõ ràng trong câu hỏi này, nên tạm thời chưa đề xuất thao tác.",
                    trace=[*trace, AgentTraceStep(type="analysis", label="Không có intent hành động rõ ràng", status="failed")],
                    request_id=request_id,
                )

            return self._create_action_proposal(
                tool=tool,
                validated=validated,
                context=context,
                trace=trace,
                user=user,
            )

        return self._simple_answer(
            "Tôi chưa thể hoàn tất yêu cầu trong một lượt an toàn. Bạn vui lòng thử lại với câu hỏi cụ thể hơn.",
            trace=[*trace, AgentTraceStep(type="analysis", label="Đã đạt giới hạn bước xử lý", status="failed")],
            request_id=request_id,
        )

    def get_proposal(self, *, user: AuthenticatedUser, proposal_id: str) -> ToolProposal | None:
        proposal = self._find_user_proposal(user=user, proposal_id=proposal_id)
        if proposal and proposal.status == "pending" and proposal.is_expired:
            proposal = self.proposal_store.expire_pending(proposal_id, user.user_id) or proposal
        return proposal

    def reject_proposal(self, *, user: AuthenticatedUser, proposal_id: str) -> ToolProposal | None:
        proposal = self._find_user_proposal(user=user, proposal_id=proposal_id)
        if proposal is None:
            return None
        if proposal.status == "pending" and proposal.is_expired:
            proposal = self.proposal_store.expire_pending(proposal_id, user.user_id) or proposal
            return proposal
        if proposal.status != "pending":
            return proposal
        rejected = self.proposal_store.mark_rejected(proposal_id, user.user_id)
        if rejected:
            self._audit(
                event_type="proposal_reject",
                request_id=rejected.request_id,
                user=user,
                status=rejected.status,
                proposal=rejected,
            )
        return rejected

    def confirm_proposal(
        self,
        *,
        user: AuthenticatedUser,
        proposal_id: str,
    ) -> AgentProposalExecutionResult:
        proposal = self._find_user_proposal(user=user, proposal_id=proposal_id)
        if proposal is None:
            raise ProposalNotFoundError()
        if proposal.status == "pending" and proposal.is_expired:
            self.proposal_store.expire_pending(proposal_id, user.user_id)
            raise ProposalExpiredError()
        if proposal.status != "pending":
            raise ProposalConflictError()

        claimed = self.proposal_store.claim_pending_for_execution(proposal_id, user.user_id, user.role)
        if claimed is None:
            current = self._find_user_proposal(user=user, proposal_id=proposal_id)
            if current and current.role != user.role:
                raise ProposalForbiddenError()
            if current and current.is_expired:
                raise ProposalExpiredError()
            raise ProposalConflictError()

        if not self.proposal_store.arguments_hash_matches(claimed):
            error = ToolError(code="validation_error", message="Stored action arguments failed integrity verification.")
            stored = self.proposal_store.mark_result(
                claimed.id,
                status="failed",
                error=tool_error_payload(error),
            )
            self._audit(
                event_type="proposal_confirm",
                request_id=claimed.request_id,
                user=user,
                status="failed",
                proposal=stored,
                error_code=error.code,
                metadata={"reason": "arguments_hash_mismatch"},
            )
            return AgentProposalExecutionResult(
                answer="Tôi không thể tiếp tục thao tác này vì dữ liệu xác nhận không còn toàn vẹn.",
                status=stored.status,
                public_result={"ok": False, "error": error.model_dump(exclude_none=True)},
            )

        tool = self._get_tool(claimed.tool_name)
        if tool is None:
            error = ToolError(code="upstream_error", message="Configured tool no longer exists.", retryable=False)
            stored = self.proposal_store.mark_result(
                claimed.id,
                status="failed",
                error=tool_error_payload(error),
            )
            return AgentProposalExecutionResult(
                answer="Không thể tiếp tục thao tác này vì công cụ không còn khả dụng.",
                status=stored.status,
                public_result={"ok": False, "error": error.model_dump(exclude_none=True)},
            )

        if user.role not in tool.allowed_roles:
            error = ToolError(code="forbidden", message="Current role is no longer allowed for this action.")
            self.proposal_store.mark_result(claimed.id, status="failed", error=tool_error_payload(error))
            raise ProposalForbiddenError()

        if not self._is_action_enabled(tool):
            error = ToolError(code="forbidden", message="This action is not enabled in the current rollout stage.")
            stored = self.proposal_store.mark_result(
                claimed.id,
                status="failed",
                error=tool_error_payload(error),
            )
            return AgentProposalExecutionResult(
                answer="Tính năng thao tác này hiện chưa được mở trong giai đoạn hiện tại.",
                status=stored.status,
                public_result={"ok": False, "error": error.model_dump(exclude_none=True)},
            )

        context = ToolContext(
            user_id=user.user_id,
            role=user.role,
            access_token=user.access_token,
            request_id=str(uuid4()),
            session_id=claimed.session_id,
            idempotency_key=claimed.id,
        )
        result = tool.execute(context, claimed.arguments)
        final_status = classify_action_result(result)
        public_result = tool.to_public_result(result)
        stored = self.proposal_store.mark_result(
            claimed.id,
            status=final_status,
            result=public_result if result.ok else None,
            error=result.error.model_dump(exclude_none=True) if result.error else None,
        )

        if result.ok:
            validated = tool.validate_arguments(claimed.arguments)
            answer = tool.success_message(validated, result)
        elif stored.status == "execution_unknown":
            answer = (
                "Tôi đã gửi thao tác nhưng chưa xác nhận được kết quả cuối cùng từ hệ thống. "
                "Bạn vui lòng kiểm tra lại trạng thái trước khi thử lại."
            )
        else:
            detail = result.error.message if result.error else "Không rõ nguyên nhân."
            answer = f"Tôi không thể hoàn tất thao tác này. {detail}"

        self._audit(
            event_type="proposal_confirm",
            request_id=claimed.request_id,
            user=user,
            tool=tool,
            status=stored.status,
            proposal=stored,
            error_code=result.error.code if result.error else None,
            metadata={"tool": tool.name},
        )
        return AgentProposalExecutionResult(
            answer=limit_text(answer, settings.agent_max_answer_chars),
            status=stored.status,
            public_result=public_result,
        )

    def _create_action_proposal(
        self,
        *,
        tool: AgentTool,
        validated: BaseModel,
        context: ToolContext,
        trace: list[AgentTraceStep],
        user: AuthenticatedUser,
    ) -> AgentQueryResult:
        if not settings.agent_actions_enabled:
            return self._simple_answer(
                "Tính năng thao tác có xác nhận hiện chưa được bật. Bạn tạm thời chỉ có thể tra cứu dữ liệu.",
                trace=[*trace, AgentTraceStep(type="confirmation", label=tool.display_name, status="failed", tool=tool.name)],
                request_id=context.request_id,
            )
        if not self._is_action_enabled(tool):
            return self._simple_answer(
                "Thao tác này chưa được mở trong giai đoạn hiện tại.",
                trace=[*trace, AgentTraceStep(type="confirmation", label=tool.display_name, status="failed", tool=tool.name)],
                request_id=context.request_id,
            )
        if not self.proposal_store.available:
            return self._simple_answer(
                "Tính năng thao tác đang tạm thời không khả dụng vì hệ thống chưa cấu hình đầy đủ.",
                trace=[*trace, AgentTraceStep(type="confirmation", label=tool.display_name, status="failed", tool=tool.name)],
                request_id=context.request_id,
            )

        self.proposal_store.ensure_schema()
        arguments = validated.model_dump(exclude_none=True)
        proposal = self.proposal_store.create(
            user_id=context.user_id,
            role=context.role,
            session_id=context.session_id,
            tool_name=tool.name,
            operation_type=tool.operation_type,
            risk_level=tool.risk_level,
            arguments=arguments,
            confirmation_message=tool.confirmation_message(validated),
            summary=tool.summarize_arguments(validated),
            request_id=context.request_id,
            ttl_seconds=settings.agent_confirmation_ttl_seconds,
        )
        self._audit(
            event_type="proposal_create",
            request_id=context.request_id,
            user=user,
            tool=tool,
            status="pending",
            proposal=proposal,
            metadata={"tool": tool.name},
        )
        return AgentQueryResult(
            answer_type="confirmation_required",
            answer=proposal.confirmation_message,
            proposal=self._proposal_preview(proposal),
            trace=[*trace, AgentTraceStep(type="confirmation", label=tool.display_name, status="pending", tool=tool.name)],
        )

    def _generation_config(self, role: str) -> types.GenerateContentConfig:
        declarations = [
            types.FunctionDeclaration(
                name=definition["name"],
                description=definition["description"],
                parameters_json_schema=definition["parameters"],
            )
            for definition in self.registry.definitions_for_role(role)
        ]
        tools = [types.Tool(function_declarations=declarations)] if declarations else None
        return types.GenerateContentConfig(
            system_instruction=AGENT_SYSTEM_PROMPT,
            tools=tools,
            automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
            tool_config=types.ToolConfig(
                function_calling_config=types.FunctionCallingConfig(mode="AUTO")
            ),
            temperature=0.2,
        )

    @staticmethod
    def _response_content(response: types.GenerateContentResponse) -> types.Content:
        if response.candidates and response.candidates[0].content:
            return response.candidates[0].content
        return types.Content(role="model", parts=[])

    def _find_user_proposal(self, *, user: AuthenticatedUser, proposal_id: str) -> ToolProposal | None:
        if not self.proposal_store.available:
            return None
        return self.proposal_store.get_for_user(proposal_id, user.user_id)

    def _get_tool(self, tool_name: str) -> AgentTool | None:
        try:
            return self.registry.get(tool_name)
        except KeyError:
            logger.warning("Gemini selected unknown tool '%s'", tool_name)
            return None

    def _execute_read_tool(
        self,
        tool: AgentTool,
        context: ToolContext,
        validated: BaseModel,
        deadline: float,
    ) -> ToolResult:
        arguments = validated.model_dump(exclude_none=True)
        result = tool.execute(context, arguments)
        if not result.ok and result.error and result.error.retryable and tool.retry_policy == "once_transient":
            if time.monotonic() < deadline:
                result = tool.execute(context, arguments)
        return result

    def _is_action_enabled(self, tool: AgentTool) -> bool:
        allowed_risk_levels = {
            value.strip().lower()
            for value in settings.agent_enabled_action_risk_levels.split(",")
            if value.strip()
        }
        if allowed_risk_levels and tool.risk_level.lower() not in allowed_risk_levels:
            return False
        allowlist = {
            value.strip()
            for value in settings.agent_enabled_action_tools.split(",")
            if value.strip()
        }
        if allowlist and tool.name not in allowlist:
            return False
        return True

    def _tool_fingerprint(self, tool: AgentTool, validated: BaseModel) -> str:
        payload = json.dumps(validated.model_dump(exclude_none=True), ensure_ascii=False, sort_keys=True)
        return f"{tool.name}:{payload}"

    @staticmethod
    def _rag_result_found(result: ToolResult) -> bool:
        data = result.data if isinstance(result.data, dict) else {}
        return bool(data.get("found"))

    @staticmethod
    def _rag_citations(result: ToolResult) -> list[Citation]:
        data = result.data if isinstance(result.data, dict) else {}
        citations = data.get("citations") or []
        parsed: list[Citation] = []
        for item in citations:
            if isinstance(item, Citation):
                parsed.append(item)
            elif isinstance(item, dict):
                parsed.append(Citation.model_validate(item))
        return parsed

    @staticmethod
    def _validate_citations(answer: str, context_count: int) -> str:
        def _replace(match: re.Match[str]) -> str:
            index = int(match.group(1))
            if 1 <= index <= context_count:
                return match.group(0)
            return ""

        return re.sub(r"\[(\d+)\]", _replace, answer).strip()

    @staticmethod
    def _used_citations(answer: str, citations: list[Citation]) -> list[Citation]:
        if not citations:
            return []
        used_indices = {int(match) for match in re.findall(r"\[(\d+)\]", answer)}
        if not used_indices:
            return []
        return [citation for citation in citations if citation.index in used_indices]

    def _build_contents(self, history: list[dict[str, str]], message: str) -> list[types.Content]:
        contents: list[types.Content] = []
        for item in history:
            role = "model" if item["role"] == "assistant" else "user"
            contents.append(types.Content(role=role, parts=[types.Part.from_text(text=item["content"])]))
        contents.append(types.Content(role="user", parts=[types.Part.from_text(text=message)]))
        return contents

    def _normalize_history(self, history: list[dict[str, str]] | None) -> list[dict[str, str]]:
        if not history:
            return []

        normalized: list[dict[str, str]] = []
        total_chars = 0
        for item in history[:AGENT_HISTORY_LIMIT]:
            if not isinstance(item, dict):
                continue
            role = item.get("role")
            content = item.get("content")
            if role not in {"user", "assistant"} or not isinstance(content, str):
                continue
            trimmed = content.strip()
            if not trimmed:
                continue
            if total_chars + len(trimmed) > AGENT_HISTORY_MAX_CHARS:
                continue
            normalized.append({"role": role, "content": trimmed})
            total_chars += len(trimmed)
        return normalized

    def _audit(
        self,
        *,
        event_type: str,
        request_id: str,
        user: AuthenticatedUser,
        status: str,
        tool: AgentTool | None = None,
        proposal: ToolProposal | None = None,
        error_code: str | None = None,
        metadata: dict | None = None,
    ) -> None:
        if not self.proposal_store.available:
            return
        try:
            self.proposal_store.log_event(
                AuditEvent(
                    event_type=event_type,
                    request_id=request_id,
                    user_id=user.user_id,
                    role=user.role,
                    tool_name=tool.name if tool else proposal.tool_name if proposal else None,
                    operation_type=tool.operation_type.value if tool else proposal.operation_type if proposal else None,
                    proposal_id=proposal.id if proposal else None,
                    status=status,
                    latency_ms=None,
                    error_code=error_code,
                    metadata=fit_public_payload(metadata) if metadata else None,
                )
            )
        except Exception:
            logger.exception("Failed to write audit event")

    def _simple_answer(
        self,
        answer: str,
        *,
        trace: list[AgentTraceStep] | None = None,
        request_id: str,
    ) -> AgentQueryResult:
        return AgentQueryResult(
            answer_type="answer",
            answer=limit_text(answer, settings.agent_max_answer_chars),
            citations=[],
            trace=trace or [AgentTraceStep(type="analysis", label="Đã phân tích yêu cầu", status="completed")],
        )

    def _timed_out_answer(self, trace: list[AgentTraceStep]) -> AgentQueryResult:
        return AgentQueryResult(
            answer_type="answer",
            answer="Tôi cần dừng lại để tránh xử lý quá lâu trong một lượt. Bạn vui lòng hỏi cụ thể hơn hoặc thử lại sau.",
            citations=[],
            trace=[*trace, AgentTraceStep(type="analysis", label="Vượt quá thời gian xử lý", status="failed")],
        )

    @staticmethod
    def _fallback_answer() -> str:
        return "Tôi chưa có đủ thông tin để trả lời rõ ràng lúc này."

    @staticmethod
    def _proposal_preview(proposal: ToolProposal) -> ProposalPreview:
        return ProposalPreview(
            id=proposal.id,
            tool=proposal.tool_name,
            operation=proposal.operation_type,
            risk_level=proposal.risk_level,
            summary=proposal.summary,
            status=proposal.status,
            expires_at=proposal.expires_at,
            confirm_path=f"/agent/proposals/{proposal.id}/confirm",
            reject_path=f"/agent/proposals/{proposal.id}/reject",
        )


class ProposalNotFoundError(RuntimeError):
    pass


class ProposalConflictError(RuntimeError):
    pass


class ProposalExpiredError(RuntimeError):
    pass


class ProposalForbiddenError(RuntimeError):
    pass


agent = SmartCampusAgent()
