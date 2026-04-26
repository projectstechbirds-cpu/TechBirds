"""Internal feed: posts + reactions. Visible to logged-in users only."""

from __future__ import annotations

from collections import defaultdict
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.deps.auth import current_user, role_names
from app.models.auth import User
from app.models.feed import FeedPost, FeedReaction
from app.schemas.feed import (
    FeedListResponse,
    FeedPostCreate,
    FeedPostOut,
    ReactionCount,
    ReactionToggle,
)

router = APIRouter(prefix="/feed", tags=["feed"])

POST_ROLES = {"admin", "super_admin", "hr"}


def _can_post(user: User) -> bool:
    return bool(set(role_names(user)).intersection(POST_ROLES))


async def _post_to_out(
    session: AsyncSession,
    post: FeedPost,
    *,
    viewer: User,
    author_name_map: dict[UUID, str] | None = None,
) -> FeedPostOut:
    counts: dict[str, int] = defaultdict(int)
    viewer_set: set[str] = set()
    rxs = (
        await session.scalars(select(FeedReaction).where(FeedReaction.post_id == post.id))
    ).all()
    for r in rxs:
        counts[r.emoji] += 1
        if r.user_id == viewer.id:
            viewer_set.add(r.emoji)

    if author_name_map is not None:
        author_name = author_name_map.get(post.author_id)
    else:
        u = await session.get(User, post.author_id)
        author_name = u.full_name if u else None

    return FeedPostOut(
        id=post.id,
        author_id=post.author_id,
        author_name=author_name,
        body_md=post.body_md,
        attachments=post.attachments,
        pinned=post.pinned,
        reactions=[
            ReactionCount(emoji=e, count=c, reacted=e in viewer_set)
            for e, c in sorted(counts.items(), key=lambda kv: -kv[1])
        ],
        created_at=post.created_at,
    )


@router.get("/posts", response_model=FeedListResponse)
async def list_posts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    viewer: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> FeedListResponse:
    base = select(FeedPost).where(FeedPost.deleted_at.is_(None))
    total = (await session.scalar(select(func.count()).select_from(base.subquery()))) or 0
    rows = (
        await session.scalars(
            base.order_by(desc(FeedPost.pinned), desc(FeedPost.created_at))
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    ).all()

    author_ids = {p.author_id for p in rows}
    authors = (
        await session.scalars(select(User).where(User.id.in_(author_ids))) if author_ids else []
    )
    name_map: dict[UUID, str] = {u.id: u.full_name for u in authors} if author_ids else {}

    items = [await _post_to_out(session, p, viewer=viewer, author_name_map=name_map) for p in rows]
    return FeedListResponse(items=items, total=total, page=page, page_size=page_size)


@router.post("/posts", response_model=FeedPostOut, status_code=status.HTTP_201_CREATED)
async def create_post(
    payload: FeedPostCreate,
    viewer: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> FeedPostOut:
    if not _can_post(viewer):
        raise HTTPException(
            status_code=403, detail="Only admins can post to the feed (for now)"
        )
    post = FeedPost(
        author_id=viewer.id,
        body_md=payload.body_md,
        attachments=payload.attachments,
        pinned=payload.pinned,
    )
    session.add(post)
    await session.commit()
    await session.refresh(post)
    return await _post_to_out(session, post, viewer=viewer)


@router.delete("/posts/{post_id}", status_code=status.HTTP_200_OK)
async def delete_post(
    post_id: UUID,
    viewer: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    post = await session.get(FeedPost, post_id)
    if post is None or post.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Not found")
    if post.author_id != viewer.id and not _can_post(viewer):
        raise HTTPException(status_code=403, detail="Forbidden")
    from datetime import datetime, timezone

    post.deleted_at = datetime.now(timezone.utc)
    await session.commit()


@router.post("/posts/{post_id}/react", response_model=FeedPostOut)
async def toggle_react(
    post_id: UUID,
    payload: ReactionToggle,
    viewer: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> FeedPostOut:
    post = await session.get(FeedPost, post_id)
    if post is None or post.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Not found")

    existing = await session.scalar(
        select(FeedReaction).where(
            FeedReaction.post_id == post_id,
            FeedReaction.user_id == viewer.id,
            FeedReaction.emoji == payload.emoji,
        )
    )
    if existing is not None:
        await session.delete(existing)
    else:
        session.add(FeedReaction(post_id=post_id, user_id=viewer.id, emoji=payload.emoji))
    await session.commit()
    return await _post_to_out(session, post, viewer=viewer)
