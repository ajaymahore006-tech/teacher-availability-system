# PLACE AT: app/schemas/appointment.py  (REPLACES your existing file)

from pydantic import BaseModel, EmailStr
from datetime import datetime


class AppointmentCreate(BaseModel):
    teacher_id: str
    purpose: str


class AppointmentResponse(BaseModel):
    id: int
    student_email: EmailStr
    teacher_id: str
    purpose: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class AppointmentUpdate(BaseModel):
    status: str   