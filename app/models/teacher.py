from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    password = Column(String(255), nullable=False)
    status = Column(String(50), default='Not Available')
    email = Column(String(191), unique=True, index=True)

    # Foriegn key linking to departments
    department_id = Column(Integer, ForeignKey('departments.id', ondelete='CASCADE'))

    # Relationships
    department = relationship("Department", back_populates="teachers")
    request = relationship("Request", back_populates='teacher')