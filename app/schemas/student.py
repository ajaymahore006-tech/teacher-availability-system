from pydantic import BaseModel, field_validator
import re


# Schema for data coming IN (creating a student)
class StudentBase(BaseModel):
    email: str
    name: str
    roll_no: str

    @field_validator("email")
    @classmethod
    def validate_college_email(cls, value):
        pattern = r"^\d+@(cse|ece)\.iiitp\.ac\.in$"

        if not re.match(pattern, value):
            raise ValueError("Only IIITP college email addresses are allowed.")
        return value


# 2. Inherit for Creation (Add the sensitive password)
class Student_Create(StudentBase):
    password = str


# 3. Inherit for Response (Keep password out)
class Student_response(StudentBase):
    class Config:
        from_attribute = True
