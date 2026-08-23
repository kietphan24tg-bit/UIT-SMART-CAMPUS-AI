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
import re
import unicodedata
from dataclasses import dataclass

import httpx

from src.api.schemas import Citation, RagContext, RagEvidenceResponse, RagQueryResponse
from src.core.config import Settings, settings
from src.rag.prompts import RAG_SYSTEM_PROMPT, build_user_prompt
from src.reranking.base import Reranker
from src.reranking.provider import create_reranker
from src.retrieval.citations import citation_from_result, format_citations
from src.retrieval.hybrid_retriever import HybridRetriever
from src.retrieval.retriever import RetrievalResult

logger = logging.getLogger(__name__)

GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions"

FALLBACK_ANSWER = (
    "Mình chưa chắc chắn về câu trả lời cho phần này nên không muốn đưa ra "
    "thông tin có thể sai. Nếu đây là vấn đề quan trọng liên quan đến học vụ, "
    "thi cử, chuẩn đầu ra hoặc thủ tục sinh viên, bạn nên kiểm tra thêm từ "
    "kênh thông báo chính thức hoặc liên hệ đơn vị phụ trách để có câu trả lời "
    "chính xác nhất."
)


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


@dataclass(slots=True)
class RetrievedEvidence:
    found: bool
    confidence: float
    retrieved_count: int
    contexts: list[RagContext]
    citations: list[Citation]
    results: list[RetrievalResult]

    def to_response(self) -> RagEvidenceResponse:
        return RagEvidenceResponse(
            found=self.found,
            citations=self.citations,
            confidence=round(self.confidence, 4),
            retrieved_count=self.retrieved_count,
            contexts=self.contexts,
        )


class RagService:
    """Orchestrates the full RAG pipeline."""

    def __init__(
        self,
        config: Settings = settings,
        retriever: HybridRetriever | None = None,
        reranker: Reranker | None = None,
        llm_client: GroqClient | None = None,
    ) -> None:
        self.config = config
        self.retriever = retriever or HybridRetriever(config=config)
        if reranker is not None:
            self.reranker = reranker
        elif retriever is None:
            self.reranker = create_reranker(config)
        else:
            self.reranker = None
        self.llm_client = llm_client or GroqClient(
            api_key=config.groq_key or "",
            model=config.llm_model,
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
            return self._fallback_response(include_context=include_context)

        answer_text = self.llm_client.chat(
            system_prompt=RAG_SYSTEM_PROMPT,
            user_prompt=build_user_prompt(question, evidence.results),
        )
        answer_text = self._validate_citations(answer_text, len(evidence.contexts))

        return RagQueryResponse(
            answer=answer_text,
            citations=format_citations([result.raw for result in evidence.results]),
            confidence=round(evidence.confidence, 4),
            retrieved_count=evidence.retrieved_count,
            answer_type="knowledge",
            contexts=evidence.contexts if include_context else None,
        )

    def retrieve_evidence(
        self,
        question: str,
        filters: dict | None = None,
        top_k: int | None = None,
        min_score: float | None = None,
    ) -> RetrievedEvidence:
        top_limit = top_k if top_k is not None else self.config.rag_top_k
        score_limit = min_score if min_score is not None else self.config.retrieval_min_score

        candidates = self._retrieve_candidates(question, filters, top_limit, score_limit)
        if not candidates:
            logger.debug("No candidates retrieved for question: %r", question[:80])
            return self._empty_evidence()

        if self.reranker is not None:
            results = self.reranker.rerank(question, candidates, top_k=top_limit)
            results = [result for result in results if result.score >= self.config.reranker_min_score]
        else:
            results = candidates[:top_limit]

        if not results:
            logger.debug("All candidates dropped after reranking/min_score gate.")
            return self._empty_evidence()

        top_score = results[0].score
        if top_score < self.config.answer_min_confidence:
            logger.info(
                "Top chunk score %.3f < threshold %.3f -> fallback",
                top_score,
                self.config.answer_min_confidence,
            )
            return self._empty_evidence()

        if not self._has_support_overlap(question, results):
            logger.info("Retrieved chunks have weak lexical overlap with question -> fallback")
            return self._empty_evidence()

        contexts = self._contexts(results)
        return RetrievedEvidence(
            found=True,
            confidence=top_score,
            retrieved_count=len(results),
            contexts=contexts,
            citations=[context.citation for context in contexts],
            results=results,
        )

    def _fallback_response(self, include_context: bool) -> RagQueryResponse:
        return RagQueryResponse(
            answer=FALLBACK_ANSWER,
            citations=[],
            confidence=0.0,
            retrieved_count=0,
            answer_type="fallback",
            contexts=[] if include_context else None,
        )

    @staticmethod
    def _empty_evidence() -> RetrievedEvidence:
        return RetrievedEvidence(
            found=False,
            confidence=0.0,
            retrieved_count=0,
            contexts=[],
            citations=[],
            results=[],
        )

    def _retrieve_candidates(
        self,
        question: str,
        filters: dict | None,
        top_k: int,
        min_score: float,
    ) -> list[RetrievalResult]:
        try:
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

    @staticmethod
    def _validate_citations(answer: str, context_count: int) -> str:
        def _replace(match: re.Match[str]) -> str:
            index = int(match.group(1))
            if index < 1 or index > context_count:
                return ""
            return match.group(0)

        return re.sub(r"\[(\d+)\]", _replace, answer).strip()

    @staticmethod
    def _has_support_overlap(question: str, results: list[RetrievalResult]) -> bool:
        question_tokens = RagService._content_tokens(question)
        if not question_tokens:
            return True

        context_tokens: set[str] = set()
        for result in results:
            context_tokens.update(RagService._content_tokens(result.content))

        return len(question_tokens & context_tokens) > 0

    @staticmethod
    def _content_tokens(text: str) -> set[str]:
        normalized = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii").lower()
        return {
            token
            for token in re.findall(r"[a-z0-9]+", normalized)
            if len(token) >= 3 and token not in {"cho", "cua", "khi", "hay", "the", "nao", "voi", "mot", "cac"}
        }

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
