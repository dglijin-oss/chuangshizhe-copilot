from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.content import CollectedContent, RewrittenContent
from app.schemas.rewrite import RewriteRequest, BatchRewriteRequest, RewriteResult
from app.rewriter.engine import RewriteEngine

router = APIRouter(prefix="/api", tags=["rewrite"])

engine = RewriteEngine()


@router.post("/rewrite", response_model=RewriteResult)
async def rewrite_content(data: RewriteRequest, db: Session = Depends(get_db)):
    content = db.query(CollectedContent).filter(CollectedContent.id == data.content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    text = content.full_text or content.description or content.title
    if not text:
        raise HTTPException(status_code=400, detail="Content has no text to rewrite")

    result = await engine.rewrite(text, mode=data.mode, style=data.style)

    rewritten = RewrittenContent(
        source_content_id=data.content_id,
        rewrite_mode=data.mode,
        style_preset=data.style,
        title=result["title"],
        rewritten_text=result["rewritten_text"],
        prompt_used=result["prompt_used"],
    )
    db.add(rewritten)
    db.commit()
    db.refresh(rewritten)
    return rewritten


@router.post("/rewrite/batch", response_model=list[RewriteResult])
async def batch_rewrite(data: BatchRewriteRequest, db: Session = Depends(get_db)):
    results = []
    for cid in data.content_ids:
        content = db.query(CollectedContent).filter(CollectedContent.id == cid).first()
        if not content:
            continue

        text = content.full_text or content.description or content.title
        if not text:
            continue

        result = await engine.rewrite(text, mode=data.mode, style=data.style)

        rewritten = RewrittenContent(
            source_content_id=cid,
            rewrite_mode=data.mode,
            style_preset=data.style,
            title=result["title"],
            rewritten_text=result["rewritten_text"],
            prompt_used=result["prompt_used"],
        )
        db.add(rewritten)
        results.append(rewritten)

    db.commit()
    for r in results:
        db.refresh(r)
    return results


@router.get("/rewrites", response_model=list[RewriteResult])
def list_rewrites(status: str = None, db: Session = Depends(get_db)):
    query = db.query(RewrittenContent)
    if status:
        query = query.filter(RewrittenContent.status == status)
    return query.order_by(RewrittenContent.created_at.desc()).all()


@router.get("/rewrites/{rewrite_id}", response_model=RewriteResult)
def get_rewrite(rewrite_id: int, db: Session = Depends(get_db)):
    item = db.query(RewrittenContent).filter(RewrittenContent.id == rewrite_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Rewrite not found")
    return item


@router.put("/rewrites/{rewrite_id}", response_model=RewriteResult)
def update_rewrite(rewrite_id: int, status: str = Query(default="draft"), db: Session = Depends(get_db)):
    item = db.query(RewrittenContent).filter(RewrittenContent.id == rewrite_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Rewrite not found")
    item.status = status
    db.commit()
    db.refresh(item)
    return item
