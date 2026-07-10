from pydantic import BaseModel
from datetime import datetime

# 1. The Base Class (Shared Fields)
class RequestBase(BaseModel):
    doubt: str
    teacher_id: str
    student_email: str

# 2. Inherit for Creation
class RequestCreate(RequestBase):
    pass # 'pass' means we just use the Base fields exactly as they are    

class RequestResponse(RequestBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True