# PLACE AT: app/schemas/otp.py  (REPLACES your existing file)

from pydantic import field_validator, BaseModel
import re


# 1. Schema for Step 1: Requesting the OTP (STUDENT SIGNUP — unchanged)
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
# NOTE: roll_no is now DERIVED server-side from the email prefix (the MIS number),
# not taken from client input. See app/routers/student.py signup logic.
class StudentSignupWithOTP(OTPRequest):
    otp: str
    name: str
    password: str


# ==========================================
# TEACHER OTP SCHEMAS — REMOVED.
# Teachers no longer self-signup via OTP. See app/schemas/teacher_request.py
# for the new request-access + admin-approval flow.
# ==========================================