# PLACE AT: app/models/teacher_request.py  (NEW FILE)

from sqlalchemy import Column, Integer, String, DateTime, Text
from app.database import Base
from datetime import datetime


class TeacherAccessRequest(Base):
    __tablename__ = "teacher_access_requests"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(100), nullable=False)
    email = Column(String(191), nullable=False, index=True)
    department_id = Column(Integer, nullable=True)
    staff_type = Column(String(50), default="Teaching", nullable=False)
    message = Column(Text, nullable=True)  # optional note from the teacher

    # Pending -> Approved -> (Teacher row created, invite sent)
    # Pending -> Rejected
    status = Column(String(50), default="Pending", nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.utcnow())
    resolved_at = Column(DateTime, nullable=True)