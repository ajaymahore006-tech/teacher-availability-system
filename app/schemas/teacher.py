# PLACE AT: app/schemas/teacher.py  (REPLACES your existing file)

from pydantic import BaseModel, EmailStr
from typing import Optional


# ==========================================
# 1. BASE CLASS — used for reading/returning data (has id, since DB always has it)
# ==========================================
class TeacherBase(BaseModel):
    id: str
    name: str
    email: EmailStr
    department_id: Optional[int] = None
    staff_type: str = "Teaching"


# ==========================================
# 2. RESPONSE SCHEMA — full teacher data sent back (id present, no password)
# ==========================================
class TeacherResponse(TeacherBase):
    status: str
    is_admin: bool

    class Config:
        from_attributes = True


# ==========================================
# 3. LOGIN SCHEMA — unchanged
# ==========================================
class TeacherLogin(BaseModel):
    email: EmailStr
    password: str


# ==========================================
# 4. STATUS UPDATE SCHEMA — unchanged
# ==========================================
class TeacherStatusUpdate(BaseModel):
    status: str  # "Available" or "Not Available"


# ==========================================
# 5. PUBLIC SCHEMA — used for teacher listing (id present, no password)
# ==========================================
class TeacherPublic(TeacherBase):
    status: str
    is_admin: bool = False

    class Config:
        from_attributes = True


# ==========================================
# 6. ADMIN: manually creating a teacher directly (optional shortcut, bypasses request flow)
# ==========================================
class TeacherAdminCreate(BaseModel):
    name: str
    email: EmailStr
    department_id: int
    staff_type: str = "Teaching"


# NOTE: TeacherCreate / TeacherSignupWithOTP have been REMOVED.
# Public teacher self-signup no longer exists — see teacher_request.py schemas
# and the /api/teacher/request-access + /api/admin/requests/{id}/approve flow.