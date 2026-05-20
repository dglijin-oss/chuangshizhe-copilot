from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from app.database import Base


class Keyword(Base):
    __tablename__ = "keywords"

    id = Column(Integer, primary_key=True, autoincrement=True)
    term = Column(String(100), nullable=False, unique=True)
    platform = Column(String(20), nullable=False, default="all")
    category = Column(String(30), nullable=False, default="general")
    is_active = Column(Boolean, nullable=False, default=True)
    heat_score = Column(Integer, nullable=False, default=0)
    trend = Column(String(10), nullable=False, default="stable")
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
    last_searched = Column(DateTime, nullable=True)
