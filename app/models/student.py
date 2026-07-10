from sqlalchemy import Column, Integer, String
from database import Base
from sqlalchemy.orm import relationship


class Student:
    __tablename__ = "students"

    email = Column(String(191), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    password = Column(String(255), nullable=False)
    roll_no = Column(Integer, nullable=False, unique=True)

    # Add this line inside your Student class in models/student.py
    request = relationship("Request", back_populates="student", cascade="all, delete-orphan")
