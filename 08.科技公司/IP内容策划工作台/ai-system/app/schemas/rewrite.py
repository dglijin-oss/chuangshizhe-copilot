from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class RewriteRequest(BaseModel):
    content_id: int
    mode: str = "style_transfer"
    style: Optional[str] = "grounded"


class BatchRewriteRequest(BaseModel):
    content_ids: list[int]
    mode: str = "style_transfer"
    style: Optional[str] = "grounded"


class RewriteResult(BaseModel):
    id: int
    source_content_id: int
    rewrite_mode: str
    style_preset: Optional[str] = None
    title: Optional[str] = None
    rewritten_text: str
    created_at: datetime
    status: str = "draft"

    class Config:
        from_attributes = True
