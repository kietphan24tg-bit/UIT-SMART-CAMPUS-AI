"""Factory for creating Reranker instances from config."""

from __future__ import annotations

import logging

from src.core.config import Settings, settings
from src.reranking.base import Reranker

logger = logging.getLogger(__name__)


def create_reranker(config: Settings = settings) -> Reranker | None:
    """Return a configured Reranker, or None if reranking is disabled.

    Controlled by env vars:
        RERANKER_ENABLED=true          # set to true to enable
        RERANKER_MODEL=cross-encoder/ms-marco-MiniLM-L-6-v2
        RERANKER_MIN_SCORE=-5.0        # logit threshold

    Returns:
        A ``Reranker`` instance, or ``None`` when disabled.
    """
    if not config.reranker_enabled:
        return None

    from src.reranking.local_cross_encoder import LocalCrossEncoderReranker

    logger.info(
        "Re-ranker enabled: model=%s, min_score=%s",
        config.reranker_model,
        config.reranker_min_score,
    )
    return LocalCrossEncoderReranker(
        model_name=config.reranker_model,
        min_score=config.reranker_min_score,
    )
