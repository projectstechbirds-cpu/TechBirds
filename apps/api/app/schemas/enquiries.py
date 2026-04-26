from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

EnquiryType = Literal["general", "project", "careers", "press", "other"]
ProjectType = Literal["web", "mobile", "erp", "ecom", "cloud", "ai"]
BudgetRange = Literal["<5L", "5-15L", "15-50L", "50L+"]
EnquiryStatus = Literal["new", "read", "replied", "won", "lost", "spam"]


class EnquiryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=64)
    company: str | None = Field(default=None, max_length=255)
    enquiry_type: EnquiryType
    project_type: ProjectType | None = None
    budget_range: BudgetRange | None = None
    message: str = Field(min_length=20, max_length=5000)
    turnstile_token: str = Field(min_length=1)
    # Honeypot — must remain empty. Bots tend to fill every field.
    website: str | None = Field(default=None, max_length=0)


class EnquiryResponse(BaseModel):
    id: UUID
    status: EnquiryStatus
    created_at: datetime
