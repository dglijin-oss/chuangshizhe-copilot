from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.account import TargetAccount
from app.models.content import CollectedContent
from app.schemas.account import AccountCreate, AccountUpdate, AccountOut

router = APIRouter(prefix="/api/accounts", tags=["accounts"])


@router.get("/parse-url")
def parse_account_url(url: str = Query(..., description="Account homepage URL")):
    """Parse an account URL to extract platform, account ID, and name."""
    import re
    from urllib.parse import urlparse

    parsed = urlparse(url)
    hostname = parsed.hostname or ''
    path = parsed.path

    # Bilibili space page
    bilibili_match = re.search(r'space\.bilibili\.com/(\d+)', url)
    if bilibili_match:
        mid = bilibili_match.group(1)
        return {"platform": "bilibili", "account_id": mid, "account_url": url}

    # Bilibili video page (can't extract account_id directly)
    if 'bilibili.com' in hostname and '/video/' in path:
        return {"platform": "bilibili", "account_id": "", "account_url": url, "note": "视频链接，需从UP主空间页获取"}

    # WeChat
    if 'weixin' in hostname or 'channels' in hostname:
        return {"platform": "wechat", "account_id": "", "account_url": url, "note": "视频号需手动配置"}

    raise HTTPException(status_code=400, detail="无法识别的平台或URL格式")


@router.get("", response_model=list[AccountOut])
def list_accounts(platform: str = None, active_only: bool = False, db: Session = Depends(get_db)):
    query = db.query(TargetAccount)
    if platform:
        query = query.filter(TargetAccount.platform == platform)
    if active_only:
        query = query.filter(TargetAccount.is_active == True)
    return query.order_by(TargetAccount.created_at.desc()).all()



def _fetch_account_name(platform: str, account_id: str) -> str:
    """Fetch account name from tikhub API via fetch_user_videos author field."""
    import httpx
    from app.config import settings

    if not account_id or not settings.TIKHUB_API_KEY:
        return ""

    if platform == "bilibili":
        try:
            url = f"{settings.TIKHUB_BASE_URL}/api/v1/bilibili/app/fetch_user_videos"
            resp = httpx.get(url, params={"user_id": account_id, "count": 1, "order": "pubdate"},
                             headers={"Authorization": f"Bearer {settings.TIKHUB_API_KEY}"},
                             timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                items = data.get("data", {}).get("data", {}).get("item", [])
                if items:
                    return items[0].get("author", "")
        except Exception:
            pass
    return ""


@router.post("", response_model=AccountOut)
def create_account(data: AccountCreate, db: Session = Depends(get_db)):
    existing = db.query(TargetAccount).filter(
        TargetAccount.account_id == data.account_id,
        TargetAccount.platform == data.platform
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Account already exists")

    account_data = data.model_dump()
    # Auto-fetch name from tikhub if not provided by frontend
    if not account_data.get("account_name"):
        account_data["account_name"] = _fetch_account_name(data.platform, data.account_id) or "未知"

    account = TargetAccount(**account_data)
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@router.put("/{account_id}", response_model=AccountOut)
def update_account(account_id: int, data: AccountUpdate, db: Session = Depends(get_db)):
    account = db.query(TargetAccount).filter(TargetAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    update_data = data.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(account, k, v)
    db.commit()
    db.refresh(account)
    return account


@router.delete("/{account_id}")
def delete_account(account_id: int, db: Session = Depends(get_db)):
    account = db.query(TargetAccount).filter(TargetAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    db.delete(account)
    db.commit()
    return {"ok": True}


@router.get("/{account_id}/content")
def get_account_content(account_id: int, limit: int = 20, offset: int = 0, db: Session = Depends(get_db)):
    account = db.query(TargetAccount).filter(TargetAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    items = db.query(CollectedContent).filter(
        CollectedContent.account_id == account_id
    ).order_by(CollectedContent.scraped_at.desc()).offset(offset).limit(limit).all()
    return items


@router.post("/{account_id}/check")
def trigger_account_check(account_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    account = db.query(TargetAccount).filter(TargetAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    background_tasks.add_task(_check_account_async, account_id)
    return {"task_id": account_id, "message": "Account check queued"}


async def _check_account_async(account_id: int):
    from app.scrapers.bilibili import BilibiliScraper
    from app.scrapers.wechat import WechatScraper
    from datetime import datetime
    from app.database import get_db_context

    with get_db_context() as db:
        account = db.query(TargetAccount).filter(TargetAccount.id == account_id).first()
        if not account:
            return

        scraper = None
        if account.platform == "bilibili":
            scraper = BilibiliScraper()
        elif account.platform == "wechat":
            scraper = WechatScraper()
        if not scraper:
            return

        try:
            items = await scraper.get_account_content(account.account_id, limit=20)
            for item in items:
                existing = db.query(CollectedContent).filter(
                    CollectedContent.external_id == item["external_id"]
                ).first()
                if not existing:
                    content = CollectedContent(account_id=account.id, **item)
                    db.add(content)
            account.last_checked = datetime.now()
            db.commit()
        except Exception as e:
            print(f"Error checking account {account.id}: {e}")
