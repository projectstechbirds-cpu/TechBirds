from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class FeedPostCreate(BaseModel):
    body_md: str = Field(min_length=1, max_length=10_000)
    attachments: list[dict[str, Any]] | None = None
    pinned: bool = False


class ReactionCount(BaseModel):
    emoji: str
    count: int
    reacted: bool


class FeedPostOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    author_id: UUID
    author_name: str | None
    body_md: str
    attachments: list[dict[str, Any]] | None
    pinned: bool
    reactions: list[ReactionCount]
    created_at: datetime


class FeedListResponse(BaseModel):
    items: list[FeedPostOut]
    total: int
    page: int
    page_size: int


class ReactionToggle(BaseModel):
    emoji: str = Field(min_length=1, max_length=8)
