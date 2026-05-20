from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, func
from app.database import Base


class TargetAccount(Base):
    __tablename__ = "target_accounts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    platform = Column(String(20), nullable=False)
    account_name = Column(String(200), nullable=False)
    account_remark = Column(String(500), nullable=True)
    account_id = Column(String(100), nullable=False, unique=True)
    account_url = Column(String(500), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    follower_count = Column(Integer, nullable=False, default=0)
    video_count = Column(Integer, nullable=False, default=0)
    article_count = Column(Integer, nullable=False, default=0)
    last_checked = Column(DateTime, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    tags = Column(String(200), nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
