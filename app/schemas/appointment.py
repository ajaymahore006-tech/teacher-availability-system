from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class AppointmentCreate(BaseModel):
    teacher_id: str
    purpose: str


class AppointmentResponse(BaseModel):
    id: int
    student_email: EmailStr
    student_name: Optional[str] = None
    student_roll_no: Optional[int] = None
    student_section: Optional[str] = None
    student_is_cr: Optional[bool] = False
    teacher_id: str
    purpose: str
    status: str
    created_at: datetime
    has_unread: bool = False

    class Config:
        from_attributes = True


class AppointmentUpdate(BaseModel):
    status: str
