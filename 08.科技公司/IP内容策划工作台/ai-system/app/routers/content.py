from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.content import CollectedContent
from app.schemas.content import ContentOut, ContentDetail

router = APIRouter(prefix="/api/content", tags=["content"])


@router.get("", response_model=list[ContentOut])
def list_content(
    platform: str = None,
    content_type: str = None,
    processed: bool = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
    db: Session = Depends(get_db),
):
    query = db.query(CollectedContent)
    if platform:
        query = query.filter(CollectedContent.platform == platform)
    if content_type:
        query = query.filter(CollectedContent.content_type == content_type)
    if processed is not None:
        query = query.filter(CollectedContent.is_processed == processed)
    return query.order_by(CollectedContent.scraped_at.desc()).offset(offset).limit(limit).all()


@router.get("/{content_id}", response_model=ContentDetail)
def get_content(content_id: int, db: Session = Depends(get_db)):
    item = db.query(CollectedContent).filter(CollectedContent.id == content_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Content not found")
    return item


@router.post("/{content_id}/process")
def mark_processed(content_id: int, db: Session = Depends(get_db)):
    item = db.query(CollectedContent).filter(CollectedContent.id == content_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Content not found")
    item.is_processed = True
    db.commit()
    return {"ok": True}


@router.delete("/{content_id}")
def delete_content(content_id: int, db: Session = Depends(get_db)):
    item = db.query(CollectedContent).filter(CollectedContent.id == content_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Content not found")
    db.delete(item)
    db.commit()
    return {"ok": True}
