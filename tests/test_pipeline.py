from pathlib import Path

from src.ingestion.pipeline import IngestionPipeline


class FakeEmbedder:
    dimensions = 4

    def __init__(self):
        self.calls = 0

    def embed(self, texts):
        self.calls += 1
        return [[float(len(text)), 0.0, 0.0, 0.0] for text in texts]


class FakeStore:
    def __init__(self):
        self.existing = set()
        self.upserted = []

    def ensure_schema(self):
        pass

    def existing_chunk_hashes(self, document_sha256):
        return self.existing

    def upsert_document(self, document, chunk_count):
        return 1

    def upsert_chunks(self, document_id, document_sha256, chunks, embeddings):
        self.upserted.extend(chunks)
        return len(chunks)


def test_index_file_chunks_embeds_and_stores(tmp_path):
    path = tmp_path / "doc.md"
    path.write_text(
        "---\nsource_file: doc.pdf\nsource_unit: DAA\ncategory: exam_regulation\nextraction_status: ok\nsha256: abc\n---\nĐiều 1. Quy định chung\nSinh viên làm bài thi nghiêm túc.",
        encoding="utf-8",
    )
    embedder = FakeEmbedder()
    store = FakeStore()
    pipeline = IngestionPipeline(embedder=embedder, vector_store=store)

    inserted = pipeline.index_file(Path(path))

    assert inserted == 1
    assert embedder.calls == 1
    assert store.upserted[0].heading_path.startswith("Điều 1")
