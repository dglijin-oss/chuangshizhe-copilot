from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON, func
from app.database import Base


class CollectedContent(Base):
    __tablename__ = "collected_content"

    id = Column(Integer, primary_key=True, autoincrement=True)
    account_id = Column(Integer, ForeignKey("target_accounts.id"), nullable=True)
    platform = Column(String(20), nullable=False)
    content_type = Column(String(20), nullable=False)
    external_id = Column(String(100), nullable=False, unique=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    full_text = Column(Text, nullable=True)
    url = Column(String(500), nullable=False)
    thumbnail_url = Column(String(500), nullable=True)
    publish_date = Column(DateTime, nullable=True)
    scraped_at = Column(DateTime, nullable=False, server_default=func.now())
    view_count = Column(Integer, nullable=False, default=0)
    like_count = Column(Integer, nullable=False, default=0)
    comment_count = Column(Integer, nullable=False, default=0)
    share_count = Column(Integer, nullable=False, default=0)
    tags = Column(String(300), nullable=True)
    raw_metadata = Column(JSON, nullable=True)
    is_processed = Column(Boolean, nullable=False, default=False)
    is_dedup = Column(Boolean, nullable=False, default=False)


class RewrittenContent(Base):
    __tablename__ = "rewritten_content"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source_content_id = Column(Integer, ForeignKey("collected_content.id"), nullable=False)
    rewrite_mode = Column(String(30), nullable=False)
    style_preset = Column(String(30), nullable=True)
    title = Column(String(500), nullable=True)
    rewritten_text = Column(Text, nullable=False)
    prompt_used = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    status = Column(String(20), nullable=False, default="draft")
