from src.chunking.fallback_chunker import FallbackChunker
from src.chunking.structure_chunker import StructureChunker


class FakeEmbedder:
    dimensions = 3

    def embed(self, texts):
        return [[1.0, 0.0, 0.0] for _ in texts]


def test_structure_chunker_keeps_legal_heading_and_page():
    markdown = """
<!-- page: 3 -->
Chương I
NHỮNG QUY ĐỊNH CHUNG

Điều 15. Điều kiện dự thi
1. Sinh viên được dự thi khi hoàn thành học phần.
2. Sinh viên không được dự thi nếu vắng quá số buổi.
"""

    chunks = StructureChunker(max_tokens=80).chunk(markdown, metadata={"category": "exam_regulation"})

    assert chunks
    assert any("Điều 15" in (chunk.heading_path or "") for chunk in chunks)
    assert all(chunk.page_start == 3 for chunk in chunks if "Điều 15" in (chunk.heading_path or ""))


def test_fallback_semantic_chunk_groups_similar_sentences():
    text = "Sinh viên nộp hồ sơ đúng hạn. Sinh viên bổ sung giấy tờ nếu thiếu. Câu cuối cùng."

    chunks = FallbackChunker(max_tokens=80).semantic_chunk(text, FakeEmbedder())

    assert len(chunks) == 1
    assert "nộp hồ sơ" in chunks[0].content


def test_fallback_token_overlap_for_long_text():
    text = " ".join(f"word{i}" for i in range(120))

    chunks = FallbackChunker(max_tokens=30, overlap_tokens=10).chunk(text)

    assert len(chunks) > 1
    assert all(chunk.token_count <= 35 for chunk in chunks)
