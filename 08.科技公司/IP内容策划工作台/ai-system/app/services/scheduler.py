import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from app.config import settings
from app.database import get_db_context
from app.models.account import TargetAccount
from app.models.keyword import Keyword
from datetime import datetime

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


def _get_scraper(platform: str):
    """Get scraper instance for platform."""
    if platform == "bilibili":
        from app.scrapers.bilibili import BilibiliScraper
        return BilibiliScraper()
    elif platform == "wechat":
        from app.scrapers.wechat import WechatScraper
        return WechatScraper()
    return None


async def check_accounts_job():
    """Periodically check all active accounts for new content."""
    logger.info("Starting periodic account check job")
    with get_db_context() as db:
        accounts = db.query(TargetAccount).filter(TargetAccount.is_active == True).all()
        for account in accounts:
            try:
                scraper = _get_scraper(account.platform)
                if not scraper:
                    logger.warning(f"No scraper for platform: {account.platform}")
                    continue
                items = await scraper.get_account_content(account.account_id, limit=20)
                count = 0
                for item in items:
                    from app.models.content import CollectedContent
                    existing = db.query(CollectedContent).filter(
                        CollectedContent.external_id == item["external_id"]
                    ).first()
                    if not existing:
                        content = CollectedContent(account_id=account.id, **item)
                        db.add(content)
                        count += 1
                account.last_checked = datetime.now()
                db.commit()
                if count > 0:
                    logger.info(f"Account {account.account_name}: {count} new items")
            except Exception as e:
                logger.error(f"Error checking account {account.id}: {e}")
    logger.info("Account check job completed")


async def keyword_search_job():
    """Periodically search for trending content by keywords."""
    logger.info("Starting keyword search job")
    with get_db_context() as db:
        keywords = db.query(Keyword).filter(Keyword.is_active == True).all()
        for kw in keywords:
            try:
                kw.last_searched = datetime.now()
                db.commit()
            except Exception as e:
                logger.error(f"Error searching keyword {kw.term}: {e}")
    logger.info("Keyword search job completed")


async def cleanup_job():
    """Periodically clean up old data."""
    logger.info("Starting cleanup job")
    from app.models.content import CollectedContent, RewrittenContent
    from app.models.task import ScrapeTask
    from sqlalchemy import delete
    cutoff = datetime.now().replace(hour=0, minute=0, second=0)

    with get_db_context() as db:
        # Clean up finished tasks older than 7 days
        old_cutoff = datetime.now().replace(hour=0, minute=0, second=0)
        from datetime import timedelta
        old_cutoff = old_cutoff - timedelta(days=7)
        result = db.execute(
            delete(ScrapeTask).where(ScrapeTask.status == "completed", ScrapeTask.finished_at < old_cutoff)
        )
        deleted = result.rowcount
        db.commit()
        if deleted:
            logger.info(f"Cleaned up {deleted} old tasks")
    logger.info("Cleanup job completed")


def start_scheduler():
    """Start the APScheduler with configured jobs."""
    config = settings.scheduler_config

    kw_config = config.get("keyword_search", {})
    if kw_config.get("enabled"):
        scheduler.add_job(
            keyword_search_job,
            trigger=IntervalTrigger(minutes=kw_config.get("interval_minutes", 30)),
            id="keyword_search",
            replace_existing=True,
        )

    acc_config = config.get("account_check", {})
    if acc_config.get("enabled"):
        scheduler.add_job(
            check_accounts_job,
            trigger=IntervalTrigger(minutes=acc_config.get("interval_minutes", 60)),
            id="account_check",
            replace_existing=True,
        )

    clean_config = config.get("cleanup", {})
    if clean_config.get("enabled"):
        scheduler.add_job(
            cleanup_job,
            trigger=IntervalTrigger(hours=clean_config.get("interval_hours", 24)),
            id="cleanup",
            replace_existing=True,
        )

    scheduler.start()
    logger.info(f"Scheduler started with {len(scheduler.get_jobs())} jobs")


def stop_scheduler():
    """Stop the scheduler gracefully."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")
