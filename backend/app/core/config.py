"""Application configuration loaded from environment variables."""

import os

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7  # 1 week
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./linguapath.db")

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
