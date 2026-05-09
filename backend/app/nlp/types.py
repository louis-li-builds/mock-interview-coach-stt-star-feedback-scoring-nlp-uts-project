"""Shared dataclasses for the mock NLP pipeline (single place for result shapes)."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class KeywordScoreResult:
    keywords: tuple[str, ...]
    matched: tuple[str, ...]
    coverage: float  # 0..1
    score: float  # 0..100


@dataclass(frozen=True)
class StructureResult:
    has_intro: bool
    has_body: bool
    has_conclusion: bool
    structure_score: float  # 0..100


@dataclass(frozen=True)
class FluencyResult:
    filler_count: int
    word_count: int
    wpm: float | None
    fluency_score: float  # 0..100


@dataclass(frozen=True)
class ConfidenceResult:
    confidence_level: str  # low | medium | high
    confidence_score: float  # 0..100


@dataclass(frozen=True)
class AggregatedScore:
    overall: float  # 0..100 before rounding


@dataclass(frozen=True)
class FeedbackInput:
    clean_text: str
    keyword: KeywordScoreResult
    structure: StructureResult
    fluency: FluencyResult
    confidence: ConfidenceResult
    question_title: str = ""
    question_body: str = ""
