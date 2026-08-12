from typing import Protocol

from src.chunking.fallback_chunker import TextChunk
from src.documents.metadata import MarkdownDocument


class VectorStore(Protocol):
    def ensure_schema(self) -> None:
        ...

    def upsert_document(self, document: MarkdownDocument, chunk_count: int) -> int:
        ...

    def existing_chunk_hashes(self, document_sha256: str) -> set[str]:
        ...

    def upsert_chunks(self, document_id: int, document_sha256: str, chunks: list[TextChunk], embeddings: list[list[float]]) -> int:
        ...

    def status(self) -> dict:
        ...

    def search(self, query_vector: list[float], filters: dict | None = None):
        ...
