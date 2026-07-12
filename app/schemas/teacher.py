from pydantic import BaseModel, EmailStr
from typing import Optional

# 1. The Base Class (Shared Fields)
class TeacherBase(BaseModel):
    id: str
    name: str
    email:EmailStr
    department_id: int

# 2. Inherit for Creation (Add password and default status)
class TeacherCreate(TeacherBase):
    password :str
    status : Optional[str]="Not Available"


# 3. Inherit for Response (Add status, but keep password out)
class TeacherResponse(TeacherBase):
    status: str

    class Config:
        from_attributes = True        


class TeacherLogin(BaseModel):
    email: EmailStr
    password: str

class TeacherStatusUpdate(BaseModel):
    status: str  # This will hold "Available" or "Not Available"    