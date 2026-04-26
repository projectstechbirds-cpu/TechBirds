from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

LeaveStatus = Literal["pending", "approved", "rejected", "cancelled"]


class LeaveTypeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str
    default_annual_quota: float
    is_paid: bool
    description: str | None


class LeaveBalanceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    leave_type_id: int
    leave_type_code: str
    leave_type_name: str
    year: int
    quota: float
    used: float
    remaining: float


class LeaveRequestCreate(BaseModel):
    leave_type_id: int
    from_date: date
    to_date: date
    reason: str | None = Field(default=None, max_length=2000)

    @model_validator(mode="after")
    def _check_range(self) -> "LeaveRequestCreate":
        if self.to_date < self.from_date:
            raise ValueError("to_date must be on or after from_date")
        return self


class LeaveDecision(BaseModel):
    decision: Literal["approved", "rejected"]
    note: str | None = Field(default=None, max_length=2000)


class LeaveRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    user_name: str | None = None
    leave_type_id: int
    leave_type_code: str | None = None
    leave_type_name: str | None = None
    from_date: date
    to_date: date
    days: float
    reason: str | None
    status: LeaveStatus
    decided_by: UUID | None
    decided_at: datetime | None
    decision_note: str | None
    created_at: datetime
