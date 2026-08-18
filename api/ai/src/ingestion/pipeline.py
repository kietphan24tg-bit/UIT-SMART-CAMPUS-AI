from dataclasses import dataclass, field
from pathlib import Path

from src.chunking.fallback_chunker import FallbackChunker, TextChunk
from src.chunking.structure_chunker import StructureChunker
from src.core.config import Settings, settings
from src.documents.loader import iter_manifest_markdown_files, load_markdown_document, sha256_text
from src.documents.metadata import MarkdownDocument
from src.embeddings.provider import EmbeddingProvider, create_embedding_provider
from src.vectorstores.pgvector import PgVectorStore


REGULATION_CATEGORIES = {"training_regulation", "exam_regulation", "student_affairs", "regulation"}
SEMANTIC_CATEGORIES = {"handbook", "faq", "learning_outcome"}


@dataclass
class IngestionResult:
    documents_seen: int = 0
    documents_indexed: int = 0
    chunks_indexed: int = 0
    errors: list[dict] = field(default_factory=list)


class IngestionPipeline:
    def __init__(
        self,
        config: Settings = settings,
        embedder: EmbeddingProvider | None = None,
        vector_store: PgVectorStore | None = None,
    ) -> None:
        self.config = config
        self.embedder = embedder or create_embedding_provider(config)
        self.vector_store = vector_store or PgVectorStore(
            database_url=config.database_url or "",
            schema=config.rag_db_schema,
            dimensions=config.embedding_dimensions,
        )
        self.structure_chunker = StructureChunker(
            max_tokens=config.chunk_max_tokens,
            overlap_tokens=config.chunk_overlap_tokens,
        )
        self.fallback_chunker = FallbackChunker(
            max_tokens=config.chunk_max_tokens,
            overlap_tokens=config.chunk_overlap_tokens,
        )

    def rebuild(self) -> IngestionResult:
        self.vector_store.ensure_schema()
        run_id = self.vector_store.create_ingest_run()
        result = IngestionResult()

        try:
            for path in iter_manifest_markdown_files(Path(self.config.documents_dir)):
                result.documents_seen += 1
                try:
                    indexed = self.index_file(path, ensure_schema=False)
                    result.documents_indexed += 1
                    result.chunks_indexed += indexed
                except Exception as exc:
                    result.errors.append({"path": str(path), "error": str(exc)})

            status = "completed_with_errors" if result.errors else "completed"
            self.vector_store.finish_ingest_run(
                run_id,
                status,
                result.documents_seen,
                result.documents_indexed,
                result.chunks_indexed,
                result.errors,
            )
            return result
        except Exception:
            self.vector_store.finish_ingest_run(
                run_id,
                "failed",
                result.documents_seen,
                result.documents_indexed,
                result.chunks_indexed,
                result.errors,
            )
            raise

    def index_file(self, path: Path | str, ensure_schema: bool = True) -> int:
        if ensure_schema:
            self.vector_store.ensure_schema()

        document = load_markdown_document(Path(path))
        chunks = self._chunk_document(document)
        document_sha = document.metadata.sha256 or document.content_hash
        existing_hashes = self.vector_store.existing_chunk_hashes(document_sha)
        new_chunks = [chunk for chunk in chunks if sha256_text(chunk.content) not in existing_hashes]
        document_id = self.vector_store.upsert_document(document, chunk_count=len(chunks))
        if not new_chunks:
            return 0

        embeddings = self.embedder.embed([self._content_for_embedding(chunk) for chunk in new_chunks])
        return self.vector_store.upsert_chunks(document_id, document_sha, new_chunks, embeddings)

    def status(self) -> dict:
        self.vector_store.ensure_schema()
        return self.vector_store.status()

    def _chunk_document(self, document: MarkdownDocument) -> list[TextChunk]:
        metadata = self._chunk_metadata(document)
        category = document.metadata.category
        extraction_method = document.metadata.extraction_method or ""
        is_noisy_ocr = extraction_method in {"tesseract_ocr", "rapidocr"}

        structure_chunks = self.structure_chunker.chunk(document.body, metadata=metadata)
        if structure_chunks and (category in REGULATION_CATEGORIES or not is_noisy_ocr):
            return structure_chunks

        if category in SEMANTIC_CATEGORIES and not structure_chunks and self.config.enable_semantic_chunking:
            chunks = self.fallback_chunker.semantic_chunk(document.body, self.embedder, metadata={**metadata, "chunking_strategy": "semantic_fallback"})
            return chunks

        if structure_chunks:
            return structure_chunks

        fallback_strategy = "paragraph_sentence_fallback"
        if category in SEMANTIC_CATEGORIES and not self.config.enable_semantic_chunking:
            fallback_strategy = "semantic_disabled_paragraph_sentence_fallback"
        return self.fallback_chunker.chunk(document.body, metadata={**metadata, "chunking_strategy": fallback_strategy})

    def _chunk_metadata(self, document: MarkdownDocument) -> dict:
        metadata = document.metadata
        return {
            "source_file": metadata.source_file,
            "source_path": metadata.source_path,
            "source_url": metadata.source_url,
            "source_unit": metadata.source_unit,
            "source_type": metadata.source_type,
            "category": metadata.category,
            "level": metadata.level,
            "document_number": metadata.document_number,
            "issued_date": metadata.issued_date,
            "effective_date": metadata.effective_date,
            "is_current": metadata.is_current,
            "language": metadata.language,
            "sha256": metadata.sha256,
            "extraction_method": metadata.extraction_method,
            "extraction_status": metadata.extraction_status,
        }

    def _content_for_embedding(self, chunk: TextChunk) -> str:
        prefix = " | ".join(
            value
            for value in [
                chunk.metadata.get("source_unit"),
                chunk.metadata.get("category"),
                chunk.heading_path,
            ]
            if value
        )
        return f"{prefix}\n\n{chunk.content}" if prefix else chunk.content
