"""Normalize STT transcript text and produce tokens for downstream NLP."""

from __future__ import annotations

import re
import unicodedata

_TAG_RE = re.compile(r"\[[^\]]*\]|\([^)]*\)")
_MULTI_SPACE = re.compile(r"\s+")
_NON_WORD_KEEP_APOSTROPHE = re.compile(r"[^a-z0-9'\s]+")
_TOKEN_RE = re.compile(r"[a-z0-9']+")


def _strip_noise(text: str) -> str:
    t = unicodedata.normalize("NFKC", text)
    t = _TAG_RE.sub(" ", t)
    t = _NON_WORD_KEEP_APOSTROPHE.sub(" ", t.lower())
    t = _MULTI_SPACE.sub(" ", t).strip()
    return t


def light_stem(token: str) -> str:
    """Tiny optional stemmer: common English suffixes only (no external deps)."""
    if len(token) <= 3:
        return token
    for suf in ("ing", "ed", "es", "s"):
        if len(token) > 4 and token.endswith(suf):
            return token[: -len(suf)]
    return token


def process_transcript(raw: str, *, lemmatize: bool = True) -> tuple[str, list[str]]:
    """
    Returns ``(clean_text, tokens)`` where ``clean_text`` is lowercased,
    whitespace-normalized text and ``tokens`` are alphanumeric words (with optional
    light lemmatization when ``lemmatize`` is True).
    """
    clean = _strip_noise(raw)
    raw_tokens = _TOKEN_RE.findall(clean)
    if lemmatize:
        tokens = [light_stem(t) for t in raw_tokens if t]
    else:
        tokens = [t for t in raw_tokens if t]
    tokens = [t for t in tokens if len(t) >= 1]
    return clean, tokens
