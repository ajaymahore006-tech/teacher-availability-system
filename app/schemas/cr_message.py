from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class CRMessageCreate(BaseModel):
    student_email: EmailStr
    title: str
    content: str


class CRBroadcastCreate(BaseModel):
    section: Optional[str] = None
    title: str
    content: str


class CRMessageResponse(BaseModel):
    id: int
    teacher_id: str
    teacher_name: Optional[str] = None
    student_email: str
    student_name: Optional[str] = None
    student_section: Optional[str] = None
    title: str
    content: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
