"""Bootstrap the super-admin user + base roles.

Idempotent. Run once after the first migration:
    python -m scripts.seed_admin
"""

from __future__ import annotations

import asyncio

from sqlalchemy import select

from app.config import get_settings
from app.db import SessionLocal
from app.models.auth import Role, User, UserRole

ROLES = [
    ("super_admin", "Full platform access"),
    ("admin", "Studio admin / HR"),
    ("employee", "Logged-in employee"),
]


async def main() -> None:
    s = get_settings()
    async with SessionLocal() as session:
        role_map: dict[str, Role] = {}
        for name, desc in ROLES:
            role = await session.scalar(select(Role).where(Role.name == name))
            if role is None:
                role = Role(name=name, description=desc)
                session.add(role)
                await session.flush()
                print(f"+ role {name}")
            role_map[name] = role

        admin_email = s.SUPER_ADMIN_EMAIL.lower()
        admin = await session.scalar(select(User).where(User.email == admin_email))
        if admin is None:
            admin = User(email=admin_email, full_name="Prudhvi Raju", is_employee=True)
            session.add(admin)
            await session.flush()
            print(f"+ user {admin_email}")
        else:
            print(f"= user {admin_email}")

        existing = {ur.role_id for ur in (
            await session.scalars(select(UserRole).where(UserRole.user_id == admin.id))
        ).all()}
        for name in ("super_admin", "admin", "employee"):
            rid = role_map[name].id
            if rid not in existing:
                session.add(UserRole(user_id=admin.id, role_id=rid))
                print(f"  + role:{name}")

        await session.commit()


if __name__ == "__main__":
    asyncio.run(main())
