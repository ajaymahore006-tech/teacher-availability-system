# PLACE AT: app/models/message.py  (NEW FILE)

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from app.database import Base
from datetime import datetime


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="CASCADE"), nullable=False, index=True)

    # "student" or "teacher" — tells us which side sent it, so the UI can align bubbles left/right
    sender_role = Column(String(20), nullable=False)
    sender_email = Column(String(191), nullable=False)

    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.utcnow())