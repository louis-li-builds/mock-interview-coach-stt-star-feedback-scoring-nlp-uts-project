"""Map internal 0–100 signals to the four fixed ``BreakdownRow`` labels (max 25 each)."""

from __future__ import annotations

from ...schemas import BreakdownRow


def _clamp_row(score: float) -> float:
    return round(max(0.0, min(25.0, score)), 2)


def build_breakdown_rows(
    *,
    structure_score: float,
    keyword_score: float,
    measurable_score: float,
    fluency_score: float,
) -> list[BreakdownRow]:
    """Each argument is 0..100; outputs scores on a 0..25 scale per rubric row."""
    return [
        BreakdownRow(
            label="STAR coverage",
            score=_clamp_row(structure_score / 100.0 * 25.0),
            max=25.0,
        ),
        BreakdownRow(
            label="Prompt relevance",
            score=_clamp_row(keyword_score / 100.0 * 25.0),
            max=25.0,
        ),
        BreakdownRow(
            label="Measurable evidence",
            score=_clamp_row(measurable_score / 100.0 * 25.0),
            max=25.0,
        ),
        BreakdownRow(
            label="Clarity & structure",
            score=_clamp_row(fluency_score / 100.0 * 25.0),
            max=25.0,
        ),
    ]
