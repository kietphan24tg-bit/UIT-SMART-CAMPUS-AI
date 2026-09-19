"""RAG generation service.

Pipeline
--------
Question
  -> HybridRetriever  (vector + keyword -> RRF -> candidate_k chunks)
  -> Reranker?        (optional cross-encoder, enabled via RERANKER_ENABLED=true)
  -> Answer gate      (drop to fallback if top score < answer_min_confidence)
  -> GroqClient       (LLM generates answer with mandatory [N] citations)
  -> Citation check   (verify cited indices exist in context)
"""

from __future__ import annotations

import logging
import math
import re
import unicodedata
from dataclasses import dataclass
from typing import Protocol

import httpx
from google import genai
from google.genai import types

from src.api.schemas import Citation, RagContext, RagEvidenceResponse, RagQueryResponse
from src.core.config import Settings, settings
from src.rag.prompts import RAG_SYSTEM_PROMPT, build_user_prompt
from src.reranking.base import Reranker
from src.reranking.provider import create_reranker
from src.retrieval.citations import citation_from_result, validate_and_clean_citations
from src.retrieval.hybrid_retriever import HybridRetriever
from src.retrieval.retriever import RetrievalResult
from src.retrieval.taxonomy import QueryHint, authority_score, classify_query

logger = logging.getLogger(__name__)

GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions"

FALLBACK_ANSWER = (
    "Mình chưa chắc chắn về câu trả lời cho phần này nên không muốn đưa ra "
    "thông tin có thể sai. Nếu đây là vấn đề quan trọng liên quan đến học vụ, "
    "thi cử, chuẩn đầu ra hoặc thủ tục sinh viên, bạn nên kiểm tra thêm từ "
    "kênh thông báo chính thức hoặc liên hệ đơn vị phụ trách để có câu trả lời "
    "chính xác nhất."
)

FALLBACK_ANSWERS = {
    "low_confidence": "Mình chưa tìm được bằng chứng đủ mạnh trong các quy chế đã lập chỉ mục nên không muốn đoán.",
    "incomplete_context": "Tài liệu tìm được chưa chứa đủ nội dung cần thiết để trả lời chính xác.",
    "outside_corpus": "Câu hỏi này nằm ngoài phạm vi bộ quy chế đào tạo và thi cử đang được lập chỉ mục.",
    "out_of_scope": "Câu hỏi này nằm ngoài phạm vi bộ quy chế đào tạo và thi cử đang được lập chỉ mục.",
    "live_personal_data": "Câu hỏi cần dữ liệu cá nhân hoặc thời gian thực mà kho tài liệu tĩnh không thể xác minh.",
    "insufficient_scope": "Phạm vi tài liệu hiện tại không đủ để khẳng định một câu trả lời bao quát cho mọi trường hợp.",
    "prompt_injection_detected": "Yêu cầu có chứa chỉ thị vượt quyền hoặc truy xuất thông tin bảo mật nên đã bị từ chối.",
    "invalid_citation": "Câu trả lời sinh ra có trích dẫn không hợp lệ nên không được cung cấp.",
    "missing_citation": "Câu trả lời sinh ra không có trích dẫn kiểm chứng nên không được cung cấp.",
    "model_abstained": "Mình chưa tìm thấy thông tin đủ chắc trong các tài liệu đã lập chỉ mục.",
}

ABLATION_PRESETS: dict[str, dict[str, bool]] = {
    "B0": {
        "enable_confidence_gate": False,
        "enable_completeness_check": False,
        "enable_citation_validation": False,
        "enable_grounded_fallback": False,
    },
    "B1": {
        "enable_confidence_gate": True,
        "enable_completeness_check": False,
        "enable_citation_validation": False,
        "enable_grounded_fallback": False,
    },
    "B2": {
        "enable_confidence_gate": True,
        "enable_completeness_check": True,
        "enable_citation_validation": False,
        "enable_grounded_fallback": False,
    },
    "B3": {
        "enable_confidence_gate": True,
        "enable_completeness_check": True,
        "enable_citation_validation": True,
        "enable_grounded_fallback": False,
    },
    "B4": {
        "enable_confidence_gate": True,
        "enable_completeness_check": True,
        "enable_citation_validation": True,
        "enable_grounded_fallback": True,
    },
    "FULL": {
        "enable_confidence_gate": True,
        "enable_completeness_check": True,
        "enable_citation_validation": True,
        "enable_grounded_fallback": True,
    },
}


@dataclass(frozen=True)
class GroqClient:
    api_key: str
    model: str
    timeout_seconds: float = 45.0

    def chat(self, system_prompt: str, user_prompt: str) -> str:
        if not self.api_key:
            raise ValueError("GROQ_KEY is required for RAG generation")

        with httpx.Client(timeout=self.timeout_seconds) as client:
            response = client.post(
                GROQ_CHAT_COMPLETIONS_URL,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "temperature": 0.2,
                    "max_tokens": 1200,
                },
            )
            response.raise_for_status()
            payload = response.json()
            return payload["choices"][0]["message"]["content"].strip()


@dataclass(frozen=True)
class GeminiClient:
    api_key: str
    model: str
    temperature: float = 0.0
    seed: int = 42

    def chat(self, system_prompt: str, user_prompt: str) -> str:
        if not self.api_key:
            raise ValueError("GEMINI_KEY is required for RAG generation")

        client = genai.Client(api_key=self.api_key)
        response = client.models.generate_content(
            model=self.model,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=self.temperature,
                seed=self.seed,
                max_output_tokens=1200,
            ),
        )
        content = (response.text or "").strip()
        if not content:
            raise ValueError("Gemini returned an empty response")
        return content


@dataclass(frozen=True)
class OllamaClient:
    """Local chat client; no provider quota or cloud credentials are needed."""

    base_url: str
    model: str
    timeout_seconds: float = 120.0

    def chat(self, system_prompt: str, user_prompt: str) -> str:
        response = httpx.post(
            f"{self.base_url.rstrip('/')}/api/chat",
            json={
                "model": self.model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "stream": False,
                "think": False,
                "options": {"temperature": 0.2, "num_predict": 1200},
            },
            timeout=self.timeout_seconds,
        )
        response.raise_for_status()
        payload = response.json()
        content = ((payload.get("message") or {}).get("content") or "").strip()
        if not content:
            raise ValueError("Ollama returned an empty response")
        return content


class ChatClient(Protocol):
    def chat(self, system_prompt: str, user_prompt: str) -> str:
        ...


def create_chat_client(config: Settings) -> ChatClient:
    provider = config.llm_provider.lower().strip()
    if provider == "ollama":
        return OllamaClient(
            base_url=config.ollama_base_url,
            model=config.llm_model,
        )
    if provider == "groq":
        return GroqClient(api_key=config.groq_key or "", model=config.llm_model)
    if provider == "gemini":
        return GeminiClient(api_key=config.gemini_key or "", model=config.llm_model)
    raise ValueError(f"Unsupported LLM_PROVIDER: {config.llm_provider}")


def application_rag_config(config: Settings = settings) -> Settings:
    """Return the production corpus/model contract used by the Agent.

    The direct RAG endpoint and the Agent policy tool must use the same cloud
    model contract. Keeping the direct endpoint on a separate provider made
    production behaviour depend on an unrelated Groq/Ollama configuration.
    """
    return config.model_copy(
        update={
            "rag_db_schema": config.agent_rag_db_schema,
            "embedding_provider": config.agent_embedding_provider,
            "embedding_model": config.agent_embedding_model,
            "embedding_dimensions": config.agent_embedding_dimensions,
            "llm_provider": "gemini",
            "llm_model": config.agent_model,
            # The application container is intentionally retrieval-only here.
            # Local cross-encoder experiments belong to the research config and
            # can exceed the memory limit of the production service.
            "reranker_enabled": False,
        }
    )


@dataclass(slots=True)
class RetrievedEvidence:
    found: bool
    confidence: float
    retrieved_count: int
    contexts: list[RagContext]
    citations: list[Citation]
    results: list[RetrievalResult]
    fallback_reason: str | None = None
    top_score: float = 0.0
    top_gap: float = 0.0

    def to_response(self) -> RagEvidenceResponse:
        return RagEvidenceResponse(
            found=self.found,
            citations=self.citations,
            confidence=round(self.confidence, 4),
            retrieved_count=self.retrieved_count,
            contexts=self.contexts,
            fallback_reason=self.fallback_reason,
            top_score=round(self.top_score, 4),
            top_gap=round(self.top_gap, 4),
        )


class RagService:
    """Orchestrates the full RAG pipeline."""

    def __init__(
        self,
        config: Settings = settings,
        schema_name: str | None = None,
        retriever: HybridRetriever | None = None,
        reranker: Reranker | None = None,
        llm_client: ChatClient | None = None,
        ablation_preset: str = "B4",
        enable_confidence_gate: bool | None = None,
        enable_completeness_check: bool | None = None,
        enable_citation_validation: bool | None = None,
        enable_grounded_fallback: bool | None = None,
    ) -> None:
        # `schema_name` is intentionally explicit so the Agent can select the
        # application corpus while evaluation keeps using the research corpus.
        self.config = (
            config.model_copy(update={"rag_db_schema": schema_name})
            if schema_name
            else config
        )
        self.retriever = retriever or HybridRetriever(config=self.config)
        if reranker is not None:
            self.reranker = reranker
        elif retriever is None:
            self.reranker = create_reranker(self.config)
        else:
            self.reranker = None
        self.llm_client = llm_client or create_chat_client(self.config)

        preset = ABLATION_PRESETS.get(ablation_preset.upper(), ABLATION_PRESETS["B4"])
        self.enable_confidence_gate = (
            enable_confidence_gate if enable_confidence_gate is not None else preset["enable_confidence_gate"]
        )
        self.enable_completeness_check = (
            enable_completeness_check if enable_completeness_check is not None else preset["enable_completeness_check"]
        )
        self.enable_citation_validation = (
            enable_citation_validation if enable_citation_validation is not None else preset["enable_citation_validation"]
        )
        self.enable_grounded_fallback = (
            enable_grounded_fallback if enable_grounded_fallback is not None else preset["enable_grounded_fallback"]
        )

    def answer(
        self,
        question: str,
        filters: dict | None = None,
        top_k: int | None = None,
        min_score: float | None = None,
        include_context: bool = False,
    ) -> RagQueryResponse:
        evidence = self.retrieve_evidence(
            question=question,
            filters=filters,
            top_k=top_k,
            min_score=min_score,
        )
        if not evidence.found:
            return self._fallback_response(
                include_context=include_context,
                fallback_reason=evidence.fallback_reason,
                confidence=evidence.confidence,
            )

        try:
            logger.info(
                "RAG stage=generation provider=%s model=%s retrieved=%d",
                self.config.llm_provider,
                self.config.llm_model,
                evidence.retrieved_count,
            )
            answer_text = self.llm_client.chat(
                system_prompt=RAG_SYSTEM_PROMPT,
                user_prompt=build_user_prompt(question, evidence.results),
            )
        except Exception:
            logger.exception("RAG stage=generation failed")
            raise

        if self.enable_grounded_fallback and self._looks_like_abstention(answer_text):
            return self._fallback_response(
                include_context=include_context,
                fallback_reason="model_abstained",
                confidence=evidence.confidence,
            )

        citation_validation_dict = None
        if self.enable_citation_validation:
            try:
                val_res = validate_and_clean_citations(answer_text, len(evidence.contexts))
            except Exception:
                logger.exception("RAG stage=citation_validation failed")
                raise
            answer_text = val_res.cleaned_answer
            citation_validation_dict = {
                "total_citations": val_res.total_citations,
                "valid_citations": val_res.valid_citations,
                "invalid_citations": val_res.invalid_citations,
                "validity_rate": val_res.validity_rate,
                "has_unsupported_citation": val_res.has_unsupported_citation,
            }
            if val_res.has_unsupported_citation or val_res.total_citations == 0:
                return self._fallback_response(
                    include_context=include_context,
                    fallback_reason=(
                        "invalid_citation" if val_res.has_unsupported_citation else "missing_citation"
                    ),
                    confidence=evidence.confidence,
                    citation_validation=citation_validation_dict,
                )
        else:
            answer_text = self._validate_citations(answer_text, len(evidence.contexts))

        return RagQueryResponse(
            answer=answer_text,
            # Keep indices aligned with the numbered contexts sent to the model.
            citations=evidence.citations,
            confidence=round(evidence.confidence, 4),
            retrieved_count=evidence.retrieved_count,
            answer_type="knowledge",
            contexts=evidence.contexts if include_context else None,
            fallback_reason=None,
            citation_validation=citation_validation_dict,
        )

    def retrieve_evidence(
        self,
        question: str,
        filters: dict | None = None,
        top_k: int | None = None,
        min_score: float | None = None,
    ) -> RetrievedEvidence:
        hint = classify_query(question)
        if hint.prompt_injection or (hint.out_of_scope and self.enable_confidence_gate):
            logger.info("Question classified as injection/out-of-scope; forcing fallback.")
            reason = (
                "prompt_injection_detected"
                if hint.prompt_injection
                else hint.out_of_scope_reason or "out_of_scope"
            )
            return self._empty_evidence(fallback_reason=reason)

        top_limit = top_k if top_k is not None else self.config.rag_top_k
        score_limit = min_score if min_score is not None else self.config.retrieval_min_score

        candidates = self._retrieve_candidates(question, filters, top_limit, score_limit)
        if not candidates:
            logger.debug("No candidates retrieved for question: %r", question[:80])
            return self._empty_evidence(fallback_reason="no_evidence")

        if self.reranker is not None:
            results = self.reranker.rerank(question, candidates, top_k=top_limit)
            normalized_results: list[RetrievalResult] = []
            for result in results:
                if result.score < self.config.reranker_min_score:
                    continue
                raw = dict(result.raw)
                raw["reranker_score_raw"] = result.score
                normalized_results.append(
                    RetrievalResult(
                        content=result.content,
                        metadata=result.metadata,
                        distance=result.distance,
                        score=self._normalize_reranker_score(result.score),
                        raw=raw,
                    )
                )
            results = normalized_results
        else:
            results = candidates[:top_limit]

        if not results:
            logger.debug("All candidates dropped after reranking/min_score gate.")
            return self._empty_evidence(fallback_reason="no_evidence")

        top_score = min(max(results[0].score, 0.0), 1.0)
        # A singleton result has no top-1/top-2 separation. Treating the
        # missing second result as score 0 would artificially inflate
        # confidence for weak evidence.
        second_score = min(max(results[1].score, 0.0), 1.0) if len(results) > 1 else top_score
        top_gap = max(top_score - second_score, 0.0)

        confidence = self._evidence_confidence(question, results, hint)

        if self.enable_confidence_gate and confidence < self._confidence_threshold(results):
            logger.info("Evidence confidence %.3f below threshold -> fallback", confidence)
            return self._empty_evidence(
                fallback_reason="low_confidence",
                top_score=top_score,
                top_gap=top_gap,
                confidence=confidence,
            )

        if self.enable_completeness_check:
            completeness_ok, reason = self._check_context_completeness(question, results, hint)
            if not completeness_ok:
                logger.info("Context completeness check failed (%s) -> fallback", reason)
                return self._empty_evidence(
                    fallback_reason=reason or "incomplete_context",
                    top_score=top_score,
                    top_gap=top_gap,
                    confidence=confidence,
                )

        contexts = self._contexts(results)
        return RetrievedEvidence(
            found=True,
            confidence=confidence,
            retrieved_count=len(results),
            contexts=contexts,
            citations=[context.citation for context in contexts],
            results=results,
            fallback_reason=None,
            top_score=top_score,
            top_gap=top_gap,
        )

    def _fallback_response(
        self,
        include_context: bool,
        fallback_reason: str | None = "no_evidence",
        confidence: float = 0.0,
        citation_validation: dict | None = None,
    ) -> RagQueryResponse:
        answer_text = (
            FALLBACK_ANSWERS.get(fallback_reason or "", FALLBACK_ANSWER)
            if self.enable_grounded_fallback
            else "Mình chưa chắc chắn về câu trả lời cho phần này."
        )
        return RagQueryResponse(
            answer=answer_text,
            citations=[],
            confidence=round(confidence, 4),
            retrieved_count=0,
            answer_type="fallback",
            contexts=[] if include_context else None,
            fallback_reason=fallback_reason,
            citation_validation=citation_validation,
        )

    @staticmethod
    def _looks_like_abstention(answer: str) -> bool:
        normalized = RagService._ascii_text(answer)
        return any(
            phrase in normalized
            for phrase in (
                "chua tim thay thong tin du chac",
                "chua du can cu",
                "khong du can cu",
                "khong co du thong tin",
                "khong the xac nhan",
                "khong the tra loi chinh xac",
            )
        )

    @staticmethod
    def _empty_evidence(
        fallback_reason: str | None = "no_evidence",
        top_score: float = 0.0,
        top_gap: float = 0.0,
        confidence: float = 0.0,
    ) -> RetrievedEvidence:
        return RetrievedEvidence(
            found=False,
            confidence=confidence,
            retrieved_count=0,
            contexts=[],
            citations=[],
            results=[],
            fallback_reason=fallback_reason,
            top_score=top_score,
            top_gap=top_gap,
        )

    def _retrieve_candidates(
        self,
        question: str,
        filters: dict | None,
        top_k: int,
        min_score: float,
    ) -> list[RetrievalResult]:
        try:
            logger.info(
                "RAG stage=retrieval provider=%s model=%s schema=%s mode=%s",
                self.config.embedding_provider,
                self.config.embedding_model,
                self.config.rag_db_schema,
                self.config.retrieval_mode,
            )
            return self.retriever.retrieve(
                question=question,
                filters=filters,
                candidate_k=self.config.retrieval_candidate_k,
                top_k=top_k if self.reranker is None else self.config.retrieval_candidate_k,
                min_score=min_score if self.reranker is None else 0.0,
            )
        except TypeError:
            return self.retriever.retrieve(
                question=question,
                filters=filters,
                top_k=top_k,
                min_score=min_score,
            )
        except Exception:
            logger.exception("RAG stage=retrieval failed")
            raise

    def _evidence_confidence(self, question: str, results: list[RetrievalResult], hint: QueryHint) -> float:
        top_score = min(max(results[0].score, 0.0), 1.0)
        second_score = min(max(results[1].score, 0.0), 1.0) if len(results) > 1 else top_score
        top_gap = max(top_score - second_score, 0.0)
        lexical = self._lexical_coverage(question, results)
        authority = max(authority_score(result.metadata) for result in results[:2])
        phrase_bonus = 1.0 if any(self._phrase_hit(result, hint) for result in results[:2]) else 0.0

        confidence = (
            (top_score * 0.5)
            + (min(top_gap / max(self.config.answer_min_top_gap, 0.01), 1.0) * 0.2)
            + (lexical * 0.2)
            + (authority * 0.05)
            + (phrase_bonus * 0.05)
        )
        return min(max(confidence, 0.0), 1.0)

    def _check_context_completeness(
        self, question: str, results: list[RetrievalResult], hint: QueryHint
    ) -> tuple[bool, str | None]:
        """Deterministic context completeness check for truncated text, missing required article evidence,
        conflicting/inactive status, or prompt injection inside document content."""
        if not results:
            return False, "no_evidence"

        # 1. Check for prompt injection in evidence content
        for res in results[:3]:
            content_lower = res.content.lower()
            if any(
                phrase in content_lower
                for phrase in (
                    "ignore previous instructions",
                    "bỏ qua hướng dẫn",
                    "system prompt",
                    "in ra token",
                    "developer message",
                )
            ):
                logger.warning("Prompt injection detected in context document chunk")
                return False, "incomplete_context"

        # 2. Check for truncated / abrupt chunk text in top result
        top_content = results[0].content.strip()
        if len(top_content) < 15:
            return False, "incomplete_context"
        if top_content.endswith("...") or re.search(r"(?:theo quy định tại|tại điều|khoản)\s*$", top_content, re.IGNORECASE):
            return False, "incomplete_context"

        # 3. Check for specific Article number requested in question
        normalized_question = self._ascii_text(question)
        article_match = re.search(r"\bdieu\s+(\d+[a-z]?)\b", normalized_question)
        if article_match:
            req_article = article_match.group(1)
            found_article = False
            for res in results[:4]:
                haystack = f"{res.content} {res.metadata.get('heading_path') or ''}".lower()
                normalized_haystack = self._ascii_text(haystack)
                if f"dieu {req_article}" in normalized_haystack or f"đầu {req_article}" in haystack:
                    found_article = True
                    break
            if not found_article:
                logger.info("Question requested Dieu %s but evidence does not contain it", req_article)
                return False, "incomplete_context"

        # A specific decision number must appear in the retrieved evidence.
        # Otherwise a similar regulation could confirm a false legal premise.
        decision_match = re.search(r"\bquyet\s+dinh\s+(\d{2,})\b", normalized_question)
        if decision_match:
            decision_number = decision_match.group(1)
            found_decision = any(
                re.search(
                    rf"(?<!\d){re.escape(decision_number)}(?!\d)",
                    self._ascii_text(
                        " ".join(
                            (
                                result.content,
                                str(result.metadata.get("heading_path") or ""),
                                str(result.metadata.get("source_file") or ""),
                            )
                        )
                    ),
                )
                for result in results[:4]
            )
            if not found_decision:
                return False, "incomplete_context"

        evidence_text = self._ascii_text(
            " ".join(
                " ".join(
                    (
                        result.content,
                        str(result.metadata.get("heading_path") or ""),
                        str(result.metadata.get("source_file") or ""),
                    )
                )
                for result in results[:4]
            )
        )
        if "phat tien" in normalized_question and "phat tien" not in evidence_text:
            return False, "incomplete_context"

        monetary_claims = re.findall(
            r"\b\d[\d.,]*\s*(?:dong|vnd|nghin|ngan|trieu)\b",
            normalized_question,
        )
        if monetary_claims and any(marker in normalized_question for marker in ("phat", "nop", "muc tien")):
            evidence_digits = re.sub(r"\D", "", evidence_text)
            for claim in monetary_claims:
                claim_digits = re.sub(r"\D", "", claim)
                if claim_digits and claim_digits not in evidence_digits:
                    return False, "incomplete_context"

        requested_years = {int(value) for value in re.findall(r"\b(?:19|20)\d{2}\b", normalized_question)}
        if requested_years and not all(str(year) in evidence_text for year in requested_years):
            return False, "incomplete_context"

        # 4. Check for is_current signal if metadata explicitly marks chunk inactive
        top_metadata = results[0].metadata
        if top_metadata.get("is_current") in (False, "false", "False") and not any(
            r.metadata.get("is_current") in (True, "true", "True") for r in results
        ):
            return False, "incomplete_context"

        return True, None

    def _confidence_threshold(self, results: list[RetrievalResult]) -> float:
        score_kind = str(results[0].raw.get("score_kind") or "vector")
        if "reranker_score_raw" in results[0].raw:
            return self.config.answer_min_reranker_confidence
        if score_kind == "hybrid_rrf":
            return self.config.answer_min_hybrid_confidence
        if score_kind == "fts_only":
            return getattr(self.config, "answer_min_fts_confidence", 0.30)
        return self.config.answer_min_vector_confidence

    @staticmethod
    def _validate_citations(answer: str, context_count: int) -> str:
        def _replace(match: re.Match[str]) -> str:
            index = int(match.group(1))
            if index < 1 or index > context_count:
                return ""
            return match.group(0)

        return re.sub(r"\[(\d+)\]", _replace, answer).strip()

    def _lexical_coverage(self, question: str, results: list[RetrievalResult]) -> float:
        question_tokens = self._content_tokens(question)
        if not question_tokens:
            return 1.0
        context_tokens: set[str] = set()
        for result in results[:3]:
            context_tokens.update(self._content_tokens(result.content))
            context_tokens.update(self._content_tokens(str(result.metadata.get("heading_path") or "")))
        return len(question_tokens & context_tokens) / len(question_tokens)

    @staticmethod
    def _phrase_hit(result: RetrievalResult, hint: QueryHint) -> bool:
        if not hint.aliases:
            return False
        haystack = " ".join(
            [
                result.content,
                str(result.metadata.get("heading_path") or ""),
                str(result.metadata.get("source_file") or ""),
            ]
        ).lower()
        return any(alias.lower() in haystack for alias in hint.aliases)

    @staticmethod
    def _content_tokens(text: str) -> set[str]:
        normalized = RagService._ascii_text(text)
        return {
            token
            for token in re.findall(r"[a-z0-9]+", normalized)
            if len(token) >= 3 and token not in {"cho", "cua", "khi", "hay", "the", "nao", "voi", "mot", "cac"}
        }

    @staticmethod
    def _ascii_text(text: str) -> str:
        # Vietnamese đ/Đ does not decompose under NFKD.
        text = text.replace("đ", "d").replace("Đ", "D")
        return unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii").lower()

    @staticmethod
    def _normalize_reranker_score(raw_score: float) -> float:
        return 1.0 / (1.0 + math.exp(-raw_score))

    def _contexts(self, results: list[RetrievalResult]) -> list[RagContext]:
        contexts: list[RagContext] = []
        for index, result in enumerate(results, start=1):
            raw = dict(result.raw)
            raw["distance"] = result.distance
            contexts.append(
                RagContext(
                    index=index,
                    content=result.content,
                    citation=citation_from_result(raw, index=index),
                    metadata=result.metadata,
                )
            )
        return contexts
