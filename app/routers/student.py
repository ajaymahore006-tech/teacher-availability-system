# PLACE AT: app/routers/student.py  (REPLACES your existing file)

import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.student import Student
from app.schemas.student import StudentLogin, StudentResponse, StudentPasswordReset
from app.utils.security import verify_password, create_access_token, get_password_hash, get_current_user_email, get_current_student
from app.utils.email_sender import send_otp_email
import random
from datetime import datetime, timedelta
from app.schemas.otp import OTPRequest, StudentSignupWithOTP
from app.models.otp import OTPCode

router = APIRouter(prefix="/api/student", tags=["Student Authentication"])


@router.post("/send-otp")
def send_registration_otp(request: OTPRequest, db: Session = Depends(get_db)):
    existing_student = db.query(Student).filter(Student.email == request.email).first()
    if existing_student:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    otp_code = str(random.randint(100000, 999999))
    expiration_time = datetime.now() + timedelta(minutes=10)

    existing_otp_record = db.query(OTPCode).filter(OTPCode.email == request.email).first()
    if existing_otp_record:
        existing_otp_record.otp = otp_code
        existing_otp_record.expires_at = expiration_time
    else:
        new_otp_record = OTPCode(email=request.email, otp=otp_code, expires_at=expiration_time)
        db.add(new_otp_record)

    db.commit()

    email_sent = send_otp_email(request.email, otp_code)
    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send the email. Please try again later.",
        )

    return {"message": "OTP sent successfully. Please check your college email."}


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def register_student(request: StudentSignupWithOTP, db: Session = Depends(get_db)):
    otp_record = db.query(OTPCode).filter(OTPCode.email == request.email).first()

    if not otp_record:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No OTP requested for this email.")
    if otp_record.otp != request.otp:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP code.")
    if otp_record.expires_at < datetime.now():
        db.delete(otp_record)
        db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP has expired. Please request a new one.")

    # NEW: Derive the MIS/roll number from the email itself (e.g. "1124115120@cse.iiitp.ac.in" -> 1124115120)
    # We do this server-side (not trusting any client-supplied value) since the email
    # was already validated against the college domain pattern by the OTPRequest schema.
    match = re.match(r"^(\d+)@", request.email)
    if not match:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not extract MIS number from email.")
    derived_roll_no = int(match.group(1))

    existing_roll = db.query(Student).filter(Student.roll_no == derived_roll_no).first()
    if existing_roll:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This roll number is already registered.")

    hashed_password = get_password_hash(request.password)
    new_student = Student(
        email=request.email,
        password=hashed_password,
        name=request.name,
        roll_no=derived_roll_no,
    )

    db.add(new_student)
    db.delete(otp_record)
    db.commit()
    db.refresh(new_student)

    access_token = create_access_token(data={"sub": new_student.email, "role": "student"})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login")
def login_student(credentials: StudentLogin, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.email == credentials.email).first()

    if not student or not verify_password(credentials.password, student.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": student.email, "role": "student"})
    return {"access_token": access_token, "token_type": "bearer", "message": "Login successful"}


@router.post("/forgot-password")
def forgot_password(request: OTPRequest, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.email == request.email).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account with this email does not exist.")

    otp_code = str(random.randint(100000, 999999))
    expiration_time = datetime.now() + timedelta(minutes=10)

    existing_otp_record = db.query(OTPCode).filter(OTPCode.email == request.email).first()
    if existing_otp_record:
        existing_otp_record.otp = otp_code
        existing_otp_record.expires_at = expiration_time
    else:
        new_otp_record = OTPCode(email=request.email, otp=otp_code, expires_at=expiration_time)
        db.add(new_otp_record)

    db.commit()

    email_sent = send_otp_email(request.email, otp_code)
    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send the reset email. Please try again later.",
        )

    return {"message": "Password reset OTP sent successfully. Please check your college email."}


@router.post("/reset-password")
def reset_password(request: StudentPasswordReset, db: Session = Depends(get_db)):
    otp_record = db.query(OTPCode).filter(OTPCode.email == request.email).first()
    student = db.query(Student).filter(Student.email == request.email).first()

    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found.")
    if not otp_record or otp_record.otp != request.otp:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or missing OTP.")
    if otp_record.expires_at < datetime.now():
        db.delete(otp_record)
        db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP has expired.")

    student.password = get_password_hash(request.new_password)
    db.delete(otp_record)
    db.commit()

    return {"message": "Password has been reset successfully. You can now log in."}


@router.get("/dashboard")
def student_dashboard(current_email: str = Depends(get_current_user_email)):
    return {
        "message": "Welcome to the VIP area!",
        "your_email": current_email,
        "secret_data": "Here is the data only logged-in students can see.",
    }


from app.models.appointment import Appointment
from app.schemas.appointment import AppointmentCreate


@router.post("/book-appointment")
def book_appointment(
    appointment_data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student),
):
    new_appointment = Appointment(
        student_email=current_student.email,
        teacher_id=appointment_data.teacher_id,
        purpose=appointment_data.purpose,
        status="Pending",
    )
    db.add(new_appointment)
    db.commit()
    db.refresh(new_appointment)

    return {"message": "Appointment requested successfully!", "appointment_id": new_appointment.id}


@router.get("/profile", response_model=StudentResponse)
def get_student_profile(current_student: Student = Depends(get_current_student)):
    return current_student


from typing import List
from app.schemas.appointment import AppointmentResponse


@router.get("/appointments", response_model=List[AppointmentResponse])
def get_my_appointments(
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student),
):
    return (
        db.query(Appointment)
        .filter(Appointment.student_email == current_student.email)
        .order_by(Appointment.created_at.desc())
        .all()
    )