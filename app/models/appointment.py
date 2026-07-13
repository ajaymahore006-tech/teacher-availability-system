from sqlalchemy import Column, String, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


class Appointment(Base):
    __tablename__="appointments"
    id = Column(Integer, primary_key=True, index=True)

    student_email= Column(String(191), ForeignKey("students.email", ondelete="CASCADE"), nullable=False)
    teacher_id = Column(String(191), ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False)

    status = Column(String(50),default="pending")
    purpose = Column(String(255))
    created_at = Column(DateTime, default=lambda:datetime.now(timezone.utc))

    # Optional: Add relationships if you want to easily fetch the full student/teacher objects later
    # student = relationship("Student", back_populates="appointments")
    # teacher = relationship("Teacher", back_populates="appointments")



  