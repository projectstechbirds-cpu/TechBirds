from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

DocType = Literal[
    "offer_letter",
    "hike_letter",
    "form_16",
    "form_26as",
    "relieving_letter",
    "id_card",
    "fnf_letter",
    "experience_letter",
]


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    user_name: str | None = None
    doc_type: DocType
    title: str
    period_label: str | None
    size_bytes: int | None
    mime_type: str
    issued_at: datetime
    deleted_at: datetime | None = None


class DocumentDelete(BaseModel):
    reason: str = Field(min_length=20, max_length=500)


class SignedUrlOut(BaseModel):
    url: str
    expires_in: int
