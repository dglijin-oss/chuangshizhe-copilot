from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.database import get_db
from app.models.keyword import Keyword
from app.models.account import TargetAccount
from app.models.content import CollectedContent, RewrittenContent
from app.models.task import ScrapeTask
from app.schemas.dashboard import DashboardStats, TrendingKeyword

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db)):
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    return DashboardStats(
        total_keywords=db.query(Keyword).count(),
        active_keywords=db.query(Keyword).filter(Keyword.is_active == True).count(),
        total_accounts=db.query(TargetAccount).count(),
        active_accounts=db.query(TargetAccount).filter(TargetAccount.is_active == True).count(),
        total_content=db.query(CollectedContent).count(),
        total_rewrites=db.query(RewrittenContent).count(),
        today_content=db.query(CollectedContent).filter(CollectedContent.scraped_at >= today_start).count(),
        today_rewrites=db.query(RewrittenContent).filter(RewrittenContent.created_at >= today_start).count(),
        pending_tasks=db.query(ScrapeTask).filter(ScrapeTask.status == "pending").count(),
        running_tasks=db.query(ScrapeTask).filter(ScrapeTask.status == "running").count(),
    )


@router.get("/trending", response_model=list[TrendingKeyword])
def get_trending_keywords(limit: int = 10, db: Session = Depends(get_db)):
    keywords = (
        db.query(Keyword)
        .filter(Keyword.is_active == True)
        .order_by(Keyword.heat_score.desc())
        .limit(limit)
        .all()
    )
    return [
        TrendingKeyword(
            term=kw.term,
            heat_score=kw.heat_score,
            trend=kw.trend,
            category=kw.category,
        )
        for kw in keywords
    ]
