"""Weighted combination of signals that drive ``overall_score``."""

from __future__ import annotations

import os

from ..types import AggregatedScore

def _use_embeddings() -> bool:
    return (os.getenv("USE_EMBEDDINGS") or "").strip().lower() in {"1", "true", "yes", "on"}


def aggregate_scores(
    keyword_score: float,
    structure_score: float,
    fluency_score: float,
    confidence_score: float,
    semantic_score: float | None = None,
) -> AggregatedScore:
    """
    If embeddings are enabled and `semantic_score` is present, use hybrid weights:

        overall = 0.30*keyword + 0.20*structure + 0.20*fluency + 0.30*semantic

    Confidence stays in the pipeline for feedback, but is not part of overall in
    the hybrid formula (to match the course-facing rubric more closely).
    """
    if _use_embeddings() and semantic_score is not None:
        overall = (
            0.30 * keyword_score
            + 0.20 * structure_score
            + 0.20 * fluency_score
            + 0.30 * semantic_score
        )
    else:
        # Default (fully deterministic / no embedding dependency).
        overall = (
            0.40 * keyword_score
            + 0.20 * structure_score
            + 0.20 * fluency_score
            + 0.20 * confidence_score
        )
    return AggregatedScore(overall=max(0.0, min(100.0, overall)))
