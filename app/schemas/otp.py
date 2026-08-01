from pydantic import field_validator, BaseModel, EmailStr
from app.schemas.teacher import TeacherCreate
import re


# 1. Schema for Step 1: Requesting the OTP
class OTPRequest(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def validate_college_email(cls, value):
        pattern = r"^\d+@(cse|ece)\.iiitp\.ac\.in$"
        if not re.match(pattern, value):
            raise ValueError("Only IIITP college email addresses are allowed.")
        return value


# 2. Schema for Step 2: Submitting the OTP along with profile data to sign up
class StudentSignupWithOTP(OTPRequest):
    otp: str
    name: str
    roll_no: str
    password: str


# ==========================================
# TEACHER SPECIFIC SCHEMAS (Independent)
# ==========================================

# 1. Schema for Teacher OTP Request (No domain restriction for now)
class TeacherOTPRequest(BaseModel):
    email: EmailStr


# 2. Schema for Teacher Signup (Inherits from your existing TeacherCreate)
class TeacherSignupWithOTP(TeacherCreate):
    otp: str