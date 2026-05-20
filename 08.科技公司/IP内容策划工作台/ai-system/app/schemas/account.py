from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class AccountBase(BaseModel):
    platform: str
    account_name: str
    account_remark: Optional[str] = None
    account_id: str
    account_url: Optional[str] = None
    tags: Optional[str] = None


class AccountCreate(AccountBase):
    pass


class AccountUpdate(BaseModel):
    account_name: Optional[str] = None
    account_remark: Optional[str] = None
    account_url: Optional[str] = None
    is_active: Optional[bool] = None
    tags: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None


class AccountOut(AccountBase):
    id: int
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    follower_count: int = 0
    video_count: int = 0
    article_count: int = 0
    last_checked: Optional[datetime] = None
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
