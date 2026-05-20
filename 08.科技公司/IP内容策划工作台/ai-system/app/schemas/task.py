from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any


class TaskOut(BaseModel):
    id: int
    task_type: str
    platform: Optional[str] = None
    status: str
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TaskDetail(TaskOut):
    result_json: Optional[Any] = None
