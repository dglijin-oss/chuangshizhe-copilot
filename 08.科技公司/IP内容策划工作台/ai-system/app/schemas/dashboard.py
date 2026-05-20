from pydantic import BaseModel
from typing import Optional


class DashboardStats(BaseModel):
    total_keywords: int = 0
    active_keywords: int = 0
    total_accounts: int = 0
    active_accounts: int = 0
    total_content: int = 0
    total_rewrites: int = 0
    today_content: int = 0
    today_rewrites: int = 0
    pending_tasks: int = 0
    running_tasks: int = 0


class TrendingKeyword(BaseModel):
    term: str
    heat_score: int
    trend: str
    category: str
