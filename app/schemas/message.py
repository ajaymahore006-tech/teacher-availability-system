# PLACE AT: app/schemas/message.py  (NEW FILE)

from pydantic import BaseModel
from datetime import datetime


class MessageCreate(BaseModel):
    content: str


class MessageResponse(BaseModel):
    id: int
    appointment_id: int
    sender_role: str
    sender_email: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True