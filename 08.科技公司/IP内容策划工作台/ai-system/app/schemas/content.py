from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any


class ContentOut(BaseModel):
    id: int
    account_id: Optional[int] = None
    platform: str
    content_type: str
    external_id: str
    title: str
    description: Optional[str] = None
    url: str
    thumbnail_url: Optional[str] = None
    publish_date: Optional[datetime] = None
    scraped_at: datetime
    view_count: int = 0
    like_count: int = 0
    comment_count: int = 0
    share_count: int = 0
    tags: Optional[str] = None
    is_processed: bool = False

    class Config:
        from_attributes = True


class ContentDetail(ContentOut):
    full_text: Optional[str] = None
    raw_metadata: Optional[Any] = None
    is_dedup: bool = False


class ContentExport(BaseModel):
    ids: list[int]
    format: str = "markdown"
