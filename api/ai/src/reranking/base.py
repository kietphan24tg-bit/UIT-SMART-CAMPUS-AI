"""Abstract base class for re-rankers.

A re-ranker reads each (question, chunk) pair directly and assigns a
scalar relevance score, which is more precise than cosine distance alone.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

from src.retrieval.retriever import RetrievalResult


class Reranker(ABC):
    """Interface that every concrete re-ranker must implement."""

    @abstractmethod
    def rerank(
        self,
        question: str,
        chunks: list[RetrievalResult],
        top_k: int,
    ) -> list[RetrievalResult]:
        """Score and sort *chunks* by relevance to *question*.

        Args:
            question: User query (Vietnamese natural language).
            chunks:   Candidate chunks from the hybrid retriever.
            top_k:    Maximum number of chunks to return.

        Returns:
            Subset of *chunks* sorted by descending relevance score,
            with ``RetrievalResult.score`` updated to the reranker score.
        """
        ...
