"""Filler counting and delivery score (WPM when duration is known)."""

from __future__ import annotations

import re

from ..types import FluencyResult

_FILLERS = (
    r"\bum\b",
    r"\buh\b",
    r"\ber\b",
    r"\bah\b",
    r"\blike\b",
    r"\byou\s+know\b",
    r"\bi\s+mean\b",
    r"\bsort\s+of\b",
    r"\bkind\s+of\b",
)


def analyze_fluency(
    clean_text: str,
    *,
    audio_duration_seconds: float | None = None,
) -> FluencyResult:
    words = clean_text.split()
    word_count = len(words)
    filler_count = 0
    for pat in _FILLERS:
        filler_count += len(re.findall(pat, clean_text))

    wpm: float | None = None
    if audio_duration_seconds is not None and audio_duration_seconds > 0.5:
        wpm = (word_count / audio_duration_seconds) * 60.0

    if word_count == 0:
        return FluencyResult(
            filler_count=0,
            word_count=0,
            wpm=wpm,
            fluency_score=15.0,
        )

    per_100 = (filler_count / word_count) * 100.0
    penalty = min(55.0, per_100 * 8.0)

    pace_penalty = 0.0
    if wpm is not None:
        if wpm < 90:
            pace_penalty += min(15.0, (90 - wpm) / 6.0)
        elif wpm > 210:
            pace_penalty += min(15.0, (wpm - 210) / 10.0)

    fluency_score = max(10.0, min(100.0, 92.0 - penalty - pace_penalty))

    return FluencyResult(
        filler_count=filler_count,
        word_count=word_count,
        wpm=wpm,
        fluency_score=fluency_score,
    )
