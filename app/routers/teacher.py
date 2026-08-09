# PLACE AT: app/routers/teacher.py  (REPLACES your existing file)

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List

from app.database import get_db
from app.models.teacher import Teacher
from app.models.teacher_request import TeacherAccessRequest
from app.schemas.teacher import TeacherLogin, TeacherStatusUpdate, TeacherPublic, TeacherResponse
from app.schemas.teacher_request import TeacherAccessRequestCreate, SetPasswordRequest
from app.utils.email_sender import send_admin_notification_email
from app.utils.security import (
    verify_password,
    create_access_token,
    get_password_hash,
    get_current_teacher,
    generate_setup_token,
)
import os

router = APIRouter(prefix="/api/teacher", tags=["Teacher"])

# All admin emails to notify when a new request comes in.
# Supports a comma-separated list, e.g. ADMIN_NOTIFY_EMAILS=a@gmail.com,b@gmail.com
ADMIN_NOTIFY_EMAILS = [
    e.strip() for e in os.getenv("ADMIN_NOTIFY_EMAILS", os.getenv("ADMIN_BOOTSTRAP_EMAIL", "")).split(",")
    if e.strip()
]


# ==========================================
# LOGIN
# ==========================================
@router.post("/login")
def teacher_login(credentials: TeacherLogin, db: Session = Depends(get_db)):
    teacher = db.query(Teacher).filter(Teacher.email == credentials.email).first()

    if not teacher:
        # IMPORTANT: frontend should catch this specific message and offer
        # the "Request Access" flow instead of a generic error.
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found for this email. Please request access from the admin.",
        )

    if not teacher.password:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is approved but not yet activated. Please check your email for the password setup link.",
        )

    if not verify_password(credentials.password, teacher.password):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid credentials")

    access_token = create_access_token(
        data={"sub": teacher.email, "role": "teacher", "is_admin": teacher.is_admin}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "is_admin": teacher.is_admin,
    }


# ==========================================
# REQUEST ACCESS (replaces public signup)
# ==========================================
@router.post("/request-access", status_code=status.HTTP_201_CREATED)
def request_teacher_access(request: TeacherAccessRequestCreate, db: Session = Depends(get_db)):
    # 1. If a teacher account already exists for this email, tell them to log in instead
    existing_teacher = db.query(Teacher).filter(Teacher.email == request.email).first()
    if existing_teacher:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account already exists for this email. Please log in.",
        )

    # 2. If there's already a pending request for this email, don't spam duplicates
    existing_request = (
        db.query(TeacherAccessRequest)
        .filter(TeacherAccessRequest.email == request.email, TeacherAccessRequest.status == "Pending")
        .first()
    )
    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A request for this email is already pending admin review.",
        )

    # 3. Create the request row
    new_request = TeacherAccessRequest(
        name=request.name,
        email=request.email,
        department_id=request.department_id,
        message=request.message,
        staff_type=request.staff_type,
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    # 4. Notify all configured admins (best-effort — don't fail the request if email fails)
    for admin_email in ADMIN_NOTIFY_EMAILS:
        send_admin_notification_email(admin_email, new_request.id, new_request.name, new_request.email)

    return {"message": "Your request has been sent to the admin for review.", "request_id": new_request.id}


# ==========================================
# SET PASSWORD (used after admin approval)
# ==========================================
@router.post("/set-password")
def set_teacher_password(payload: SetPasswordRequest, db: Session = Depends(get_db)):
    teacher = db.query(Teacher).filter(Teacher.setup_token == payload.token).first()

    if not teacher:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or already-used setup link.")

    if teacher.setup_token_expires and teacher.setup_token_expires < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This setup link has expired.")

    teacher.password = get_password_hash(payload.new_password)
    teacher.setup_token = None
    teacher.setup_token_expires = None
    db.commit()

    access_token = create_access_token(
        data={"sub": teacher.email, "role": "teacher", "is_admin": teacher.is_admin}
    )

    return {
        "message": "Password set successfully. You are now logged in.",
        "access_token": access_token,
        "token_type": "bearer",
        "is_admin": teacher.is_admin,
    }


# ==========================================
# STATUS UPDATE (unchanged)
# ==========================================
@router.put("/update-status")
def update_teacher_status(
    status_data: TeacherStatusUpdate,
    db: Session = Depends(get_db),
    current_teacher=Depends(get_current_teacher),
):
    current_teacher.status = status_data.status
    db.commit()
    db.refresh(current_teacher)
    return {"message": f"Status updated to {current_teacher.status}"}


# ==========================================
# LIST (unchanged)
# ==========================================
@router.get("/list", response_model=List[TeacherPublic])
def get_all_teachers(db: Session = Depends(get_db)):
    teachers = db.query(Teacher).all()
    return teachers


# ==========================================
# APPOINTMENTS (unchanged)
# ==========================================
from app.models.appointment import Appointment
from app.schemas.appointment import AppointmentResponse, AppointmentUpdate


@router.get("/appointments", response_model=List[AppointmentResponse])
def get_my_appointments(db: Session = Depends(get_db), current_teacher=Depends(get_current_teacher)):
    appointments = db.query(Appointment).filter(Appointment.teacher_id == current_teacher.id).all()
    return appointments


@router.put("/appointments/{appointment_id}")
def update_appointment_status(
    appointment_id: int,
    update_data: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_teacher=Depends(get_current_teacher),
):
    appointment = (
        db.query(Appointment)
        .filter(Appointment.id == appointment_id, Appointment.teacher_id == current_teacher.id)
        .first()
    )
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found or you are not authorized to update it")

    appointment.status = update_data.status
    db.commit()
    db.refresh(appointment)

    return {
        "message": f"Appointment {appointment.status} successfully!",
        "appointment_id": appointment.id,
        "new_status": appointment.status,
    }


# ==========================================
# PROFILE (unchanged, now returns is_admin via TeacherResponse)
# ==========================================
@router.get("/profile", response_model=TeacherResponse)
def get_teacher_profile(current_teacher: Teacher = Depends(get_current_teacher)):
    return current_teacher


# NOTE: /signup and /send-otp for teachers have been REMOVED.
# Teachers can no longer self-register — see /request-access above.