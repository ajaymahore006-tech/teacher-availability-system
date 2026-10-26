from pydantic import BaseModel, EmailStr
from typing import Optional


# 1. The Base Class (Shared Fields)
class StudentBase(BaseModel):
    email: EmailStr
    name: str
    roll_no: int
    section: Optional[str] = None
    is_cr: bool = False


# 2. Inherit for Response (Keep password out)
class StudentResponse(StudentBase):
    class Config:
        from_attributes = True


class StudentSearchResponse(StudentBase):
    class Config:
        from_attributes = True


class StudentLogin(BaseModel):
    email: EmailStr
    password: str


class StudentPasswordReset(BaseModel):
    email: EmailStr
    otp: str
    new_password: str


class StudentSignup(StudentBase):
    password: str


class StudentUpdateSection(BaseModel):
    section: str
