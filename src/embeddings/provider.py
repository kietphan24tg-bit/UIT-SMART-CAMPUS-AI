import time
import re
from typing import Protocol

from google import genai
from google.genai import types


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
