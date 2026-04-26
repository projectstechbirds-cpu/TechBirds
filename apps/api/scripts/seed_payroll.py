"""Idempotent seed: a sample salary structure for the super_admin user.

Useful for end-to-end testing the payroll run flow in dev. Picks up the user
referenced by SUPER_ADMIN_EMAIL and creates one structure with a typical
earnings/deductions split if none exists.

Run with: python -m scripts.seed_payroll
"""

from __future__ import annotations

import asyncio
from datetime import date
from decimal import Decimal

from sqlalchemy import select

from app.config import get_settings
from app.db import SessionLocal
from app.models.auth import User
from app.models.payroll import SalaryComponent, SalaryStructure


async def main() -> None:
    s = get_settings()
    async with SessionLocal() as session:
        user = await session.scalar(select(User).where(User.email == s.SUPER_ADMIN_EMAIL))
        if user is None:
            print(f"! No user for {s.SUPER_ADMIN_EMAIL}; run seed_admin first.")
            return
        existing = await session.scalar(
            select(SalaryStructure).where(SalaryStructure.user_id == user.id)
        )
        if existing is not None:
            print(f"= salary structure for {user.email}")
            return
        ctc = Decimal("1800000")
        structure = SalaryStructure(
            user_id=user.id,
            effective_from=date(2026, 4, 1),
            ctc_annual=ctc,
            notes="Seed structure",
        )
        session.add(structure)
        await session.flush()
        components = [
            ("BASIC", "Basic", "earning", Decimal("60000"), 1),
            ("HRA", "House Rent Allowance", "earning", Decimal("30000"), 2),
            ("SPECIAL", "Special allowance", "earning", Decimal("50000"), 3),
            ("LTA", "LTA", "earning", Decimal("5000"), 4),
            ("PF", "Provident Fund", "deduction", Decimal("7200"), 10),
            ("PT", "Professional Tax", "deduction", Decimal("200"), 11),
            ("TDS", "TDS", "deduction", Decimal("12000"), 12),
        ]
        for code, name, kind, amount, order in components:
            session.add(
                SalaryComponent(
                    structure_id=structure.id,
                    code=code,
                    name=name,
                    kind=kind,
                    monthly_amount=amount,
                    sort_order=order,
                )
            )
        await session.commit()
        print(f"+ salary structure for {user.email}")


if __name__ == "__main__":
    asyncio.run(main())
