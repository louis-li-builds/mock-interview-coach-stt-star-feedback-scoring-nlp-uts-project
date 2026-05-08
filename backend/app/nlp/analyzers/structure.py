"""Coarse answer structure (intro / body / conclusion) via regex cues."""

from __future__ import annotations

import re

from ..types import StructureResult

_INTRO_PATTERNS = (
    r"\bi\s+am\b",
    r"\bi\'?ve\s+been\b",
    r"\bmy\s+name\b",
    r"\bmy\s+background\b",
    r"\bi\s+(?:was|worked|studied)\b",
    r"\bas\s+a\b",
)
_BODY_PATTERNS = (
    r"\bexperience\b",
    r"\bproject\b",
    r"\brole\b",
    r"\bteam\b",
    r"\blead\b",
    r"\bimplement\b",
    r"\bworked\s+on\b",
    r"\bresponsible\b",
    r"\bachieved\b",
    r"\bsolved\b",
)
_CONCLUSION_PATTERNS = (
    r"\bin\s+summary\b",
    r"\bto\s+summarize\b",
    r"\boverall\b",
    r"\blooking\s+forward\b",
    r"\bin\s+conclusion\b",
    r"\bthat\'?s\s+why\b",
    r"\btakeaway\b",
)


def _any_match(patterns: tuple[str, ...], text: str) -> bool:
    return any(re.search(p, text) for p in patterns)


def analyze_structure(clean_text: str) -> StructureResult:
    has_intro = _any_match(_INTRO_PATTERNS, clean_text)
    has_body = _any_match(_BODY_PATTERNS, clean_text)
    has_conclusion = _any_match(_CONCLUSION_PATTERNS, clean_text)

    parts = sum([has_intro, has_body, has_conclusion])
    structure_score = (parts / 3.0) * 100.0

    return StructureResult(
        has_intro=has_intro,
        has_body=has_body,
        has_conclusion=has_conclusion,
        structure_score=structure_score,
    )
