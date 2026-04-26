"""Idempotent seed for default leave types.

Run with: python -m scripts.seed_leave
"""

from __future__ import annotations

import asyncio

from sqlalchemy import select

from app.db import SessionLocal
from app.models.leave import LeaveType

TYPES = [
    {"code": "sick", "name": "Sick leave", "default_annual_quota": 7, "is_paid": True,
     "description": "For illness or medical appointments."},
    {"code": "casual", "name": "Casual leave", "default_annual_quota": 12, "is_paid": True,
     "description": "Personal errands and short breaks."},
    {"code": "earned", "name": "Earned leave", "default_annual_quota": 18, "is_paid": True,
     "description": "Annual vacation, accrued through the year."},
    {"code": "unpaid", "name": "Unpaid leave", "default_annual_quota": 0, "is_paid": False,
     "description": "Approved time off without pay."},
]


async def main() -> None:
    async with SessionLocal() as session:
        for t in TYPES:
            existing = await session.scalar(select(LeaveType).where(LeaveType.code == t["code"]))
            if existing:
                print(f"= {t['code']}")
                continue
            session.add(LeaveType(**t))
            print(f"+ {t['code']}")
        await session.commit()


if __name__ == "__main__":
    asyncio.run(main())
