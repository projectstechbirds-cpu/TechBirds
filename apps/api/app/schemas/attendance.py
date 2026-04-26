from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

PunchType = Literal["in", "out"]


class PunchCreate(BaseModel):
    note: str | None = Field(default=None, max_length=255)


class PunchEntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    type: PunchType
    source: str
    note: str | None
    created_at: datetime


class TodayState(BaseModel):
    is_punched_in: bool
    last_entry: PunchEntryOut | None
    today_total_minutes: int
    today_date: date


class HistoryDay(BaseModel):
    date: date
    entries: list[PunchEntryOut]
    total_minutes: int


class HistoryResponse(BaseModel):
    days: list[HistoryDay]
