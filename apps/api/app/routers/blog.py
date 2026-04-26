"""Public blog endpoints — backs blog.techbirdsgroup.com."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db import get_session
from app.models.blog import BlogPost
from app.schemas.blog import BlogListResponse, BlogPostDetail, BlogPostSummary, BlogTag

router = APIRouter(prefix="/blog", tags=["blog"])


def _published_filter():
    return BlogPost.status == "published"


@router.get("/posts", response_model=BlogListResponse)
async def list_posts(
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    tag: str | None = None,
    session: AsyncSession = Depends(get_session),
) -> BlogListResponse:
    stmt = select(BlogPost).where(_published_filter())
    if tag:
        stmt = stmt.where(BlogPost.tags.any(tag))

    total = (
        await session.scalar(select(func.count()).select_from(stmt.subquery()))
    ) or 0

    rows = (
        await session.scalars(
            stmt.order_by(desc(BlogPost.published_at))
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    ).all()

    return BlogListResponse(
        items=[BlogPostSummary.model_validate(p) for p in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/posts/{slug}", response_model=BlogPostDetail)
async def get_post(slug: str, session: AsyncSession = Depends(get_session)) -> BlogPostDetail:
    post = await session.scalar(
        select(BlogPost).where(BlogPost.slug == slug, _published_filter())
    )
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    return BlogPostDetail.model_validate(post)


@router.get("/sitemap.xml", include_in_schema=False)
async def blog_sitemap(session: AsyncSession = Depends(get_session)) -> Response:
    """Dynamic sitemap of published blog posts."""
    settings = get_settings()
    base = settings.BLOG_PUBLIC_URL.rstrip("/")
    rows = (
        await session.scalars(
            select(BlogPost).where(_published_filter()).order_by(desc(BlogPost.published_at))
        )
    ).all()
    parts = ['<?xml version="1.0" encoding="UTF-8"?>']
    parts.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    parts.append(f"  <url><loc>{base}/</loc><changefreq>daily</changefreq></url>")
    for p in rows:
        lastmod = (p.updated_at or p.published_at)
        loc = f"{base}/posts/{p.slug}"
        if lastmod is not None:
            parts.append(
                f"  <url><loc>{loc}</loc><lastmod>{lastmod.date().isoformat()}</lastmod></url>"
            )
        else:
            parts.append(f"  <url><loc>{loc}</loc></url>")
    parts.append("</urlset>")
    return Response(content="\n".join(parts), media_type="application/xml")


@router.get("/tags", response_model=list[BlogTag])
async def list_tags(session: AsyncSession = Depends(get_session)) -> list[BlogTag]:
    """Aggregate distinct tags across all published posts."""
    tag_col = func.unnest(BlogPost.tags).label("tag")
    stmt = (
        select(tag_col, func.count().label("count"))
        .where(_published_filter())
        .group_by(tag_col)
        .order_by(desc("count"))
    )
    rows = (await session.execute(stmt)).all()
    return [BlogTag(tag=r.tag, count=r.count) for r in rows]
