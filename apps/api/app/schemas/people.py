from datetime import date
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class HolidayOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    date: date
    name: str
    region: str
    is_optional: bool
    notes: str | None


class BirthdayOut(BaseModel):
    user_id: UUID
    full_name: str
    designation: str | None
    dob_day: int
    dob_month: int
    days_until: int


class WorkAnniversaryOut(BaseModel):
    user_id: UUID
    full_name: str
    designation: str | None
    joined_at: date
    years: int
    days_until: int
