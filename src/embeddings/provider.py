import time
import re
from typing import Protocol

from google import genai
from google.genai import types

from src.core.config import Settings


class EmbeddingProvider(Protocol):
    dimensions: int

    def embed(self, texts: list[str]) -> list[list[float]]:
        ...


class GeminiEmbeddingProvider:
    def __init__(
        self,
        api_key: str,
        model: str = "gemini-embedding-001",
        dimensions: int = 768,
        batch_size: int = 32,
        max_retries: int = 8,
        request_delay_seconds: float = 0.7,
    ) -> None:
        if not api_key:
            raise ValueError("GEMINI_KEY is required for Gemini embeddings")
        self.client = genai.Client(api_key=api_key)
        self.model = model
        self.dimensions = dimensions
        self.batch_size = batch_size
        self.max_retries = max_retries
        self.request_delay_seconds = request_delay_seconds

    def embed(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []

        vectors: list[list[float]] = []
        for start in range(0, len(texts), self.batch_size):
            batch = texts[start : start + self.batch_size]
            vectors.extend(self._embed_batch(batch))
            if start + self.batch_size < len(texts) and self.request_delay_seconds > 0:
                time.sleep(self.request_delay_seconds)
        return vectors

    def _embed_batch(self, texts: list[str]) -> list[list[float]]:
        last_error: Exception | None = None
        for attempt in range(self.max_retries + 1):
            try:
                response = self.client.models.embed_content(
                    model=self.model,
                    contents=texts,
                    config=types.EmbedContentConfig(output_dimensionality=self.dimensions),
                )
                embeddings = getattr(response, "embeddings", None) or []
                return [list(item.values) for item in embeddings]
            except Exception as exc:  # provider SDK wraps rate-limit/network errors differently.
                last_error = exc
                if not self._is_retryable_error(exc):
                    break
                if attempt >= self.max_retries:
                    break
                time.sleep(self._retry_delay_seconds(exc, attempt))
        raise RuntimeError(f"Gemini embedding failed after retries: {last_error}") from last_error

    def _is_retryable_error(self, exc: Exception) -> bool:
        message = str(exc)
        non_retryable_markers = (
            "PERMISSION_DENIED",
            "API_KEY_INVALID",
            "UNAUTHENTICATED",
            "403",
            "401",
        )
        return not any(marker in message for marker in non_retryable_markers)

    def _retry_delay_seconds(self, exc: Exception, attempt: int) -> float:
        message = str(exc)
        retry_match = re.search(r"retryDelay['\"]?\s*[:=]\s*['\"]?(\d+)s", message)
        if retry_match:
            return float(retry_match.group(1)) + 5.0

        retry_match = re.search(r"Please retry in\s+([0-9.]+)s", message)
        if retry_match:
            return float(retry_match.group(1)) + 5.0

        return float(min(60, 2**attempt))


class DeterministicEmbeddingProvider:
    def __init__(self, dimensions: int = 8) -> None:
        self.dimensions = dimensions

    def embed(self, texts: list[str]) -> list[list[float]]:
        vectors: list[list[float]] = []
        for text in texts:
            vector = [0.0] * self.dimensions
            for index, char in enumerate(text.encode("utf-8", errors="ignore")):
                vector[index % self.dimensions] += float(char) / 255.0
            vectors.append(vector)
        return vectors


class LocalSentenceTransformerEmbeddingProvider:
    def __init__(
        self,
        model: str = "intfloat/multilingual-e5-base",
        dimensions: int = 768,
        batch_size: int = 32,
        device: str | None = None,
        query_prefix: str = "query: ",
        document_prefix: str = "passage: ",
    ) -> None:
        try:
            from sentence_transformers import SentenceTransformer
        except ImportError as exc:
            raise RuntimeError(
                "Local embeddings require sentence-transformers. Install dependencies with `pip install -e .`."
            ) from exc

        self.model_name = model
        self.dimensions = dimensions
        self.batch_size = batch_size
        self.query_prefix = query_prefix
        self.document_prefix = document_prefix
        self.model = SentenceTransformer(model, device=device or None)

    def embed(self, texts: list[str]) -> list[list[float]]:
        return self._encode([self.document_prefix + text for text in texts])

    def embed_query(self, text: str) -> list[float]:
        return self._encode([self.query_prefix + text])[0]

    def _encode(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []

        embeddings = self.model.encode(
            texts,
            batch_size=self.batch_size,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        vectors = [list(map(float, vector)) for vector in embeddings]
        for vector in vectors:
            if len(vector) != self.dimensions:
                raise ValueError(
                    f"Local embedding dimension mismatch: expected {self.dimensions}, got {len(vector)}"
                )
        return vectors


def create_embedding_provider(config: Settings, batch_size: int | None = None) -> EmbeddingProvider:
    provider = config.embedding_provider.lower().strip()
    resolved_batch_size = batch_size or config.embedding_batch_size
    if provider == "gemini":
        return GeminiEmbeddingProvider(
            api_key=config.gemini_key or "",
            model=config.embedding_model,
            dimensions=config.embedding_dimensions,
            batch_size=resolved_batch_size,
            max_retries=config.gemini_max_retries,
            request_delay_seconds=config.embedding_request_delay_seconds,
        )
    if provider == "local":
        return LocalSentenceTransformerEmbeddingProvider(
            model=config.embedding_model,
            dimensions=config.embedding_dimensions,
            batch_size=resolved_batch_size,
            device=config.embedding_device,
            query_prefix=config.local_embedding_query_prefix,
            document_prefix=config.local_embedding_document_prefix,
        )
    raise ValueError(f"Unsupported EMBEDDING_PROVIDER: {config.embedding_provider}")
