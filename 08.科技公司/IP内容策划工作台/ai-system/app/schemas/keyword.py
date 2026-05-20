from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class KeywordBase(BaseModel):
    term: str
    platform: str = "all"
    category: str = "general"
    is_active: bool = True


class KeywordCreate(KeywordBase):
    pass


class KeywordUpdate(BaseModel):
    term: Optional[str] = None
    platform: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None
    heat_score: Optional[int] = None
    trend: Optional[str] = None


class KeywordOut(KeywordBase):
    id: int
    heat_score: int
    trend: str
    created_at: datetime
    updated_at: datetime
    last_searched: Optional[datetime] = None

    class Config:
        from_attributes = True
