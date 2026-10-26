import re
import random
from datetime import datetime, timedelta, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.student import Student
from app.models.appointment import Appointment
from app.models.message import Message
from app.models.otp import OTPCode
from app.models.cr_message import CRMessage
from app.models.teacher import Teacher
from app.schemas.student import StudentLogin, StudentResponse, StudentPasswordReset, StudentUpdateSection
from app.schemas.appointment import AppointmentCreate, AppointmentResponse
from app.schemas.otp import OTPRequest, StudentSignupWithOTP
from app.schemas.cr_message import CRMessageResponse
from app.utils.security import (
    verify_password,
    create_access_token,
    get_password_hash,
    get_current_user_email,
    get_current_student,
)
from app.utils.email_sender import send_otp_email

router = APIRouter(prefix="/api/student", tags=["Student Authentication"])


def _to_naive_utc(dt):
    if dt is None:
        return None
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


@router.post("/send-otp")
def send_registration_otp(request: OTPRequest, db: Session = Depends(get_db)):
    existing_student = db.query(Student).filter(Student.email == request.email).first()
    if existing_student:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    otp_code = str(random.randint(100000, 999999))
    expiration_time = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=10)

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

    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    if _to_naive_utc(otp_record.expires_at) < now_utc:
        db.delete(otp_record)
        db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP has expired. Please request a new one.")

    match = re.match(r"^(\d+)@", request.email)
    if not match:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not extract MIS number from email.")
    derived_roll_no = int(match.group(1))

    existing_roll = db.query(Student).filter(Student.roll_no == derived_roll_no).first()
    if existing_roll:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This roll number is already registered.")

    hashed_password = get_password_hash(request.password)
    cleaned_section = request.section.strip().upper() if request.section and request.section.strip() else None

    new_student = Student(
        email=request.email,
        password=hashed_password,
        name=request.name,
        roll_no=derived_roll_no,
        section=cleaned_section,
        is_cr=False,
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
    expiration_time = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=10)

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

    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    if _to_naive_utc(otp_record.expires_at) < now_utc:
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
        "message": "Welcome to the Student Dashboard",
        "your_email": current_email,
    }


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


@router.put("/section", response_model=StudentResponse)
def update_my_section(
    payload: StudentUpdateSection,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student),
):
    current_student.section = payload.section.strip().upper()
    db.commit()
    db.refresh(current_student)
    return current_student


@router.get("/appointments", response_model=List[AppointmentResponse])
def get_my_appointments(
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student),
):
    appointments = (
        db.query(Appointment)
        .filter(Appointment.student_email == current_student.email)
        .order_by(Appointment.created_at.desc())
        .all()
    )

    for appt in appointments:
        latest_teacher_msg = (
            db.query(func.max(Message.created_at))
            .filter(Message.appointment_id == appt.id, Message.sender_role == "teacher")
            .scalar()
        )
        t_msg = _to_naive_utc(latest_teacher_msg)
        s_read = _to_naive_utc(appt.student_last_read)
        appt.has_unread = bool(t_msg) and (s_read is None or t_msg > s_read)

        appt.student_name = current_student.name
        appt.student_roll_no = current_student.roll_no
        appt.student_section = current_student.section
        appt.student_is_cr = current_student.is_cr

    return appointments


# ==========================================
# CR MESSAGES / ANNOUNCEMENTS FOR STUDENTS
# ==========================================
@router.get("/cr-messages", response_model=List[CRMessageResponse])
def get_my_cr_messages(
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student),
):
    messages = (
        db.query(CRMessage)
        .filter(CRMessage.student_email == current_student.email)
        .order_by(CRMessage.created_at.desc())
        .all()
    )

    teacher_ids = {m.teacher_id for m in messages}
    teachers_map = (
        {t.id: t.name for t in db.query(Teacher).filter(Teacher.id.in_(teacher_ids)).all()}
        if teacher_ids
        else {}
    )

    for m in messages:
        m.teacher_name = teachers_map.get(m.teacher_id, m.teacher_id)
        m.student_name = current_student.name
        m.student_section = current_student.section

    return messages


@router.put("/cr-messages/{message_id}/read")
def mark_cr_message_read(
    message_id: int,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student),
):
    msg = (
        db.query(CRMessage)
        .filter(CRMessage.id == message_id, CRMessage.student_email == current_student.email)
        .first()
    )
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    msg.is_read = True
    db.commit()
    return {"message": "Marked as read"}
