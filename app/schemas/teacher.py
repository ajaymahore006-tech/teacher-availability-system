from pydantic import BaseModel, EmailStr
from typing import Optional


# ==========================================
# 1. BASE CLASS — used for reading/returning data (has id, since DB always has it)
# ==========================================
class TeacherBase(BaseModel):
    id: str
    name: str
    email: EmailStr
    department_id: int


# ==========================================
# 2. CREATE SCHEMA — used for signup input (NO id, backend auto-generates it)
# ==========================================
class TeacherCreate(BaseModel):
    name: str
    email: EmailStr
    department_id: int
    password: str
    status: Optional[str] = "Not Available"


# ==========================================
# 3. SIGNUP + OTP SCHEMA — frontend sends this during signup (adds otp field)
# ==========================================
class TeacherSignupWithOTP(TeacherCreate):
    otp: str


# ==========================================
# 4. RESPONSE SCHEMA — full teacher data sent back (id present, no password)
# ==========================================
class TeacherResponse(TeacherBase):
    status: str

    class Config:
        from_attributes = True


# ==========================================
# 5. LOGIN SCHEMA — unchanged
# ==========================================
class TeacherLogin(BaseModel):
    email: EmailStr
    password: str


# ==========================================
# 6. STATUS UPDATE SCHEMA — unchanged
# ==========================================
class TeacherStatusUpdate(BaseModel):
    status: str  # "Available" or "Not Available"


# ==========================================
# 7. PUBLIC SCHEMA — used for teacher listing (id present, no password)
# ==========================================
class TeacherPublic(TeacherBase):
    status: str

    class Config:
        from_attributes = True
