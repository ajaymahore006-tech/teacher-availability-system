from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from datetime import datetime, timezone
from app.database import Base


class CRMessage(Base):
    __tablename__ = "cr_messages"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(String(191), ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False)
    student_email = Column(String(191), ForeignKey("students.email", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
