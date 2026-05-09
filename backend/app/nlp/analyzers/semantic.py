"""
Semantic relevance scorer (optional).

Uses sentence-transformers embeddings when enabled via env:

- USE_EMBEDDINGS=true
- EMBEDDING_MODEL=all-MiniLM-L6-v2 (default)
"""

from __future__ import annotations

import os

from ..embeddings import cosine_similarity, get_default_embedding_service


def _enabled() -> bool:
    return (os.getenv("USE_EMBEDDINGS") or "").strip().lower() in {"1", "true", "yes", "on"}


def score_semantic_relevance(
    *,
    answer_text: str,
    question_title: str,
    question_body: str,
    reference_hint: str | None = None,
) -> float | None:
    """
    Returns a 0..100 score when embeddings are enabled and available.
    Returns None when disabled or when the embedding dependency is missing.

    We compare the answer against a "reference text" built from the prompt plus
    optional hint concepts. This is a pragmatic baseline without requiring a
    curated reference answer dataset.
    """
    if not _enabled():
        return None

    ref = f"{question_title.strip()}\n{question_body.strip()}".strip()
    if reference_hint:
        ref = f"{ref}\n\nExpected concepts: {reference_hint.strip()}".strip()

    try:
        svc = get_default_embedding_service()
        a = svc.encode(answer_text or "")
        b = svc.encode(ref)
        sim = cosine_similarity(a, b)  # typically ~0.0..~0.8
    except ImportError:
        return None
    except Exception:
        # Defensive: embedding downloads / torch errors should not break scoring.
        return None

    # Map cosine similarity to a human-friendly 0..100 range.
    # Clamp negative similarities to 0.
    sim = max(0.0, min(1.0, float(sim)))
    return sim * 100.0

