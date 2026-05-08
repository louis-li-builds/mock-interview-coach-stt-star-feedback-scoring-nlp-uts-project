"""
Orchestrator: preprocess → analyzers → aggregate → breakdown → feedback → ``ScoreResponse``.

This is the only module that should import ``schemas.ScoreRequest`` / ``ScoreResponse``
for the mock path end-to-end flow.
"""

from __future__ import annotations

from ..schemas import ScoreRequest, ScoreResponse
from .analyzers import (
    analyze_fluency,
    analyze_structure,
    estimate_confidence,
    score_keywords,
    score_measurable_evidence,
)
from .feedback import FeedbackInput, generate_feedback
from .preprocess import process_transcript
from .scoring import aggregate_scores, build_breakdown_rows


def evaluate_mock_nlp(req: ScoreRequest) -> ScoreResponse:
    clean_text, tokens = process_transcript(req.transcript)

    keyword = score_keywords(
        clean_text,
        tokens,
        req.question_title,
        req.question_body,
    )
    structure = analyze_structure(clean_text)
    fluency = analyze_fluency(clean_text)
    confidence = estimate_confidence(
        clean_text,
        word_count=fluency.word_count,
        filler_count=fluency.filler_count,
    )
    measurable = score_measurable_evidence(clean_text)

    aggregated = aggregate_scores(
        keyword.score,
        structure.structure_score,
        fluency.fluency_score,
        confidence.confidence_score,
    )

    overall = max(0, min(100, int(round(aggregated.overall))))

    breakdown = build_breakdown_rows(
        structure_score=structure.structure_score,
        keyword_score=keyword.score,
        measurable_score=measurable,
        fluency_score=fluency.fluency_score,
    )

    suggestions = generate_feedback(
        FeedbackInput(
            clean_text=clean_text,
            keyword=keyword,
            structure=structure,
            fluency=fluency,
            confidence=confidence,
        )
    )

    return ScoreResponse(
        overall_score=overall,
        breakdown=breakdown,
        suggestions=suggestions,
        source="mock",
    )
