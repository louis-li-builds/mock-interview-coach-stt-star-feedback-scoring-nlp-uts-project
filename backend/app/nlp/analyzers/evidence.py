"""Heuristic score for quantifiable outcomes (numbers, KPI-style words)."""

from __future__ import annotations

import re

_QUANT_HINTS = (
    r"\bpercent\b",
    r"\bpercentage\b",
    r"\bkpi\b",
    r"\bmetric\b",
    r"\bmillion\b",
    r"\bthousand\b",
    r"\bhours?\b",
    r"\bminutes?\b",
    r"\bmonths?\b",
    r"\byears?\b",
    r"\bdollars?\b",
    r"\bgrowth\b",
    r"\breduced\b",
    r"\bincreased\b",
    r"\bimproved\b",
    r"\broi\b",
)


def score_measurable_evidence(clean_text: str) -> float:
    """Return 0..100 for how much measurable / numeric substance appears."""
    base = 35.0
    if re.search(r"\d", clean_text):
        base += 35.0
    hits = sum(1 for p in _QUANT_HINTS if re.search(p, clean_text))
    base += min(30.0, hits * 7.0)
    return max(0.0, min(100.0, base))
