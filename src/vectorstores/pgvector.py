import json
from typing import Any

import psycopg
from psycopg.rows import dict_row

from src.chunking.fallback_chunker import TextChunk
from src.documents.loader import sha256_text
from src.documents.metadata import MarkdownDocument


class PgVectorStore:
    def __init__(self, database_url: str, schema: str = "rag", dimensions: int = 768) -> None:
        if not database_url:
            raise ValueError("DATABASE_URL is required for pgvector store")
        self.database_url = database_url
        self.schema = schema
        self.dimensions = dimensions

    def ensure_schema(self) -> None:
        schema = self._quoted_schema
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute("CREATE EXTENSION IF NOT EXISTS vector")
                cur.execute(f"CREATE SCHEMA IF NOT EXISTS {schema}")
                cur.execute(
                    f"""
                    CREATE TABLE IF NOT EXISTS {schema}.documents (
                        id BIGSERIAL PRIMARY KEY,
                        source_file TEXT NOT NULL,
                        source_path TEXT,
                        source_url TEXT,
                        source_unit TEXT,
                        source_type TEXT,
                        category TEXT,
                        level TEXT,
                        document_number TEXT,
                        issued_date DATE,
                        effective_date DATE,
                        is_current TEXT,
                        language TEXT,
                        sha256 TEXT NOT NULL UNIQUE,
                        content_hash TEXT NOT NULL,
                        page_count INTEGER,
                        extraction_method TEXT,
                        extraction_status TEXT,
                        metadata JSONB NOT NULL DEFAULT '{{}}'::jsonb,
                        chunk_count INTEGER NOT NULL DEFAULT 0,
                        last_ingested_at TIMESTAMPTZ NOT NULL DEFAULT now()
                    )
                    """
                )
                cur.execute(
                    f"""
                    CREATE TABLE IF NOT EXISTS {schema}.document_chunks (
                        id BIGSERIAL PRIMARY KEY,
                        document_id BIGINT NOT NULL REFERENCES {schema}.documents(id) ON DELETE CASCADE,
                        document_sha256 TEXT NOT NULL,
                        chunk_index INTEGER NOT NULL,
                        content TEXT NOT NULL,
                        content_hash TEXT NOT NULL,
                        heading_path TEXT,
                        parent_heading_path TEXT,
                        page_start INTEGER,
                        page_end INTEGER,
                        token_count INTEGER NOT NULL,
                        metadata JSONB NOT NULL DEFAULT '{{}}'::jsonb,
                        embedding vector({self.dimensions}) NOT NULL,
                        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                        UNIQUE (document_sha256, chunk_index, content_hash)
                    )
                    """
                )
                cur.execute(
                    f"""
                    CREATE TABLE IF NOT EXISTS {schema}.ingest_runs (
                        id BIGSERIAL PRIMARY KEY,
                        started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                        finished_at TIMESTAMPTZ,
                        status TEXT NOT NULL,
                        documents_seen INTEGER NOT NULL DEFAULT 0,
                        documents_indexed INTEGER NOT NULL DEFAULT 0,
                        chunks_indexed INTEGER NOT NULL DEFAULT 0,
                        errors JSONB NOT NULL DEFAULT '[]'::jsonb
                    )
                    """
                )
                cur.execute(
                    f"CREATE INDEX IF NOT EXISTS document_chunks_embedding_hnsw ON {schema}.document_chunks USING hnsw (embedding vector_cosine_ops)"
                )
                cur.execute(
                    f"CREATE INDEX IF NOT EXISTS document_chunks_metadata_gin ON {schema}.document_chunks USING gin (metadata)"
                )
                cur.execute(f"CREATE INDEX IF NOT EXISTS documents_source_unit_idx ON {schema}.documents (source_unit)")
                cur.execute(f"CREATE INDEX IF NOT EXISTS documents_category_idx ON {schema}.documents (category)")
                cur.execute(f"CREATE INDEX IF NOT EXISTS documents_issued_date_idx ON {schema}.documents (issued_date)")
            conn.commit()

    def ensure_fts_column(self) -> None:
        """One-time migration: add search_vector TSVECTOR generated column + GIN index.

        Safe to call multiple times (uses IF NOT EXISTS / ALTER IF NOT EXISTS).
        Vietnamese text uses the 'simple' dictionary (lowercase, no stemming),
        which is the best PostgreSQL can offer without an external extension.
        """
        schema = self._quoted_schema
        with self._connect() as conn:
            with conn.cursor() as cur:
                # Add column only if it doesn't exist yet
                cur.execute(
                    f"""
                    DO $$ BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = '{self.schema}'
                              AND table_name   = 'document_chunks'
                              AND column_name  = 'search_vector'
                        ) THEN
                            ALTER TABLE {schema}.document_chunks
                                ADD COLUMN search_vector tsvector
                                GENERATED ALWAYS AS (
                                    to_tsvector('simple', lower(coalesce(content, '')))
                                ) STORED;
                        END IF;
                    END $$;
                    """
                )
                cur.execute(
                    f"CREATE INDEX IF NOT EXISTS document_chunks_fts_gin ON {schema}.document_chunks USING GIN (search_vector)"
                )
            conn.commit()

    def create_ingest_run(self) -> int:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(f"INSERT INTO {self._quoted_schema}.ingest_runs (status) VALUES ('running') RETURNING id")
                run_id = cur.fetchone()[0]
            conn.commit()
            return int(run_id)

    def finish_ingest_run(self, run_id: int, status: str, documents_seen: int, documents_indexed: int, chunks_indexed: int, errors: list[dict]) -> None:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"""
                    UPDATE {self._quoted_schema}.ingest_runs
                    SET finished_at = now(),
                        status = %s,
                        documents_seen = %s,
                        documents_indexed = %s,
                        chunks_indexed = %s,
                        errors = %s::jsonb
                    WHERE id = %s
                    """,
                    (status, documents_seen, documents_indexed, chunks_indexed, json.dumps(errors, ensure_ascii=False), run_id),
                )
            conn.commit()

    def upsert_document(self, document: MarkdownDocument, chunk_count: int) -> int:
        metadata = document.metadata
        sha = metadata.sha256 or document.content_hash
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"""
                    INSERT INTO {self._quoted_schema}.documents (
                        source_file, source_path, source_url, source_unit, source_type,
                        category, level, document_number, issued_date, effective_date,
                        is_current, language, sha256, content_hash, page_count,
                        extraction_method, extraction_status, metadata, chunk_count, last_ingested_at
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NULLIF(%s, '')::date, NULLIF(%s, '')::date,
                            %s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s, now())
                    ON CONFLICT (sha256) DO UPDATE SET
                        content_hash = EXCLUDED.content_hash,
                        metadata = EXCLUDED.metadata,
                        chunk_count = EXCLUDED.chunk_count,
                        last_ingested_at = now()
                    RETURNING id
                    """,
                    (
                        metadata.source_file,
                        metadata.source_path,
                        metadata.source_url,
                        metadata.source_unit,
                        metadata.source_type,
                        metadata.category,
                        metadata.level,
                        metadata.document_number,
                        metadata.issued_date or "",
                        metadata.effective_date or "",
                        str(metadata.is_current) if metadata.is_current is not None else None,
                        metadata.language,
                        sha,
                        document.content_hash,
                        metadata.page_count,
                        metadata.extraction_method,
                        metadata.extraction_status,
                        json.dumps(metadata.raw, ensure_ascii=False, default=str),
                        chunk_count,
                    ),
                )
                document_id = cur.fetchone()[0]
            conn.commit()
            return int(document_id)

    def existing_chunk_hashes(self, document_sha256: str) -> set[str]:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT content_hash FROM {self._quoted_schema}.document_chunks WHERE document_sha256 = %s",
                    (document_sha256,),
                )
                return {row[0] for row in cur.fetchall()}

    def upsert_chunks(self, document_id: int, document_sha256: str, chunks: list[TextChunk], embeddings: list[list[float]]) -> int:
        if len(chunks) != len(embeddings):
            raise ValueError("chunks and embeddings length mismatch")

        inserted = 0
        with self._connect() as conn:
            with conn.cursor() as cur:
                for index, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                    content_hash = sha256_text(chunk.content)
                    metadata = dict(chunk.metadata)
                    metadata.update(
                        {
                            "heading_path": chunk.heading_path,
                            "parent_heading_path": chunk.parent_heading_path,
                            "page_start": chunk.page_start,
                            "page_end": chunk.page_end,
                        }
                    )
                    cur.execute(
                        f"""
                        INSERT INTO {self._quoted_schema}.document_chunks (
                            document_id, document_sha256, chunk_index, content, content_hash,
                            heading_path, parent_heading_path, page_start, page_end,
                            token_count, metadata, embedding
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s::vector)
                        ON CONFLICT (document_sha256, chunk_index, content_hash) DO NOTHING
                        """,
                        (
                            document_id,
                            document_sha256,
                            index,
                            chunk.content,
                            content_hash,
                            chunk.heading_path,
                            chunk.parent_heading_path,
                            chunk.page_start,
                            chunk.page_end,
                            chunk.token_count,
                            json.dumps(metadata, ensure_ascii=False, default=str),
                            self._vector_literal(embedding),
                        ),
                    )
                    inserted += cur.rowcount
            conn.commit()
        return inserted

    def status(self) -> dict[str, Any]:
        with self._connect(row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute(f"SELECT count(*) AS documents FROM {self._quoted_schema}.documents")
                documents = cur.fetchone()["documents"]
                cur.execute(f"SELECT count(*) AS chunks FROM {self._quoted_schema}.document_chunks")
                chunks = cur.fetchone()["chunks"]
                cur.execute(
                    f"SELECT * FROM {self._quoted_schema}.ingest_runs ORDER BY id DESC LIMIT 1"
                )
                last_run = cur.fetchone()
        return {"documents": documents, "chunks": chunks, "last_run": last_run}

    def search(self, query_vector: list[float], filters: dict | None = None, limit: int = 8) -> list[dict]:
        """Legacy single-mode vector search – kept for backwards compatibility."""
        return self.vector_search(query_vector, filters=filters, limit=limit)

    def vector_search(
        self,
        query_vector: list[float],
        filters: dict | None = None,
        limit: int = 30,
        filter_current: bool = False,
    ) -> list[dict]:
        """Cosine-distance vector search using the HNSW index.

        Args:
            query_vector:   Embedding of the user question.
            filters:        Optional metadata key→value equality filters
                            (applied via JSONB ->> operator).
            limit:          Maximum rows to return (candidate pool size).
            filter_current: When True, only return chunks whose parent document
                            has is_current = 'true'.
        """
        clauses: list[str] = []
        params: list[Any] = [self._vector_literal(query_vector)]

        if filter_current:
            clauses.append("(d.is_current IS NULL OR lower(d.is_current) <> 'false')")

        if filters:
            for key, value in filters.items():
                clauses.append("c.metadata ->> %s = %s")
                params.extend([key, str(value)])

        where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
        params.append(limit)

        with self._connect(row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"""
                    SELECT c.id, c.document_id, c.content, c.heading_path, c.parent_heading_path,
                           c.page_start, c.page_end, c.metadata,
                           d.source_file, d.source_path, d.source_url, d.source_unit,
                           d.category, d.document_number, d.issued_date, d.effective_date,
                           d.is_current,
                           c.embedding <=> %s::vector AS distance
                    FROM {self._quoted_schema}.document_chunks c
                    JOIN {self._quoted_schema}.documents d ON d.id = c.document_id
                    {where}
                    ORDER BY c.embedding <=> %s::vector
                    LIMIT %s
                    """,
                    [params[0], *params[1:-1], params[0], params[-1]],
                )
                return list(cur.fetchall())

    def keyword_search(
        self,
        query: str,
        filters: dict | None = None,
        limit: int = 30,
        filter_current: bool = False,
    ) -> list[dict]:
        """Full-text keyword search using PostgreSQL tsvector (simple config).

        Uses ``websearch_to_tsquery('simple', ...)`` which handles quoted phrases,
        OR, and NOT operators similarly to a web search box.  The 'simple'
        dictionary lowercases tokens without stemming, which is the most
        reliable option for Vietnamese text in stock PostgreSQL.

        Requires the search_vector column to exist (call ensure_fts_column first).
        """
        clauses: list[str] = ["c.search_vector @@ websearch_to_tsquery('simple', %s)"]
        params: list[Any] = [query]

        if filter_current:
            clauses.append("(d.is_current IS NULL OR lower(d.is_current) <> 'false')")

        if filters:
            for key, value in filters.items():
                clauses.append("c.metadata ->> %s = %s")
                params.extend([key, str(value)])

        where = f"WHERE {' AND '.join(clauses)}"
        params.append(limit)

        with self._connect(row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"""
                    SELECT c.id, c.document_id, c.content, c.heading_path, c.parent_heading_path,
                           c.page_start, c.page_end, c.metadata,
                           d.source_file, d.source_path, d.source_url, d.source_unit,
                           d.category, d.document_number, d.issued_date, d.effective_date,
                           d.is_current,
                           ts_rank_cd(c.search_vector, websearch_to_tsquery('simple', %s)) AS ts_rank
                    FROM {self._quoted_schema}.document_chunks c
                    JOIN {self._quoted_schema}.documents d ON d.id = c.document_id
                    {where}
                    ORDER BY ts_rank DESC
                    LIMIT %s
                    """,
                    [query, *params[1:-1], query, params[-1]],
                )
                return list(cur.fetchall())

    def fetch_sibling_chunks(
        self,
        document_id: int,
        heading_path: str | None,
        exclude_chunk_id: int | None = None,
        limit: int = 4,
    ) -> list[dict]:
        """Return chunks from the same document that share the same heading_path.

        Used for parent-child retrieval: after finding a child chunk, fetch its
        siblings to provide fuller legal/regulatory context to the LLM.
        """
        if not heading_path:
            return []

        params: list[Any] = [document_id, heading_path]
        exclude_clause = ""
        if exclude_chunk_id is not None:
            exclude_clause = "AND c.id != %s"
            params.append(exclude_chunk_id)
        params.append(limit)

        with self._connect(row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"""
                    SELECT c.id, c.document_id, c.content, c.heading_path, c.parent_heading_path,
                           c.page_start, c.page_end, c.metadata,
                           d.source_file, d.source_path, d.source_url, d.source_unit,
                           d.category, d.document_number, d.issued_date, d.effective_date
                    FROM {self._quoted_schema}.document_chunks c
                    JOIN {self._quoted_schema}.documents d ON d.id = c.document_id
                    WHERE c.document_id = %s
                      AND c.heading_path = %s
                      {exclude_clause}
                    ORDER BY c.chunk_index
                    LIMIT %s
                    """,
                    params,
                )
                return list(cur.fetchall())

    def _connect(self, **kwargs):
        return psycopg.connect(self.database_url, **kwargs)

    @property
    def _quoted_schema(self) -> str:
        if not self.schema.replace("_", "").isalnum():
            raise ValueError("RAG_DB_SCHEMA must be alphanumeric/underscore only")
        return f'"{self.schema}"'

    def _vector_literal(self, vector: list[float]) -> str:
        if len(vector) != self.dimensions:
            raise ValueError(f"Embedding dimension mismatch: expected {self.dimensions}, got {len(vector)}")
        return "[" + ",".join(str(float(value)) for value in vector) + "]"
