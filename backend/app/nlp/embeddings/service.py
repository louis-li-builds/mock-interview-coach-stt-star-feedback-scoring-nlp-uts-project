"""
Embedding service (optional).

This module is intentionally lazy-loaded because `sentence-transformers` pulls in torch
and model downloads. Importing it unconditionally would slow down or break lightweight
dev flows.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache


def cosine_similarity(a: list[float], b: list[float]) -> float:
    """Cosine similarity for two same-length vectors. Returns 0 when degenerate."""
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = 0.0
    na = 0.0
    nb = 0.0
    for x, y in zip(a, b, strict=False):
        dot += x * y
        na += x * x
        nb += y * y
    if na <= 0.0 or nb <= 0.0:
        return 0.0
    return float(dot / ((na**0.5) * (nb**0.5)))


@dataclass
class EmbeddingService:
    model_name: str

    def encode(self, text: str) -> list[float]:
        """
        Encode text to an embedding vector.

        Raises ImportError if `sentence-transformers` is not installed.
        """
        from sentence_transformers import SentenceTransformer  # type: ignore

        model = _get_model(self.model_name, SentenceTransformer)
        vec = model.encode(text or "", normalize_embeddings=False)
        # vec is usually numpy.ndarray; convert to Python list for portability
        return [float(x) for x in vec.tolist()]


@lru_cache(maxsize=2)
def _get_model(model_name: str, SentenceTransformer) -> object:
    return SentenceTransformer(model_name)


def _default_model_name() -> str:
    return (os.getenv("EMBEDDING_MODEL") or "all-MiniLM-L6-v2").strip()


@lru_cache(maxsize=1)
def get_default_embedding_service() -> EmbeddingService:
    return EmbeddingService(model_name=_default_model_name())

