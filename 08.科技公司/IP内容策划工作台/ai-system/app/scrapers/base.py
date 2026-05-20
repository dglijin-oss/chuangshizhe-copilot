from abc import ABC, abstractmethod
import asyncio
import random


class BaseScraper(ABC):
    """Base class for platform scrapers."""

    USER_AGENTS = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    ]

    def __init__(self, request_interval: float = 2.0, max_retries: int = 3, rotate_ua: bool = True):
        self.request_interval = request_interval
        self.max_retries = max_retries
        self.rotate_ua = rotate_ua

    def _get_ua(self) -> str:
        if self.rotate_ua:
            return random.choice(self.USER_AGENTS)
        return self.USER_AGENTS[0]

    async def _sleep(self):
        jitter = self.request_interval * 0.3
        await asyncio.sleep(self.request_interval + random.uniform(-jitter, jitter))

    @abstractmethod
    async def get_account_content(self, account_id: str, limit: int = 20) -> list[dict]:
        """Fetch recent content from a user account.

        Returns a list of dicts compatible with CollectedContent model.
        """
        ...
