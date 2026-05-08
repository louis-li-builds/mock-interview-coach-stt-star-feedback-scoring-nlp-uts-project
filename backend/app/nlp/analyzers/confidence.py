"""Lightweight confidence heuristic (no ML)."""

from __future__ import annotations

import re

from ..types import ConfidenceResult

_POSITIVE = (
    r"\bconfident\b",
    r"\bachieved\b",
    r"\bsuccessfully\b",
    r"\bstrong\b",
    r"\bproud\b",
    r"\blearned\b",
    r"\bimproved\b",
)


def estimate_confidence(
    clean_text: str,
    *,
    word_count: int,
    filler_count: int,
) -> ConfidenceResult:
    score = 55.0

    if word_count < 25:
        score -= 28.0
    elif word_count < 45:
        score -= 12.0
    elif word_count > 120:
        score += 8.0

    if word_count > 0:
        filler_ratio = filler_count / word_count
        score -= min(35.0, filler_ratio * 120.0)

    pos_hits = sum(1 for p in _POSITIVE if re.search(p, clean_text))
    score += min(18.0, pos_hits * 6.0)

    score = max(8.0, min(100.0, score))

    if score < 42:
        level = "low"
    elif score < 68:
        level = "medium"
    else:
        level = "high"

    return ConfidenceResult(confidence_level=level, confidence_score=score)
