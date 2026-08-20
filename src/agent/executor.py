from __future__ import annotations

import json
import logging
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
from src.core.auth import AuthenticatedUser
from src.core.config import settings
from src.core.safety import fit_public_payload, limit_text

logger = logging.getLogger(__name__)


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
    ) -> AgentQueryResult:
        request_id = str(uuid4())
        normalized_message = message.strip()
        if len(normalized_message) > settings.agent_max_message_chars:
            return self._simple_answer(
                "Cau hoi dang qua dai. Ban vui long chia nho noi dung hoac hoi cu the hon.",
                request_id=request_id,
            )
        if session_id and len(session_id) > settings.agent_max_session_id_chars:
            return self._simple_answer(
                "Session hien tai khong hop le. Ban vui long bat dau lai cuoc hoi thoai.",
                request_id=request_id,
            )

        started = time.monotonic()
        deadline = started + settings.agent_total_timeout_seconds
        context = ToolContext(
            user_id=user.user_id,
            role=user.role,
            access_token=user.access_token,
            request_id=request_id,
            session_id=session_id,
        )
        contents: list[types.Content] = [
            types.Content(role="user", parts=[types.Part.from_text(text=normalized_message)]),
        ]
        trace = [
            AgentTraceStep(
                type="analysis",
                label="Da phan tich yeu cau",
                status="completed",
            )
        ]
        read_calls = 0
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
                    "Toi chua the xu ly yeu cau nay on dinh luc nay. Ban vui long thu lai sau.",
                    trace=trace,
                    request_id=request_id,
                )

            function_calls = list(response.function_calls or [])
            if not function_calls:
                text = limit_text((response.text or "").strip() or self._fallback_answer(), settings.agent_max_answer_chars)
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
                    trace=[*trace, AgentTraceStep(type="answer", label="Da tong hop cau tra loi", status="completed")],
                )

            if len(function_calls) != 1:
                return self._simple_answer(
                    "Toi can xu ly tung thao tac mot de tranh nham lan. Ban vui long yeu cau tung viec rieng.",
                    trace=[*trace, AgentTraceStep(type="analysis", label="Khong the xu ly nhieu thao tac cung luc", status="failed")],
                    request_id=request_id,
                )

            call = function_calls[0]
            tool = self._get_tool(call.name)
            if tool is None:
                return self._simple_answer(
                    "Toi chua the xu ly yeu cau nay mot cach an toan trong luc nay.",
                    trace=[*trace, AgentTraceStep(type="analysis", label="Khong tim thay cong cu phu hop", status="failed")],
                    request_id=request_id,
                )

            try:
                validated = tool.validate_arguments(dict(call.args or {}))
            except (ValidationError, ValueError):
                return self._simple_answer(
                    "Toi chua du thong tin de thuc hien yeu cau nay. Ban vui long noi ro hon giup toi.",
                    trace=[*trace, AgentTraceStep(type="analysis", label="Thieu thong tin can thiet", status="failed")],
                    request_id=request_id,
                )

            if context.role not in tool.allowed_roles:
                return self._simple_answer(
                    "Tai khoan hien tai khong co quyen thuc hien yeu cau nay.",
                    trace=[*trace, AgentTraceStep(type="analysis", label="Khong du quyen su dung cong cu", status="failed")],
                    request_id=request_id,
                )

            fingerprint = self._tool_fingerprint(tool, validated)
            if tool.operation_type.value == "read":
                if fingerprint in seen_fingerprints:
                    return self._simple_answer(
                        "Toi dang lap lai cung mot tra cuu ma van khong co them thong tin chac chan. Ban vui long doi cau hoi cu the hon.",
                        trace=[*trace, AgentTraceStep(type="analysis", label="Da dung vong lap tra cuu lap", status="failed")],
                        request_id=request_id,
                    )
                seen_fingerprints.add(fingerprint)
                read_calls += 1
                if read_calls > settings.agent_max_read_tool_calls:
                    return self._simple_answer(
                        "Toi can dung lai de tranh goi qua nhieu cong cu trong mot luot. Ban vui long hoi cu the hon.",
                        trace=[*trace, AgentTraceStep(type="analysis", label="Da dat gioi han tra cuu", status="failed")],
                        request_id=request_id,
                    )

                result = self._execute_read_tool(tool, context, validated, deadline)
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
                            role="tool",
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
                    "Toi chua thay mot yeu cau hanh dong du ro rang trong cau hoi nay, nen tam thoi chua de xuat thao tac.",
                    trace=[*trace, AgentTraceStep(type="analysis", label="Khong co intent hanh dong ro rang", status="failed")],
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
            "Toi chua the hoan tat yeu cau trong mot luot an toan. Ban vui long thu lai voi cau hoi cu the hon.",
            trace=[*trace, AgentTraceStep(type="analysis", label="Da dat gioi han buoc xu ly", status="failed")],
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
                answer="Toi khong the tiep tuc thao tac nay vi du lieu xac nhan khong con toan ven.",
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
                answer="Khong the tiep tuc thao tac nay vi cong cu khong con kha dung.",
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
                answer="Tinh nang thao tac nay hien chua duoc mo trong giai doan hien tai.",
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
                "Toi da gui thao tac nhung chua xac nhan duoc ket qua cuoi cung tu he thong. "
                "Ban vui long kiem tra lai trang thai truoc khi thu lai."
            )
        else:
            detail = result.error.message if result.error else "Khong ro nguyen nhan."
            answer = f"Toi khong the hoan tat thao tac nay. {detail}"

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
                "Tinh nang thao tac co xac nhan hien chua duoc bat. Ban tam thoi chi co the tra cuu du lieu.",
                trace=[*trace, AgentTraceStep(type="confirmation", label=tool.display_name, status="failed", tool=tool.name)],
                request_id=context.request_id,
            )
        if not self._is_action_enabled(tool):
            return self._simple_answer(
                "Thao tac nay chua duoc mo trong giai doan hien tai.",
                trace=[*trace, AgentTraceStep(type="confirmation", label=tool.display_name, status="failed", tool=tool.name)],
                request_id=context.request_id,
            )
        if not self.proposal_store.available:
            return self._simple_answer(
                "Tinh nang thao tac dang tam thoi khong kha dung vi he thong chua cau hinh day du.",
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
            trace=trace or [AgentTraceStep(type="analysis", label="Da phan tich yeu cau", status="completed")],
        )

    def _timed_out_answer(self, trace: list[AgentTraceStep]) -> AgentQueryResult:
        return AgentQueryResult(
            answer_type="answer",
            answer="Toi can dung lai de tranh xu ly qua lau trong mot luot. Ban vui long hoi cu the hon hoac thu lai sau.",
            trace=[*trace, AgentTraceStep(type="analysis", label="Vuot qua thoi gian xu ly", status="failed")],
        )

    @staticmethod
    def _fallback_answer() -> str:
        return "Toi chua co du thong tin de tra loi ro rang luc nay."

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
