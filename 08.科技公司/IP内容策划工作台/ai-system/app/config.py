import os
from pathlib import Path
from pydantic_settings import BaseSettings
from pydantic import Field
import yaml

BASE_DIR = Path(__file__).resolve().parent.parent


def load_yaml_config() -> dict:
    config_path = BASE_DIR / "config.yaml"
    if config_path.exists():
        with open(config_path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)
    return {}


_yaml_config = load_yaml_config()


class Settings(BaseSettings):
    # Server
    SERVER_HOST: str = Field(default="127.0.0.1")
    SERVER_PORT: int = Field(default=8000)

    # Database
    DB_PATH: str = Field(default="./data/ai_system.db")

    # LLM
    LLM_API_KEY: str = Field(default="")
    LLM_BASE_URL: str = Field(default="https://api.openai.com/v1")
    LLM_MODEL: str = Field(default="gpt-4o")

    # Playwright
    PLAYWRIGHT_HEADLESS: bool = Field(default=True)

    # TikHub API (social media data proxy)
    TIKHUB_API_KEY: str = Field(default="")
    TIKHUB_BASE_URL: str = Field(default="https://api.tikhub.io")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    @property
    def db_url(self) -> str:
        return f"sqlite:///{self.DB_PATH}"

    @property
    def llm_config(self) -> dict:
        return {
            "api_key": self.LLM_API_KEY,
            "base_url": self.LLM_BASE_URL,
            "model": self.LLM_MODEL,
            "temperature": _yaml_config.get("llm", {}).get("temperature", 0.8),
            "max_tokens": _yaml_config.get("llm", {}).get("max_tokens", 4000),
            "timeout": _yaml_config.get("llm", {}).get("timeout", 60),
            "batch_concurrency": _yaml_config.get("llm", {}).get("batch_concurrency", 3),
        }

    @property
    def scraping_config(self) -> dict:
        return _yaml_config.get("scraping", {})

    @property
    def scheduler_config(self) -> dict:
        return _yaml_config.get("scheduler", {})

    @property
    def rewriting_config(self) -> dict:
        return _yaml_config.get("rewriting", {})

    @property
    def app_name(self) -> str:
        return _yaml_config.get("app", {}).get("name", "AI内容采集改写系统")


settings = Settings()
