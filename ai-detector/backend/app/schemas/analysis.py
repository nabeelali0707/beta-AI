from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class SummaryType(str, Enum):
    short = "short"
    detailed = "detailed"
    bullet = "bullet"


class AIAnalysisRequest(BaseModel):
    title: Optional[str] = Field(default="AI Detection", max_length=255)
    text: str = Field(min_length=1)


class PlagiarismRequest(BaseModel):
    title: Optional[str] = Field(default="Plagiarism Check", max_length=255)
    text: str = Field(min_length=1)


class SummaryRequest(BaseModel):
    title: Optional[str] = Field(default="Text Summary", max_length=255)
    text: str = Field(min_length=1)
    summary_type: SummaryType = SummaryType.short


class FullReportRequest(BaseModel):
    title: Optional[str] = Field(default="Full Analysis Report", max_length=255)
    text: str = Field(min_length=1)


class SentenceAnalysis(BaseModel):
    sentence: str
    ai_score: float
    suspicious: bool


class AIAnalysisResponse(BaseModel):
    ai_score: float
    confidence_score: float
    sentence_analysis: List[SentenceAnalysis]


class PlagiarismSection(BaseModel):
    text: str
    similarity: float
    source: Optional[str] = None


class PlagiarismResponse(BaseModel):
    plagiarism_score: float
    matched_sections: List[PlagiarismSection]
    matches_found: int


class SummaryResponse(BaseModel):
    summary: str
    summary_type: SummaryType


class FullReportResponse(BaseModel):
    ai_score: float
    plagiarism_score: float
    summary: str
    analytics: dict
