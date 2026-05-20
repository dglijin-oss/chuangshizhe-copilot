from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, func
from app.database import Base


class ScrapeTask(Base):
    __tablename__ = "scrape_tasks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    task_type = Column(String(30), nullable=False)
    platform = Column(String(20), nullable=True)
    target_ids = Column(JSON, nullable=True)
    status = Column(String(20), nullable=False, default="pending")
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)
    result_json = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
