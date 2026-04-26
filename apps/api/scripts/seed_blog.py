"""Idempotent seed for the blog. Inserts the 3 launch posts if missing.

Run with: python -m scripts.seed_blog
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone

from sqlalchemy import select

from app.db import SessionLocal
from app.models.blog import BlogPost

POSTS = [
    {
        "slug": "self-hosting-postgres-in-2026",
        "title": "Self-hosting Postgres in 2026",
        "excerpt": "Why we left a managed DB for a single $14 KVM, and what we'd do differently.",
        "tags": ["infra", "postgres", "ops"],
        "reading_minutes": 8,
        "author_name": "Prudhvi Raju",
        "published_at": datetime(2026, 3, 12, tzinfo=timezone.utc),
        "body_md": """\
## Why we moved off managed Postgres

Managed Postgres was costing us six times what a single KVM does, and we
weren't using a single managed feature that we couldn't replicate ourselves
in an evening.

### What we set up

- Postgres 16 on Hostinger KVM1
- Daily logical backups streamed to Cloudflare R2
- WAL archiving for point-in-time recovery
- A boring `systemd` unit, no Kubernetes

### What we'd do differently

If we did it again we'd start with `pgbackrest` from day one — our hand-rolled
script worked, but the first restore drill exposed a missing piece around
permissions on the recovery directory.
""",
    },
    {
        "slug": "designing-for-ops-not-demos",
        "title": "Designing for ops, not demos",
        "excerpt": "Logs, metrics, and runbooks deserve the same care as the login screen.",
        "tags": ["engineering", "ops"],
        "reading_minutes": 6,
        "author_name": "TechBirds Studio",
        "published_at": datetime(2026, 2, 4, tzinfo=timezone.utc),
        "body_md": """\
Most product demos optimise for the **happy path**. Real systems live in the
unhappy path — the 3 a.m. page, the half-stuck queue, the failed migration.

We treat observability as a first-class feature: every endpoint emits a
structured log, every job emits a metric, every runbook starts with the
exact `psql` query the on-call engineer should run first.
""",
    },
    {
        "slug": "fixed-price-engagements-actually-work",
        "title": "Why fixed-price engagements actually work",
        "excerpt": "Five years of evidence that 'we'll figure it out as we go' isn't friendlier — it's lazier.",
        "tags": ["studio", "process"],
        "reading_minutes": 5,
        "author_name": "Prudhvi Raju",
        "published_at": datetime(2026, 1, 20, tzinfo=timezone.utc),
        "body_md": """\
A fixed price isn't a constraint on creativity — it's a forcing function for
**clarity**. When the number is locked, scope conversations happen earlier
and the trade-offs become explicit.

> "We don't sell hours. We sell the thing that ships."

That's the whole pitch.
""",
    },
]


async def main() -> None:
    async with SessionLocal() as session:
        for post in POSTS:
            existing = await session.scalar(select(BlogPost).where(BlogPost.slug == post["slug"]))
            if existing:
                print(f"= {post['slug']}")
                continue
            session.add(BlogPost(status="published", **post))
            print(f"+ {post['slug']}")
        await session.commit()


if __name__ == "__main__":
    asyncio.run(main())
