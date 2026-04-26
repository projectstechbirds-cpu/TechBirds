from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Core
    SECRET_KEY: str = "dev-secret-change-me"
    ENVIRONMENT: str = "development"
    SENTRY_DSN: str | None = None
    APP_VERSION: str = "0.1.0"

    # Public URLs (used for sitemaps, links in emails, etc.)
    WWW_PUBLIC_URL: str = "https://techbirdsgroup.com"
    BLOG_PUBLIC_URL: str = "https://blog.techbirdsgroup.com"
    APP_PUBLIC_URL: str = "https://app.techbirdsgroup.com"

    # Tokens
    ACCESS_TOKEN_TTL_MINUTES: int = 15
    REFRESH_TOKEN_TTL_DAYS: int = 7
    OTP_TTL_MINUTES: int = 10
    OTP_MAX_ATTEMPTS: int = 5
    COOKIE_DOMAIN: str = ".techbirdsgroup.com"
    COOKIE_SECURE: bool = True

    # Database / Redis
    DATABASE_URL: str = "postgresql+asyncpg://techbirds:techbirds@localhost:5432/techbirds"
    DATABASE_URL_SYNC: str = "postgresql+psycopg://techbirds:techbirds@localhost:5432/techbirds"
    REDIS_URL_CACHE: str = "redis://localhost:6379/0"
    REDIS_URL_CELERY: str = "redis://localhost:6379/1"
    REDIS_URL_SESSIONS: str = "redis://localhost:6379/2"
    REDIS_URL_RATELIMIT: str = "redis://localhost:6379/3"

    # CORS
    CORS_ORIGINS: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "https://techbirdsgroup.com",
            "https://blog.techbirdsgroup.com",
            "https://app.techbirdsgroup.com",
        ]
    )

    # Email
    SMTP_HOST: str = "smtp.sendgrid.net"
    SMTP_PORT: int = 587
    SMTP_USER: str = "apikey"
    SMTP_PASSWORD: str = ""
    NOREPLY_FROM: str = "no-reply@techbirdsgroup.com"
    HR_FROM: str = "hr@techbirdsgroup.com"
    INFO_FROM: str = "info@techbirdsgroup.com"
    ADMIN_EMAILS: list[str] = Field(
        default_factory=lambda: [
            "info@techbirdsgroup.com",
            "prudhviraju.penumatsa@techbirdsgroup.com",
        ]
    )
    HR_EMAILS: list[str] = Field(default_factory=lambda: ["hr@techbirdsgroup.com"])
    SUPER_ADMIN_EMAIL: str = "prudhviraju.penumatsa@techbirdsgroup.com"

    # Cloudflare
    TURNSTILE_SECRET_KEY: str = ""
    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_PUBLIC: str = "techbirds-public"
    R2_BUCKET_BLOG: str = "techbirds-blog"
    R2_BUCKET_FEED: str = "techbirds-feed"
    R2_BUCKET_FILES: str = "techbirds-files"
    R2_BUCKET_BACKUPS: str = "techbirds-backups"


@lru_cache
def get_settings() -> Settings:
    return Settings()
