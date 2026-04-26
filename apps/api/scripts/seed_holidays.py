"""Idempotent seed for Indian public holidays (2026).

Run with: python -m scripts.seed_holidays
"""

from __future__ import annotations

import asyncio
from datetime import date

from sqlalchemy import select

from app.db import SessionLocal
from app.models.people import Holiday

HOLIDAYS_2026 = [
    (date(2026, 1, 1), "New Year's Day", False),
    (date(2026, 1, 14), "Pongal / Makar Sankranti", False),
    (date(2026, 1, 26), "Republic Day", False),
    (date(2026, 3, 4), "Holi", False),
    (date(2026, 3, 31), "Eid-ul-Fitr", True),
    (date(2026, 4, 14), "Ambedkar Jayanti", True),
    (date(2026, 5, 1), "May Day", True),
    (date(2026, 8, 15), "Independence Day", False),
    (date(2026, 8, 26), "Ganesh Chaturthi", True),
    (date(2026, 10, 2), "Gandhi Jayanti", False),
    (date(2026, 10, 20), "Dussehra", False),
    (date(2026, 11, 8), "Diwali", False),
    (date(2026, 12, 25), "Christmas", False),
]


async def main() -> None:
    async with SessionLocal() as session:
        for d, name, optional in HOLIDAYS_2026:
            existing = await session.scalar(
                select(Holiday).where(Holiday.date == d, Holiday.name == name)
            )
            if existing:
                print(f"= {d} {name}")
                continue
            session.add(Holiday(date=d, name=name, region="IN", is_optional=optional))
            print(f"+ {d} {name}")
        await session.commit()


if __name__ == "__main__":
    asyncio.run(main())
