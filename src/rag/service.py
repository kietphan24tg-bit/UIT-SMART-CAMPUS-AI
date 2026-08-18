"""RAG generation service.

Pipeline
--------
Question
  → HybridRetriever  (vector + keyword → RRF → candidate_k chunks)
  → Reranker?        (optional cross-encoder, enabled via RERANKER_ENABLED=true)
  → Answer gate      (drop to fallback if top score < answer_min_confidence)
  → GroqClient       (LLM generates answer with mandatory [N] citations)
  → Citation check   (verify cited indices exist in context)
"""

from __future__ import annotations

import logging
import re
import unicodedata
from dataclasses import dataclass

import httpx

from src.api.schemas import Citation, RagContext, RagQueryResponse
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


# ---------------------------------------------------------------------------
# Groq HTTP client
# ---------------------------------------------------------------------------


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


# ---------------------------------------------------------------------------
# RAG service
# ---------------------------------------------------------------------------


class RagService:
    """Orchestrates the full RAG pipeline.

    Dependency injection allows easy swapping of components in tests:

        service = RagService(
            retriever=MockRetriever(),
            reranker=None,
            llm_client=MockGroq(),
        )
    """

    def __init__(
        self,
        config: Settings = settings,
        retriever: HybridRetriever | None = None,
        reranker: Reranker | None = None,
        llm_client: GroqClient | None = None,
    ) -> None:
        self.config = config
        self.retriever = retriever or HybridRetriever(config=config)
        self.reranker = reranker if reranker is not None else create_reranker(config)
        self.llm_client = llm_client or GroqClient(
            api_key=config.groq_key or "",
            model=config.llm_model,
        )

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def answer(
        self,
        question: str,
        filters: dict | None = None,
        top_k: int | None = None,
        min_score: float | None = None,
        include_context: bool = False,
    ) -> RagQueryResponse:
        """Full RAG pipeline: retrieve → (rerank) → gate → generate.

        Args:
            question:        User question in Vietnamese.
            filters:         Optional metadata filters forwarded to the retriever.
            top_k:           Override for final chunk count (default from config).
            min_score:       Override for minimum retrieval score (default from config).
            include_context: Include raw chunk context in the response (debug).

        Returns:
            ``RagQueryResponse`` with answer_type="knowledge" or "fallback".
        """
        _top_k = top_k if top_k is not None else self.config.rag_top_k
        _min_score = min_score if min_score is not None else self.config.retrieval_min_score

        # 1. Hybrid retrieval (vector + keyword RRF)
        candidates = self.retriever.retrieve(
            question=question,
            filters=filters,
            candidate_k=self.config.retrieval_candidate_k,
            top_k=_top_k if self.reranker is None else self.config.retrieval_candidate_k,
            min_score=_min_score if self.reranker is None else 0.0,
        )

        if not candidates:
            logger.debug("No candidates retrieved for question: %r", question[:80])
            return self._fallback_response(include_context=include_context)

        # 2. Optional re-ranking
        if self.reranker is not None:
            results = self.reranker.rerank(question, candidates, top_k=_top_k)
            # Apply min_score AFTER reranking (logit scale, different from cosine score)
            results = [r for r in results if r.score >= self.config.reranker_min_score]
        else:
            results = candidates[:_top_k]

        if not results:
            logger.debug("All candidates dropped after reranking/min_score gate.")
            return self._fallback_response(include_context=include_context)

        # 3. Answer confidence gate — check top chunk score
        top_score = results[0].score
        if top_score < self.config.answer_min_confidence:
            logger.info(
                "Top chunk score %.3f < threshold %.3f → fallback",
                top_score,
                self.config.answer_min_confidence,
            )
            return self._fallback_response(include_context=include_context)

        # 4. Generate answer via Groq
        answer_text = self.llm_client.chat(
            system_prompt=RAG_SYSTEM_PROMPT,
            user_prompt=build_user_prompt(question, results),
        )

        # 5. Citation validation: ensure all [N] in answer point to real chunks
        answer_text = self._validate_citations(answer_text, len(results))

        citations = format_citations([r.raw for r in results])
        contexts = self._contexts(results) if include_context else None

        return RagQueryResponse(
            answer=answer_text,
            citations=citations,
            confidence=round(top_score, 4),
            retrieved_count=len(results),
            answer_type="knowledge",
            contexts=contexts,
        )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

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
    def _validate_citations(answer: str, context_count: int) -> str:
        """Remove citation references [N] that exceed available context chunks.

        Prevents the LLM from hallucinating references to non-existent sources.
        """
        def _replace(match: re.Match) -> str:
            index = int(match.group(1))
            if index < 1 or index > context_count:
                return ""  # strip invalid citation
            return match.group(0)

        return re.sub(r"\[(\d+)\]", _replace, answer).strip()

    def _contexts(self, results: list[RetrievalResult]) -> list[RagContext]:
        contexts: list[RagContext] = []
        for index, result in enumerate(results, start=1):
            raw = dict(result.raw)
            raw["distance"] = result.distance
            citation: Citation = citation_from_result(raw)
            contexts.append(
                RagContext(
                    index=index,
                    content=result.content,
                    citation=citation,
                    metadata=result.metadata,
                )
            )
        return contexts
