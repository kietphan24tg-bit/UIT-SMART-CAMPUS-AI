import math
import re
from dataclasses import dataclass, field
from typing import Protocol


SENTENCE_RE = re.compile(r"(?<=[.!?。！？])\s+|(?<=\.)\s+(?=[A-ZÀ-Ỵ])")


class UnitEmbedder(Protocol):
    def embed(self, texts: list[str]) -> list[list[float]]:
        ...


@dataclass(frozen=True)
class TextChunk:
    content: str
    heading_path: str | None = None
    parent_heading_path: str | None = None
    page_start: int | None = None
    page_end: int | None = None
    metadata: dict = field(default_factory=dict)

    @property
    def token_count(self) -> int:
        return estimate_tokens(self.content)


def estimate_tokens(text: str) -> int:
    # Vietnamese whitespace tokenization is imperfect but stable enough for chunk limits.
    return max(1, math.ceil(len(re.findall(r"\S+", text)) * 1.35))


def normalize_whitespace(text: str) -> str:
    return re.sub(r"\n{3,}", "\n\n", text.strip())


def split_paragraphs(text: str) -> list[str]:
    return [part.strip() for part in re.split(r"\n\s*\n", text) if part.strip()]


def split_sentences(text: str) -> list[str]:
    sentences = [part.strip() for part in SENTENCE_RE.split(text) if part.strip()]
    return sentences or [text.strip()]


def cosine_similarity(left: list[float], right: list[float]) -> float:
    dot = sum(a * b for a, b in zip(left, right))
    left_norm = math.sqrt(sum(a * a for a in left))
    right_norm = math.sqrt(sum(b * b for b in right))
    if left_norm == 0 or right_norm == 0:
        return 0.0
    return dot / (left_norm * right_norm)


class FallbackChunker:
    def __init__(
        self,
        max_tokens: int = 700,
        overlap_tokens: int = 100,
        semantic_threshold: float = 0.72,
    ) -> None:
        self.max_tokens = max_tokens
        self.overlap_tokens = overlap_tokens
        self.semantic_threshold = semantic_threshold

    def chunk(self, text: str, metadata: dict | None = None) -> list[TextChunk]:
        chunks: list[TextChunk] = []
        for paragraph in split_paragraphs(text):
            chunks.extend(self._bounded_chunks(paragraph, metadata=metadata or {}))
        return chunks

    def semantic_chunk(
        self,
        text: str,
        embedder: UnitEmbedder,
        metadata: dict | None = None,
    ) -> list[TextChunk]:
        units = [unit for paragraph in split_paragraphs(text) for unit in split_sentences(paragraph)]
        if not units:
            return []
        embeddings = embedder.embed(units)

        grouped: list[str] = []
        current = units[0]
        previous_vector = embeddings[0]
        for unit, vector in zip(units[1:], embeddings[1:]):
            proposed = f"{current} {unit}".strip()
            if (
                estimate_tokens(proposed) <= self.max_tokens
                and cosine_similarity(previous_vector, vector) >= self.semantic_threshold
            ):
                current = proposed
            else:
                grouped.append(current)
                current = unit
            previous_vector = vector
        grouped.append(current)

        chunks: list[TextChunk] = []
        for group in grouped:
            chunks.extend(self._bounded_chunks(group, metadata=metadata or {}))
        return chunks

    def _bounded_chunks(self, text: str, metadata: dict) -> list[TextChunk]:
        text = normalize_whitespace(text)
        if not text:
            return []
        if estimate_tokens(text) <= self.max_tokens:
            return [TextChunk(content=text, metadata=metadata)]

        sentence_chunks = self._pack_units(split_sentences(text))
        chunks: list[TextChunk] = []
        for chunk in sentence_chunks:
            if estimate_tokens(chunk) <= self.max_tokens:
                chunks.append(TextChunk(content=chunk, metadata=metadata))
            else:
                chunks.extend(TextChunk(content=part, metadata=metadata) for part in self._token_windows(chunk))
        return chunks

    def _pack_units(self, units: list[str]) -> list[str]:
        packed: list[str] = []
        current = ""
        for unit in units:
            proposed = f"{current} {unit}".strip()
            if current and estimate_tokens(proposed) > self.max_tokens:
                packed.append(current)
                current = unit
            else:
                current = proposed
        if current:
            packed.append(current)
        return packed

    def _token_windows(self, text: str) -> list[str]:
        words = re.findall(r"\S+", text)
        if not words:
            return []

        max_words = max(1, int(self.max_tokens / 1.35))
        overlap_words = max(0, min(int(self.overlap_tokens / 1.35), max_words - 1))
        step = max_words - overlap_words

        windows: list[str] = []
        for start in range(0, len(words), step):
            window = " ".join(words[start : start + max_words]).strip()
            if window:
                windows.append(window)
            if start + max_words >= len(words):
                break
        return windows
