"""Local cross-encoder re-ranker using sentence-transformers.

The model runs on CPU by default.  For production, set EMBEDDING_DEVICE=cuda
or use a lighter model like ms-marco-MiniLM-L-6-v2.

Model recommendations:
    - Fast / light:  cross-encoder/ms-marco-MiniLM-L-6-v2  (~80 MB)
    - Multilingual:  BAAI/bge-reranker-v2-m3                (~570 MB, best for Vietnamese)
"""

from __future__ import annotations

import logging
from dataclasses import replace

from src.retrieval.retriever import RetrievalResult
from src.reranking.base import Reranker

logger = logging.getLogger(__name__)

try:
    from sentence_transformers import CrossEncoder
    _CROSS_ENCODER_AVAILABLE = True
except ImportError:  # pragma: no cover
    _CROSS_ENCODER_AVAILABLE = False


class LocalCrossEncoderReranker(Reranker):
    """Re-rank chunks with a locally-loaded sentence-transformers CrossEncoder.

    The model is loaded lazily on first use to avoid slowing down startup.
    """

    def __init__(self, model_name: str, min_score: float = -5.0) -> None:
        if not _CROSS_ENCODER_AVAILABLE:
            raise ImportError(
                "sentence-transformers is required for LocalCrossEncoderReranker. "
                "Install it with:  pip install sentence-transformers"
            )
        self.model_name = model_name
        self.min_score = min_score
        self._model: "CrossEncoder | None" = None  # noqa: F821

    # ------------------------------------------------------------------
    # Reranker interface
    # ------------------------------------------------------------------

    def rerank(
        self,
        question: str,
        chunks: list[RetrievalResult],
        top_k: int,
    ) -> list[RetrievalResult]:
        if not chunks:
            return []

        model = self._get_model()

        # Build (query, passage) pairs for the cross-encoder
        pairs = [(question, chunk.content) for chunk in chunks]
        scores: list[float] = model.predict(pairs, show_progress_bar=False).tolist()

        # Pair original chunks with scores, filter by min_score, sort descending
        scored = sorted(
            zip(chunks, scores),
            key=lambda t: t[1],
            reverse=True,
        )

        results: list[RetrievalResult] = []
        for chunk, score in scored:
            if score < self.min_score:
                continue
            # Update .score in the frozen dataclass via dataclasses.replace
            results.append(replace(chunk, score=float(score)))
            if len(results) >= top_k:
                break

        logger.debug(
            "Reranked %d chunks → %d kept (top score=%.3f)",
            len(chunks),
            len(results),
            results[0].score if results else 0.0,
        )
        return results

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _get_model(self) -> "CrossEncoder":
        if self._model is None:
            logger.info("Loading cross-encoder model: %s", self.model_name)
            self._model = CrossEncoder(self.model_name)
            logger.info("Cross-encoder model loaded.")
        return self._model
