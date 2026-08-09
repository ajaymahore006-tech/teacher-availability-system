# PLACE AT: app/schemas/teacher_request.py  (NEW FILE)

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class TeacherAccessRequestCreate(BaseModel):
    name: str
    email: EmailStr
    department_id: int
    message: Optional[str] = None
    staff_type: str = "Teaching"   


class TeacherAccessRequestResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    department_id: Optional[int]
    message: Optional[str]
    status: str
    created_at: datetime
    staff_type: str

    class Config:
        from_attributes = True


class SetPasswordRequest(BaseModel):
    token: str
    new_password: str