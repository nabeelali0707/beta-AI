from typing import List, Optional

from pydantic import BaseModel


class HistoryItem(BaseModel):
    id: str
    title: str
    ai_score: float | None = None
    plagiarism_score: float | None = None
    summary: str | None = None
    metadata: Optional[str] = None
    created_at: str

    class Config:
        orm_mode = True


class HistoryList(BaseModel):
    history: List[HistoryItem]
