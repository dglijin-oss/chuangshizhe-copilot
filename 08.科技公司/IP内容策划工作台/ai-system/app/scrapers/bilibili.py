import httpx
from datetime import datetime
from app.config import settings
from app.scrapers.base import BaseScraper


class BilibiliScraper(BaseScraper):
    """Scrape content from Bilibili user accounts via TikHub API."""

    def __init__(self):
        config = settings.scraping_config.get("bilibili", {})
        super().__init__(
            request_interval=config.get("request_interval", 2.0),
            max_retries=config.get("max_retries", 3),
            rotate_ua=False,
        )
        self.base_url = settings.TIKHUB_BASE_URL
        self.api_key = settings.TIKHUB_API_KEY

    async def _fetch_user_videos(self, user_id: str, limit: int = 20) -> list[dict]:
        """Call tikhub Bilibili user videos endpoint."""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        url = f"{self.base_url}/api/v1/bilibili/app/fetch_user_videos"
        params = {
            "user_id": user_id,
            "count": limit,
            "order": "pubdate",
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(url, headers=headers, params=params)
            resp.raise_for_status()
            return resp.json()

    async def get_account_content(self, account_id: str, limit: int = 20) -> list[dict]:
        """Fetch recent videos from a Bilibili user via TikHub.

        Returns list of dicts compatible with CollectedContent model.
        """
        data = await self._fetch_user_videos(account_id, limit)

        items = data.get("data", {}).get("data", {}).get("item", [])
        results = []

        for v in items:
            ctime = v.get("ctime", 0)
            pubdate = datetime.fromtimestamp(ctime) if ctime else None

            item = {
                "platform": "bilibili",
                "content_type": "video",
                "external_id": f"bili_{v.get('param', '') or v.get('bvid', '')}",
                "title": v.get("title", ""),
                "description": "",
                "url": f"https://www.bilibili.com/video/{v.get('bvid', '')}",
                "thumbnail_url": v.get("cover", ""),
                "publish_date": pubdate,
                "view_count": v.get("play", 0),
                "like_count": 0,
                "comment_count": v.get("danmaku", 0),
                "share_count": 0,
                "tags": v.get("tname", ""),
                "raw_metadata": v,
                "is_processed": False,
                "is_dedup": False,
            }
            results.append(item)
            await self._sleep()

        return results
