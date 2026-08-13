from pydantic_settings import BaseSettings
from pydantic import Field
from pydantic_settings import SettingsConfigDict


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
    gemini_max_retries: int = 8
    gemini_key: str | None = Field(default=None, validation_alias="GEMINI_KEY")

    llm_provider: str = "groq"
    llm_model: str = "llama-3.1-8b-instant"
    groq_key: str | None = Field(default=None, validation_alias="GROQ_KEY")

    chunk_max_tokens: int = 700
    chunk_overlap_tokens: int = 100
    enable_semantic_chunking: bool = False


settings = Settings()
