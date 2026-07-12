from sqlalchemy import Column, Integer, String, DateTime
from app.database import Base
import datetime


class OTPCode(Base):
    __tablename__="otp_codes"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(191), nullable=False, index=True)
    otp = Column(String(6), nullable=False)

    # We will set the expiration time manually when we create the OTP
    expires_at = Column(DateTime, nullable=False)
    