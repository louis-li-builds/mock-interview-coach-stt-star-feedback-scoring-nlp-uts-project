"""Weighted combination of the four signals that drive ``overall_score``."""

from __future__ import annotations

from ..types import AggregatedScore

# Tunable weights (sum = 1.0).
W_KEYWORD = 0.4
W_STRUCTURE = 0.2
W_FLUENCY = 0.2
W_CONFIDENCE = 0.2


def aggregate_scores(
    keyword_score: float,
    structure_score: float,
    fluency_score: float,
    confidence_score: float,
) -> AggregatedScore:
    overall = (
        W_KEYWORD * keyword_score
        + W_STRUCTURE * structure_score
        + W_FLUENCY * fluency_score
        + W_CONFIDENCE * confidence_score
    )
    return AggregatedScore(overall=max(0.0, min(100.0, overall)))
