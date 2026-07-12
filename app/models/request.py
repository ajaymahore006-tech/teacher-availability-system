from sqlalchemy import Column, String, Integer, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
import datetime
from app.database import Base

class Request(Base):
    __tablename__ = "requests"

    id = Column(Integer, primary_key=True, index=True)
    doubt = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # foreign keys
    teacher_id = Column(String(50), ForeignKey('teachers.id', ondelete="CASCADE"), nullable=False)
    student_email = Column(String(191), ForeignKey('students.email', ondelete="CASCADE"), nullable=False)

    # Relationships
    student = relationship("Student", back_populates="request")
    teacher = relationship("Teacher", back_populates='request')
