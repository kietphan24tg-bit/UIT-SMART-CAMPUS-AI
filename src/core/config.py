from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = "development"
    ai_service_host: str = "0.0.0.0"
    ai_service_port: int = 8000
    ai_root_path: str = ""

    documents_dir: str = "D:/Workspace/UIT-document-normalized"
    database_url: str | None = None
    rag_db_schema: str = "rag"

    embedding_provider: str = "gemini"
    embedding_model: str = "gemini-embedding-001"
    embedding_dimensions: int = 768
    embedding_batch_size: int = 32
    embedding_request_delay_seconds: float = 0.7
    embedding_device: str | None = None
    local_embedding_query_prefix: str = "query: "
    local_embedding_document_prefix: str = "passage: "
    gemini_max_retries: int = 8
    gemini_key: str | None = Field(default=None, validation_alias="GEMINI_KEY")

    llm_provider: str = "groq"
    llm_model: str = "llama-3.1-8b-instant"
    groq_key: str | None = Field(default=None, validation_alias="GROQ_KEY")

    chunk_max_tokens: int = 700
    chunk_overlap_tokens: int = 100
    enable_semantic_chunking: bool = False

    # ── Retrieval tuning ──────────────────────────────────────────────────────
    # candidate_k: how many raw candidates to fetch before re-ranking/filtering
    retrieval_candidate_k: int = 30
    # rag_top_k: final chunks sent to the LLM
    rag_top_k: int = 6
    # minimum retrieval/reranker score to include a chunk
    retrieval_min_score: float = 0.15
    # only return chunks where is_current = 'true' (set False to include all)
    retrieval_filter_current: bool = True

    # ── Hybrid search (vector + PostgreSQL FTS + RRF) ─────────────────────────
    hybrid_search_enabled: bool = True
    # RRF constant k (60 is the standard default)
    hybrid_rrf_k: int = 60
    # weight for keyword vs vector rank when merging (1.0 = equal weight)
    hybrid_keyword_weight: float = 1.0
    hybrid_vector_weight: float = 1.0

    # ── Re-ranker ─────────────────────────────────────────────────────────────
    reranker_enabled: bool = False
    reranker_model: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"
    # minimum reranker score (logit) to keep a chunk after re-ranking
    reranker_min_score: float = -5.0

    # ── Answer gating ─────────────────────────────────────────────────────────
    # minimum top-chunk score to call the LLM at all
    answer_min_confidence: float = 0.20


settings = Settings()
