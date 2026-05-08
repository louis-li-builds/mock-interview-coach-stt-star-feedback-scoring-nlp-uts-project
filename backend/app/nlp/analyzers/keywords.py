"""Keyword relevance: expected terms from the question plus STAR anchors."""

from __future__ import annotations

import re

from ..preprocess import light_stem
from ..types import KeywordScoreResult

_TOKEN_SPLIT = re.compile(r"[a-z0-9']+")

_STOPWORDS = frozenset(
    """
    the a an and or but if as of at by for from in into onto over under near with
    without within about above below between after before during while when where why how
    what which who whom whose this that these those i you we they he she it my your our their
    me us him her them be am is are was were been being do does did done have has had having
    will would could should may might must shall can need dare ought tell describe explain
    please just very too also only same such both few more most other some any each every
    all no not nor than then so too very just own same here there once ever even ever yet
    """.split()
)

_CORE_ANCHORS = (
    "situation",
    "task",
    "action",
    "result",
    "project",
    "experience",
    "outcome",
    "impact",
)

_RELATED_HINTS: dict[str, frozenset[str]] = {
    "experience": frozenset(
        {"work", "worked", "working", "role", "job", "career", "engineer", "engineering", "lead", "led"}
    ),
    "skills": frozenset({"skill", "python", "java", "code", "coding", "built", "develop", "technical"}),
    "background": frozenset({"engineer", "studied", "degree", "university", "school"}),
    "goals": frozenset({"goal", "want", "hope", "looking", "forward", "aspire"}),
}


def _tokens_from_question(title: str, body: str) -> list[str]:
    blob = f"{title} {body}".lower()
    return [t for t in _TOKEN_SPLIT.findall(blob) if t]


def _derive_keyword_sets(title: str, body: str) -> tuple[tuple[str, ...], tuple[str, ...]]:
    seen: set[str] = set()
    q_list: list[str] = []
    for w in _tokens_from_question(title, body):
        if w in _STOPWORDS or len(w) < 3:
            continue
        if w not in seen:
            seen.add(w)
            q_list.append(w)
        if len(q_list) >= 12:
            break
    return (tuple(q_list), tuple(_CORE_ANCHORS))


def _keyword_hit(kw: str, clean_text: str, token_set: set[str]) -> bool:
    if kw in clean_text or kw in token_set:
        return True
    stem_kw = light_stem(kw)
    if stem_kw in token_set:
        return True
    for syn in _RELATED_HINTS.get(kw, frozenset()):
        if syn in token_set or syn in clean_text:
            return True
        if light_stem(syn) in token_set:
            return True
    return False


def _meaningful_question_terms(title: str, body: str) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for t in _tokens_from_question(title, body):
        if t in _STOPWORDS or len(t) < 3:
            continue
        if t not in seen:
            seen.add(t)
            out.append(t)
    return out


def score_keywords(
    clean_text: str,
    tokens: list[str],
    question_title: str,
    question_body: str,
) -> KeywordScoreResult:
    """
    Combines coverage over (1) prompt keywords, (2) STAR anchors, and (3) stem overlap
    between meaningful prompt tokens and the answer.
    """
    question_kws, anchor_kws = _derive_keyword_sets(question_title, question_body)
    if not question_kws and not anchor_kws:
        return KeywordScoreResult(keywords=(), matched=(), coverage=1.0, score=85.0)

    token_set = set(tokens)
    matched: list[str] = []
    for kw in question_kws + anchor_kws:
        if _keyword_hit(kw, clean_text, token_set):
            matched.append(kw)

    def _cov(group: tuple[str, ...]) -> float:
        if not group:
            return 1.0
        hits = sum(1 for kw in group if _keyword_hit(kw, clean_text, token_set))
        return hits / len(group)

    cov_q = _cov(question_kws)
    cov_a = _cov(anchor_kws)
    explicit_cov = 0.6 * cov_q + 0.4 * cov_a

    q_terms = _meaningful_question_terms(question_title, question_body)
    if q_terms:
        hits_o = sum(
            1
            for t in q_terms
            if _keyword_hit(t, clean_text, token_set) or light_stem(t) in token_set
        )
        overlap_cov = hits_o / len(q_terms)
    else:
        overlap_cov = explicit_cov

    coverage = min(1.0, 0.65 * explicit_cov + 0.35 * overlap_cov)
    score = coverage * 100.0
    all_kw = tuple(dict.fromkeys([*question_kws, *anchor_kws]))
    return KeywordScoreResult(
        keywords=all_kw,
        matched=tuple(matched),
        coverage=coverage,
        score=score,
    )
