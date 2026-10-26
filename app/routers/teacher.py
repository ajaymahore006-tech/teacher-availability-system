import os
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.teacher import Teacher
from app.models.teacher_request import TeacherAccessRequest
from app.models.appointment import Appointment
from app.models.message import Message
from app.models.student import Student
from app.models.cr_message import CRMessage
from app.schemas.teacher import TeacherLogin, TeacherStatusUpdate, TeacherPublic, TeacherResponse
from app.schemas.teacher_request import TeacherAccessRequestCreate, SetPasswordRequest
from app.schemas.appointment import AppointmentResponse, AppointmentUpdate
from app.schemas.student import StudentSearchResponse
from app.schemas.cr_message import CRMessageCreate, CRBroadcastCreate, CRMessageResponse
from app.utils.email_sender import send_admin_notification_email
from app.utils.security import (
    verify_password,
    create_access_token,
    get_password_hash,
    get_current_teacher,
)

router = APIRouter(prefix="/api/teacher", tags=["Teacher"])

ADMIN_NOTIFY_EMAILS = [
    e.strip() for e in os.getenv("ADMIN_NOTIFY_EMAILS", os.getenv("ADMIN_BOOTSTRAP_EMAIL", "")).split(",")
    if e.strip()
]


def _to_naive_utc(dt):
    if dt is None:
        return None
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


# ==========================================
# LOGIN
# ==========================================
@router.post("/login")
def teacher_login(credentials: TeacherLogin, db: Session = Depends(get_db)):
    teacher = db.query(Teacher).filter(Teacher.email == credentials.email).first()

    if not teacher:
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
# REQUEST ACCESS
# ==========================================
@router.post("/request-access", status_code=status.HTTP_201_CREATED)
def request_teacher_access(request: TeacherAccessRequestCreate, db: Session = Depends(get_db)):
    existing_teacher = db.query(Teacher).filter(Teacher.email == request.email).first()
    if existing_teacher:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account already exists for this email. Please log in.",
        )

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

    new_request = TeacherAccessRequest(
        name=request.name,
        email=request.email,
        department_id=request.department_id,
        staff_type=request.staff_type,
        message=request.message,
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    for admin_email in ADMIN_NOTIFY_EMAILS:
        send_admin_notification_email(admin_email, new_request.id, new_request.name, new_request.email)

    return {"message": "Your request has been sent to the admin for review.", "request_id": new_request.id}


# ==========================================
# SET PASSWORD
# ==========================================
@router.post("/set-password")
def set_teacher_password(payload: SetPasswordRequest, db: Session = Depends(get_db)):
    teacher = db.query(Teacher).filter(Teacher.setup_token == payload.token).first()

    if not teacher:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or already-used setup link.")

    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    if teacher.setup_token_expires and _to_naive_utc(teacher.setup_token_expires) < now_utc:
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
# STATUS UPDATE
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
# LIST
# ==========================================
@router.get("/list", response_model=List[TeacherPublic])
def get_all_teachers(db: Session = Depends(get_db)):
    return db.query(Teacher).all()


# ==========================================
# APPOINTMENTS (WITH STUDENT SECTION & CR INFO)
# ==========================================
@router.get("/appointments", response_model=List[AppointmentResponse])
def get_my_appointments(db: Session = Depends(get_db), current_teacher=Depends(get_current_teacher)):
    appointments = (
        db.query(Appointment)
        .filter(Appointment.teacher_id == current_teacher.id)
        .order_by(Appointment.created_at.desc())
        .all()
    )

    student_emails = {a.student_email for a in appointments}
    students_map = (
        {s.email: s for s in db.query(Student).filter(Student.email.in_(student_emails)).all()}
        if student_emails
        else {}
    )

    for appt in appointments:
        latest_student_msg = (
            db.query(func.max(Message.created_at))
            .filter(Message.appointment_id == appt.id, Message.sender_role == "student")
            .scalar()
        )
        s_msg = _to_naive_utc(latest_student_msg)
        t_read = _to_naive_utc(appt.teacher_last_read)
        appt.has_unread = bool(s_msg) and (t_read is None or s_msg > t_read)

        stud = students_map.get(appt.student_email)
        if stud:
            appt.student_name = stud.name
            appt.student_roll_no = stud.roll_no
            appt.student_section = stud.section
            appt.student_is_cr = stud.is_cr

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
# PROFILE
# ==========================================
@router.get("/profile", response_model=TeacherResponse)
def get_teacher_profile(current_teacher: Teacher = Depends(get_current_teacher)):
    return current_teacher


# ==========================================
# CLASS REPRESENTATIVE (CR) MANAGEMENT
# ==========================================
@router.get("/students/search", response_model=StudentSearchResponse)
def search_student_by_roll_no(
    roll_no: int = Query(..., description="Student roll number to search"),
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    student = db.query(Student).filter(Student.roll_no == roll_no).first()
    if not student:
        raise HTTPException(status_code=404, detail=f"No student found with roll number {roll_no}.")
    return student


@router.post("/students/{roll_no}/toggle-cr", response_model=StudentSearchResponse)
def toggle_student_cr(
    roll_no: int,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    student = db.query(Student).filter(Student.roll_no == roll_no).first()
    if not student:
        raise HTTPException(status_code=404, detail=f"Student with roll number {roll_no} not found.")

    student.is_cr = not student.is_cr
    db.commit()
    db.refresh(student)

    status_str = "appointed as Class Representative (CR)" if student.is_cr else "removed from Class Representative role"
    return student


@router.get("/crs", response_model=List[StudentSearchResponse])
def list_all_crs(
    section: Optional[str] = None,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    query = db.query(Student).filter(Student.is_cr == True)
    if section and section != "All":
        query = query.filter(Student.section == section.strip().upper())
    return query.order_by(Student.section.asc(), Student.roll_no.asc()).all()


# ==========================================
# TEACHER -> CR MESSAGES & ANNOUNCEMENTS
# ==========================================
@router.post("/cr-messages", response_model=CRMessageResponse)
def send_message_to_cr(
    payload: CRMessageCreate,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    student = db.query(Student).filter(Student.email == payload.student_email).first()
    if not student:
        raise HTTPException(status_code=404, detail="Target student not found.")

    new_msg = CRMessage(
        teacher_id=current_teacher.id,
        student_email=student.email,
        title=payload.title.strip(),
        content=payload.content.strip(),
        is_read=False,
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)

    new_msg.teacher_name = current_teacher.name
    new_msg.student_name = student.name
    new_msg.student_section = student.section
    return new_msg


@router.post("/cr-messages/broadcast")
def broadcast_message_to_crs(
    payload: CRBroadcastCreate,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    query = db.query(Student).filter(Student.is_cr == True)
    if payload.section and payload.section != "All":
        query = query.filter(Student.section == payload.section.strip().upper())

    target_crs = query.all()
    if not target_crs:
        raise HTTPException(
            status_code=400,
            detail=f"No Class Representatives (CRs) found for section {payload.section or 'All'}.",
        )

    created_msgs = []
    for cr in target_crs:
        msg = CRMessage(
            teacher_id=current_teacher.id,
            student_email=cr.email,
            title=payload.title.strip(),
            content=payload.content.strip(),
            is_read=False,
        )
        db.add(msg)
        created_msgs.append(msg)

    db.commit()
    return {
        "message": f"Broadcast successfully sent to {len(created_msgs)} Class Representative(s).",
        "recipient_count": len(created_msgs),
    }


@router.get("/cr-messages", response_model=List[CRMessageResponse])
def get_teacher_sent_cr_messages(
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    messages = (
        db.query(CRMessage)
        .filter(CRMessage.teacher_id == current_teacher.id)
        .order_by(CRMessage.created_at.desc())
        .all()
    )

    student_emails = {m.student_email for m in messages}
    students_map = (
        {s.email: s for s in db.query(Student).filter(Student.email.in_(student_emails)).all()}
        if student_emails
        else {}
    )

    for m in messages:
        m.teacher_name = current_teacher.name
        stud = students_map.get(m.student_email)
        if stud:
            m.student_name = stud.name
            m.student_section = stud.section

    return messages
