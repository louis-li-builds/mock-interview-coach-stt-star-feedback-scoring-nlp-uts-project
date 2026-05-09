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
    score_semantic_relevance,
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
    semantic = score_semantic_relevance(
        answer_text=clean_text,
        question_title=req.question_title,
        question_body=req.question_body,
        reference_hint="situation, task, action, result, outcome, impact, learning",
    )
    mock_variant = "hybrid" if semantic is not None else "rule"
    structure = analyze_structure(clean_text)
    fluency = analyze_fluency(clean_text)
    confidence = estimate_confidence(
        clean_text,
        word_count=fluency.word_count,
        filler_count=fluency.filler_count,
    )
    measurable = score_measurable_evidence(clean_text)

    # Prompt relevance row stays stable for UI, but may be hybrid (lexical + semantic).
    prompt_relevance_score = keyword.score
    if semantic is not None:
        prompt_relevance_score = 0.55 * keyword.score + 0.45 * semantic

    aggregated = aggregate_scores(
        keyword.score,
        structure.structure_score,
        fluency.fluency_score,
        confidence.confidence_score,
        semantic,
    )

    overall = max(0, min(100, int(round(aggregated.overall))))

    breakdown = build_breakdown_rows(
        structure_score=structure.structure_score,
        keyword_score=prompt_relevance_score,
        measurable_score=measurable,
        fluency_score=fluency.fluency_score,
    )

    suggestions = generate_feedback(
        FeedbackInput(
            clean_text=clean_text,
            question_title=req.question_title,
            question_body=req.question_body,
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
        mock_variant=mock_variant,
    )
