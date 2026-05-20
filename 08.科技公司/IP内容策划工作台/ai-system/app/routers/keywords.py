from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.keyword import Keyword
from app.schemas.keyword import KeywordCreate, KeywordUpdate, KeywordOut

router = APIRouter(prefix="/api/keywords", tags=["keywords"])


@router.get("", response_model=list[KeywordOut])
def list_keywords(active_only: bool = False, platform: str = None, category: str = None, db: Session = Depends(get_db)):
    query = db.query(Keyword)
    if active_only:
        query = query.filter(Keyword.is_active == True)
    if platform:
        query = query.filter(Keyword.platform.in_([platform, "all"]))
    if category:
        query = query.filter(Keyword.category == category)
    return query.order_by(Keyword.heat_score.desc()).all()


@router.post("", response_model=KeywordOut)
def create_keyword(data: KeywordCreate, db: Session = Depends(get_db)):
    existing = db.query(Keyword).filter(Keyword.term == data.term).first()
    if existing:
        raise HTTPException(status_code=400, detail="Keyword already exists")
    kw = Keyword(**data.model_dump())
    db.add(kw)
    db.commit()
    db.refresh(kw)
    return kw


@router.put("/{keyword_id}", response_model=KeywordOut)
def update_keyword(keyword_id: int, data: KeywordUpdate, db: Session = Depends(get_db)):
    kw = db.query(Keyword).filter(Keyword.id == keyword_id).first()
    if not kw:
        raise HTTPException(status_code=404, detail="Keyword not found")
    update_data = data.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(kw, k, v)
    db.commit()
    db.refresh(kw)
    return kw


@router.delete("/{keyword_id}")
def delete_keyword(keyword_id: int, db: Session = Depends(get_db)):
    kw = db.query(Keyword).filter(Keyword.id == keyword_id).first()
    if not kw:
        raise HTTPException(status_code=404, detail="Keyword not found")
    db.delete(kw)
    db.commit()
    return {"ok": True}
