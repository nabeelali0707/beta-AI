from enum import Enum
from typing import List, Optional

from pydantic import BaseModel


class SummaryType(str, Enum):
    short = "short"
    detailed = "detailed"
    bullet = "bullet"


class AIAnalysisRequest(BaseModel):
    title: Optional[str] = "AI Detection"
    text: str


class PlagiarismRequest(BaseModel):
    title: Optional[str] = "Plagiarism Check"
    text: str


class SummaryRequest(BaseModel):
    title: Optional[str] = "Text Summary"
    text: str
    summary_type: SummaryType = SummaryType.short


class FullReportRequest(BaseModel):
    title: Optional[str] = "Full Analysis Report"
    text: str


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
