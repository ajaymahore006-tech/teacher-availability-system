from sqlalchemy import Column, String, Integer, ForeignKey, DateTime
from datetime import datetime, timezone
from app.database import Base


class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(Integer, primary_key=True, index=True)

    student_email = Column(String(191), ForeignKey("students.email", ondelete="CASCADE"), nullable=False)
    teacher_id = Column(String(191), ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False)

    status = Column(String(50), default="Pending")
    purpose = Column(String(255))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    # Read tracking: when each side last opened this appointment's chat
    student_last_read = Column(DateTime, nullable=True)
    teacher_last_read = Column(DateTime, nullable=True)
