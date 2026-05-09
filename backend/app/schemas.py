from typing import Literal

from pydantic import BaseModel, Field


class TranscribeResponse(BaseModel):
    transcript: str


class ScoreRequest(BaseModel):
    transcript: str
    question_title: str = Field(..., min_length=1)
    question_body: str = Field(..., min_length=1)
    force_mock: bool = Field(
        False,
        description="If true, use deterministic mock scoring even when OPENAI_API_KEY is set.",
    )


class BreakdownRow(BaseModel):
    label: str
    score: float
    max: float


class ScoreResponse(BaseModel):
    overall_score: int = Field(..., ge=0, le=100)
    breakdown: list[BreakdownRow]
    suggestions: list[str]
    source: Literal["llm", "mock"] = "mock"
    mock_variant: Literal["rule", "hybrid"] | None = Field(
        None,
        description="Only set when source=mock. 'hybrid' means embeddings were enabled and actually used.",
    )
