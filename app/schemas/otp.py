from pydantic import field_validator, BaseModel
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
