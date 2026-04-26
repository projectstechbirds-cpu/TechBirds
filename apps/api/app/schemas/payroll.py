from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


PayrollRunStatus = Literal["draft", "locked", "computed", "released"]


class SalaryComponentIn(BaseModel):
    code: str = Field(min_length=1, max_length=32)
    name: str = Field(min_length=1, max_length=120)
    kind: Literal["earning", "deduction"]
    monthly_amount: Decimal = Field(ge=0)
    is_taxable: bool = True
    sort_order: int = 0


class SalaryComponentOut(SalaryComponentIn):
    model_config = ConfigDict(from_attributes=True)
    id: int


class SalaryStructureCreate(BaseModel):
    user_id: UUID
    effective_from: date
    effective_to: date | None = None
    ctc_annual: Decimal = Field(ge=0)
    notes: str | None = None
    components: list[SalaryComponentIn] = Field(default_factory=list)


class SalaryStructureOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    user_id: UUID
    effective_from: date
    effective_to: date | None
    ctc_annual: Decimal
    notes: str | None
    components: list[SalaryComponentOut] = Field(default_factory=list)
    created_at: datetime


class PayrollRunCreate(BaseModel):
    year: int = Field(ge=2020, le=2100)
    month: int = Field(ge=1, le=12)
    notes: str | None = None


class PayrollRunOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    year: int
    month: int
    status: PayrollRunStatus
    locked_at: datetime | None
    computed_at: datetime | None
    released_at: datetime | None
    notes: str | None
    created_at: datetime


class PayslipLine(BaseModel):
    code: str
    name: str
    amount: Decimal


class PayslipBreakdown(BaseModel):
    earnings: list[PayslipLine] = Field(default_factory=list)
    deductions: list[PayslipLine] = Field(default_factory=list)


class PayslipOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    payroll_run_id: UUID
    user_id: UUID
    user_name: str | None = None
    employee_code: str | None = None
    year: int
    month: int
    working_days: Decimal
    paid_days: Decimal
    gross: Decimal
    total_earnings: Decimal
    total_deductions: Decimal
    net_pay: Decimal
    breakdown: PayslipBreakdown | None = None
    has_pdf: bool = False
    generated_at: datetime | None
    deleted_at: datetime | None = None


class PayslipDelete(BaseModel):
    reason: str = Field(min_length=20, max_length=500)
