"""Scoring: OpenAI JSON path + deterministic mock fallback. Canonical doc: ``docs/SCORING.md``."""

import json
import os
import re
from typing import Any

from openai import AsyncOpenAI

from .schemas import BreakdownRow, ScoreRequest, ScoreResponse

def _log_llm_event(msg: str) -> None:
    # Keep logging minimal and never include secrets.
    print(f"[llm] {msg}")

SYSTEM_PROMPT = """You are an interview coach for behavioural (STAR) questions.
Given the interview question and the candidate's spoken answer (as transcript), evaluate the answer.

Return ONLY valid JSON with this shape (no markdown fences):
{
  "overall_score": <integer 0-100>,
  "breakdown": [
    {"label": "STAR coverage", "score": <number>, "max": 25},
    {"label": "Prompt relevance", "score": <number>, "max": 25},
    {"label": "Measurable evidence", "score": <number>, "max": 25},
    {"label": "Clarity & structure", "score": <number>, "max": 25}
  ],
  "suggestions": [<3-5 short actionable strings>]
}

Rules:
- Scores must be consistent with the transcript; penalise missing Situation/Task/Action/Result signals.
- Suggestions must be specific to the transcript (quote patterns, not generic platitudes).
"""

SYSTEM_PROMPT_MINIMAL = """You are an interview coach. Given a question title/body and a candidate transcript, score the answer.
Return ONLY valid JSON (no markdown) with keys: overall_score (0-100), breakdown (four objects: STAR coverage, Prompt relevance, Measurable evidence, Clarity & structure — each with label, score, max 25), suggestions (3-5 short strings).
Be strict but concise; same JSON shape as a detailed rubric would produce."""

PROMPT_VARIANT_FULL = "full"
PROMPT_VARIANT_MINIMAL = "minimal"


def _system_prompt() -> str:
    v = (os.getenv("SCORE_PROMPT_VARIANT") or PROMPT_VARIANT_FULL).strip().lower()
    if v == PROMPT_VARIANT_MINIMAL:
        return SYSTEM_PROMPT_MINIMAL
    return SYSTEM_PROMPT


def _mock_score(req: ScoreRequest) -> ScoreResponse:
    t = req.transcript.strip()
    n = max(len(t), 1)
    base = min(88, 36 + n // 10)
    star = min(25, 10 + n // 25)
    rel = min(25, 12 + (5 if "?" not in t else 0))
    evi = min(25, 8 + (6 if re.search(r"\d", t) else 0))
    clr = min(25, 10 + n // 40)
    breakdown = [
        BreakdownRow(label="STAR coverage", score=float(star), max=25.0),
        BreakdownRow(label="Prompt relevance", score=float(rel), max=25.0),
        BreakdownRow(label="Measurable evidence", score=float(evi), max=25.0),
        BreakdownRow(label="Clarity & structure", score=float(clr), max=25.0),
    ]
    sug = [
        "Add one concrete metric (date, duration, % improvement) in the Result.",
        "State Situation and Task in one sentence each before deep diving into Action.",
        "Close with what you learned or would change next time.",
    ]
    if not re.search(r"\d", t):
        sug.insert(0, "Include at least one number or measurable outcome if possible.")
    return ScoreResponse(
        overall_score=int(base),
        breakdown=breakdown,
        suggestions=sug[:5],
        source="mock",
    )


def _parse_score_payload(data: dict[str, Any]) -> ScoreResponse:
    overall = int(data["overall_score"])
    rows: list[BreakdownRow] = []
    for row in data["breakdown"]:
        rows.append(
            BreakdownRow(
                label=str(row["label"]),
                score=float(row["score"]),
                max=float(row.get("max", 25)),
            )
        )
    suggestions = [str(s) for s in data["suggestions"]]
    return ScoreResponse(
        overall_score=max(0, min(100, overall)),
        breakdown=rows,
        suggestions=suggestions,
        source="llm",
    )


async def score_answer(req: ScoreRequest) -> ScoreResponse:
    if req.force_mock:
        return _mock_score(req)
    key = os.getenv("OPENAI_API_KEY")
    if not key:
        return _mock_score(req)

    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    timeout = float(os.getenv("OPENAI_TIMEOUT_SECONDS", "90"))
    _log_llm_event(f"Using OpenAI model={model} timeout={timeout}s")
    client = AsyncOpenAI(api_key=key, timeout=timeout)
    user_payload = {
        "question_title": req.question_title,
        "question_body": req.question_body,
        "transcript": req.transcript,
    }

    try:
        completion = await client.chat.completions.create(
            model=model,
            temperature=0.2,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": _system_prompt()},
                {
                    "role": "user",
                    "content": json.dumps(user_payload, ensure_ascii=False),
                },
            ],
        )
        raw = completion.choices[0].message.content or "{}"
        data = json.loads(raw)
        parsed = _parse_score_payload(data)
        if len(parsed.breakdown) < 4:
            raise ValueError("Incomplete breakdown")
        return parsed
    except Exception as exc:
        _log_llm_event(
            f"LLM scoring failed, falling back to mock: {type(exc).__name__}: {exc}"
        )
        return _mock_score(req)
