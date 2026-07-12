from pydantic import BaseModel

# 1. The Base Class (Shared Fields)
class StudentBase(BaseModel):
    email: str
    name: str
    roll_no: int

# 3. Inherit for Response (Keep password out)
class StudentResponse(StudentBase):
    class Config:
        from_attribute = True


# Add this to schemas/student.py
class StudentLogin(BaseModel):
    email: str
    password: str

class StudentPasswordReset(BaseModel):
    email: str
    otp: str
    new_password: str    