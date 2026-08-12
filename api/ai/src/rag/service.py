from dataclasses import dataclass

import httpx

from src.api.schemas import Citation, RagContext, RagQueryResponse
from src.core.config import Settings, settings
from src.rag.prompts import RAG_SYSTEM_PROMPT, build_user_prompt
from src.retrieval.citations import citation_from_result, format_citations
from src.retrieval.retriever import RetrievalResult, Retriever


GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions"


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


class RagService:
    def __init__(
        self,
        config: Settings = settings,
        retriever: Retriever | None = None,
        llm_client: GroqClient | None = None,
    ) -> None:
        self.config = config
        self.retriever = retriever or Retriever(config=config)
        self.llm_client = llm_client or GroqClient(
            api_key=config.groq_key or "",
            model=config.llm_model,
        )

    def answer(
        self,
        question: str,
        filters: dict | None = None,
        top_k: int = 8,
        min_score: float = 0.15,
        include_context: bool = False,
    ) -> RagQueryResponse:
        results = self.retriever.retrieve(
            question=question,
            filters=filters,
            top_k=top_k,
            min_score=min_score,
        )
        if not results:
            return RagQueryResponse(
                answer=(
                    "Mình chưa chắc chắn về câu trả lời cho phần này nên không muốn đưa ra thông tin "
                    "có thể sai. Nếu đây là vấn đề quan trọng liên quan đến học vụ, thi cử, chuẩn đầu ra "
                    "hoặc thủ tục sinh viên, bạn nên kiểm tra thêm từ kênh thông báo chính thức hoặc "
                    "liên hệ đơn vị phụ trách để có câu trả lời chính xác nhất."
                ),
                citations=[],
                confidence=0.0,
                retrieved_count=0,
                answer_type="fallback",
                contexts=[] if include_context else None,
            )

        answer = self.llm_client.chat(
            system_prompt=RAG_SYSTEM_PROMPT,
            user_prompt=build_user_prompt(question, results),
        )
        citations = format_citations([result.raw for result in results])
        contexts = self._contexts(results) if include_context else None
        return RagQueryResponse(
            answer=answer,
            citations=citations,
            confidence=max(result.score for result in results),
            retrieved_count=len(results),
            answer_type="knowledge",
            contexts=contexts,
        )

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
