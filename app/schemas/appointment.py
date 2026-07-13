from pydantic import BaseModel
class AppointmentCreate(BaseModel):
    teacher_id: str
    purpose: str  