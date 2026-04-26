from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class BlogPostSummary(BaseModel):
    """Listing card — no body."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    slug: str
    title: str
    excerpt: str
    cover_image: str | None
    tags: list[str]
    reading_minutes: int
    author_name: str | None
    published_at: datetime | None


class BlogPostDetail(BlogPostSummary):
    """Full post — includes markdown body."""

    body_md: str


class BlogTag(BaseModel):
    tag: str
    count: int


class BlogListResponse(BaseModel):
    items: list[BlogPostSummary]
    total: int
    page: int
    page_size: int
