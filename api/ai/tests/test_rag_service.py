from src.rag.prompts import build_user_prompt
from src.rag.service import RagService
from src.retrieval.retriever import RetrievalResult


class FakeRetriever:
    def __init__(self, results):
        self.results = results
        self.calls = []

    def retrieve(self, question, filters=None, top_k=8, min_score=0.15):
        self.calls.append(
            {
                "question": question,
                "filters": filters,
                "top_k": top_k,
                "min_score": min_score,
            }
        )
        return self.results


class FakeLlm:
    def __init__(self):
        self.calls = []

    def chat(self, system_prompt, user_prompt):
        self.calls.append({"system": system_prompt, "user": user_prompt})
        return "Sinh viên cần xem điều kiện trong nguồn [1]."


def _result():
    raw = {
        "content": "Điều 5. Sinh viên được dự thi khi đủ điều kiện.",
        "metadata": {
            "source_file": "quy-che-thi.pdf",
            "source_unit": "DAA",
            "category": "exam",
            "heading_path": "Chương II > Điều 5",
            "page_start": 3,
            "page_end": 3,
        },
        "source_file": "quy-che-thi.pdf",
        "source_unit": "DAA",
        "category": "exam",
        "heading_path": "Chương II > Điều 5",
        "parent_heading_path": "Chương II",
        "page_start": 3,
        "page_end": 3,
        "distance": 0.2,
    }
    return RetrievalResult(
        content=raw["content"],
        metadata=raw["metadata"],
        distance=0.2,
        score=0.8,
        raw=raw,
    )


def test_rag_service_returns_fallback_without_context():
    llm = FakeLlm()
    service = RagService(retriever=FakeRetriever([]), llm_client=llm)

    response = service.answer("Câu hỏi ngoài phạm vi")

    assert response.answer_type == "fallback"
    assert response.retrieved_count == 0
    assert llm.calls == []


def test_rag_service_calls_llm_and_formats_citations():
    llm = FakeLlm()
    retriever = FakeRetriever([_result()])
    service = RagService(retriever=retriever, llm_client=llm)

    response = service.answer("Điều kiện dự thi là gì?", top_k=3, include_context=True)

    assert response.answer_type == "knowledge"
    assert response.retrieved_count == 1
    assert response.confidence == 0.8
    assert response.citations[0].source_file == "quy-che-thi.pdf"
    assert response.contexts and response.contexts[0].index == 1
    assert "[1]" in llm.calls[0]["user"]
    assert retriever.calls[0]["top_k"] == 3


def test_prompt_builder_includes_source_number_and_question():
    prompt = build_user_prompt("Hỏi gì?", [_result()])

    assert "[1]" in prompt
    assert "QUESTION:" in prompt
    assert "Hỏi gì?" in prompt
