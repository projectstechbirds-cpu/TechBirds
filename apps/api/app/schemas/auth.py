from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class OtpRequest(BaseModel):
    email: EmailStr


class OtpVerify(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


class UserPublic(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    is_employee: bool
    roles: list[str]
    last_login_at: datetime | None


class AuthOk(BaseModel):
    ok: bool = True
    user: UserPublic


class GenericOk(BaseModel):
    ok: bool = True
