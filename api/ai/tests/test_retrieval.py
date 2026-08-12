from src.retrieval.citations import format_citations, score_from_distance
from src.retrieval.retriever import Retriever


class FakeEmbedder:
    dimensions = 3

    def embed(self, texts):
        return [[0.1, 0.2, 0.3] for _ in texts]


class FakeStore:
    def __init__(self):
        self.calls = []

    def search(self, query_vector, filters=None, limit=8):
        self.calls.append({"query_vector": query_vector, "filters": filters, "limit": limit})
        return [
            {
                "content": "Nội dung",
                "metadata": {"source_file": "a.pdf"},
                "distance": 0.25,
            },
            {
                "content": "Xa quá",
                "metadata": {"source_file": "b.pdf"},
                "distance": 0.95,
            },
        ]


def test_retriever_embeds_question_and_filters_by_score():
    store = FakeStore()
    retriever = Retriever(embedder=FakeEmbedder(), vector_store=store)

    results = retriever.retrieve("điều kiện dự thi", filters={"category": "exam"}, top_k=5, min_score=0.2)

    assert len(results) == 1
    assert results[0].score == 0.75
    assert store.calls[0]["limit"] == 5
    assert store.calls[0]["filters"] == {"category": "exam"}


def test_format_citations_deduplicates_sources():
    rows = [
        {"source_file": "a.pdf", "heading_path": "Điều 1", "page_start": 1, "page_end": 1, "distance": 0.2},
        {"source_file": "a.pdf", "heading_path": "Điều 1", "page_start": 1, "page_end": 1, "distance": 0.2},
    ]

    citations = format_citations(rows)

    assert len(citations) == 1
    assert citations[0].score == score_from_distance(0.2)
