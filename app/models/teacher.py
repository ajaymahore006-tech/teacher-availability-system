# PLACE AT: app/models/teacher.py  (REPLACES your existing file)

from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.database import Base


class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)

    # CHANGED: password is now nullable. A teacher record can exist
    # (created by admin approval) BEFORE the teacher has set a password.
    # They can't log in until this is set.
    password = Column(String(255), nullable=True)

    status = Column(String(50), default='Not Available')
    email = Column(String(191), unique=True, index=True)

    # Foreign key linking to departments (already nullable — fine for admin-only accounts)
    department_id = Column(Integer, ForeignKey('departments.id', ondelete='CASCADE'), nullable=True)

    # NEW: Admin flag. Any teacher row can be promoted to admin.
    is_admin = Column(Boolean, default=False, nullable=False)

    # NEW: One-time token used for the "set your password" link sent after
    # admin approval. Cleared once used.
    setup_token = Column(String(255), nullable=True, unique=True, index=True)
    setup_token_expires = Column(DateTime, nullable=True)

    # Relationships
    department = relationship("Department", back_populates="teachers")
    request = relationship("Request", back_populates='teacher')