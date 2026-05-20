from app.config import settings
from app.scrapers.base import BaseScraper


class WechatScraper(BaseScraper):
    """Scrape content from WeChat Video Accounts (视频号) via TikHub API.

    Requires valid TikHub API key with WeChat/Weixin endpoint access.
    """

    def __init__(self):
        config = settings.scraping_config.get("wechat", {})
        super().__init__(
            request_interval=config.get("request_interval", 5.0),
            max_retries=3,
            rotate_ua=False,
        )
        self.base_url = settings.TIKHUB_BASE_URL
        self.api_key = settings.TIKHUB_API_KEY

    async def get_account_content(self, account_id: str, limit: int = 20) -> list[dict]:
        """Fetch recent videos from a WeChat Video Account via TikHub.

        Stub implementation — needs TikHub WeChat endpoints configured.
        """
        # TODO: Implement when TikHub WeChat endpoints are available
        # Typical endpoint: GET /api/v1/weixin/user/videos
        return []
