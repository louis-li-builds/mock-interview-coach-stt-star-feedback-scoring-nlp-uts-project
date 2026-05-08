"""
Lightweight NLP evaluation layer for Path A (mock) scoring.

Layout::

    preprocess/   — STT text normalization + tokens
    analyzers/    — keyword, structure, fluency, evidence, confidence
    scoring/      — weighted overall + rubric breakdown rows
    feedback/     — template suggestions
    mock_engine.py — wires stages into ``ScoreResponse``

Shared result dataclasses live in ``types.py``.
"""

from .mock_engine import evaluate_mock_nlp

__all__ = ["evaluate_mock_nlp"]
