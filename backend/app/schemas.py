from typing import Literal

from pydantic import BaseModel, Field


class TranscribeResponse(BaseModel):
    transcript: str


class ScoreRequest(BaseModel):
    transcript: str
    question_title: str = Field(..., min_length=1)
    question_body: str = Field(..., min_length=1)


class BreakdownRow(BaseModel):
    label: str
    score: float
    max: float


class ScoreResponse(BaseModel):
    overall_score: int = Field(..., ge=0, le=100)
    breakdown: list[BreakdownRow]
    suggestions: list[str]
    source: Literal["llm", "mock"] = "mock"
