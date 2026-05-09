"""Optional embedding utilities (lazy-loaded; gated by env)."""

from .service import EmbeddingService, cosine_similarity, get_default_embedding_service

__all__ = [
    "EmbeddingService",
    "cosine_similarity",
    "get_default_embedding_service",
]
