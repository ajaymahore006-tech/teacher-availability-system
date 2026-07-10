from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Teacher(Base):
    __tablename__ = "terachers"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    password = Column(String(255), nullable=False)
    status = Column(String(50), default='Not Available')

    # Foriegn key linking to departments
    department_id = Column(Integer, ForeignKey('departments.id', ondelete='CASCADE'))

    # Relationships
    department = relationship("Department", back_populates="teachers")
    request = relationship("Request", back_populates='teacher')