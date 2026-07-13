from pydantic import BaseModel, EmailStr

# 1. The Base Class (Shared Fields)
class StudentBase(BaseModel):
    email: EmailStr
    name: str
    roll_no: int

# 3. Inherit for Response (Keep password out)
class StudentResponse(StudentBase):
    class Config:
        from_attributes = True


# Add this to schemas/student.py
class StudentLogin(BaseModel):
    email: EmailStr
    password: str

class StudentPasswordReset(BaseModel):
    email: EmailStr
    otp: str
    new_password: str    