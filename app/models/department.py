from sqlalchemy import Column, String, Integer
from sqlalchemy.orm import relationship
from database import Base

class Department(Base):
    __tablename__ = 'departments'

    id = Column(Integer, primary_key=True,index=True)
    name = Column(String(100), unique=True, nullable=False)

    # Relationship to the Teacher model
    teachers = relationship("Teacher", back_populates="department")