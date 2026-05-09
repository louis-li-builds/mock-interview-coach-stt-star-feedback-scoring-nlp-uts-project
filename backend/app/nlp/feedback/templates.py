"""Rule-based feedback lines from NLP evaluation artifacts."""

from __future__ import annotations

import os

from ..analyzers.evidence import score_measurable_evidence
from ..analyzers.semantic import score_semantic_relevance
from ..types import FeedbackInput


def generate_feedback(ctx: FeedbackInput, *, max_items: int = 5) -> list[str]:
    lines: list[str] = []

    k = ctx.keyword
    if k.coverage < 0.35:
        lines.append(
            "Address the question themes more directly — weave in vocabulary from the prompt "
            "(situation, goals, skills you applied)."
        )
    elif k.coverage < 0.55:
        lines.append(
            "Good start — tighten relevance by naming one more concrete link between your story "
            "and what the interviewer asked."
        )

    # Optional semantic relevance hint (only when USE_EMBEDDINGS=true and dependency available).
    if (os.getenv("USE_EMBEDDINGS") or "").strip().lower() in {"1", "true", "yes", "on"}:
        sem = score_semantic_relevance(
            answer_text=ctx.clean_text,
            question_title=ctx.question_title,
            question_body=ctx.question_body,
            reference_hint="situation, task, action, result, outcome, impact, learning",
        )
        if sem is not None and sem < 45:
            lines.append(
                "Your answer seems semantically off-topic — align your story to the prompt (challenge, actions, and outcome)."
            )
        elif sem is not None and sem > 75:
            lines.append("Semantically, your answer stays on-topic — keep that focus while adding one crisp metric.")

    s = ctx.structure
    if not s.has_intro:
        lines.append("Open with a clear one-liner who you are or what role/context you're in.")
    if not s.has_body:
        lines.append(
            "Add a concrete middle: a specific project, responsibility, or challenge with actions you took."
        )
    if not s.has_conclusion:
        lines.append("Close with a takeaway or what you'd do next time — interviewers listen for closure.")

    f = ctx.fluency
    if f.filler_count >= 6:
        lines.append(
            f'Reduce fillers such as "um" / "like" ({f.filler_count} detected) — pause briefly instead.'
        )
    elif f.filler_count >= 3:
        lines.append('Trim occasional fillers ("um", "like") so key points land more clearly.')

    meas = score_measurable_evidence(ctx.clean_text)
    if meas < 45:
        lines.append(
            "Include at least one measurable outcome (%, timeline, scale, or before/after) to strengthen credibility."
        )

    c = ctx.confidence
    if c.confidence_level == "low":
        lines.append(
            "Your answer reads uncertain — add decisive verbs and one crisp outcome to sound more assured."
        )

    if s.structure_score < 45:
        lines.append(
            "Map explicitly to STAR: Situation → Task → Action → Result, even if briefly."
        )

    seen: set[str] = set()
    out: list[str] = []
    for line in lines:
        if line not in seen:
            seen.add(line)
            out.append(line)
        if len(out) >= max_items:
            break

    if not out:
        out.append(
            "Solid delivery — next pass: add one sharper metric and a one-sentence punchy closing."
        )

    return out[:max_items]
