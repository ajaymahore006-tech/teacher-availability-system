from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.database import Base


class Student(Base):
    __tablename__ = "students"

    email = Column(String(191), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    password = Column(String(255), nullable=False)
    roll_no = Column(Integer, nullable=False, unique=True)
    section = Column(String(20), nullable=True)
    is_cr = Column(Boolean, default=False, nullable=False)

    request = relationship("Request", back_populates="student", cascade="all, delete-orphan")
