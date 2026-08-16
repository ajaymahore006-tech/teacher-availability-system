# PLACE AT: app/routers/messages.py  (NEW FILE)

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from typing import List
import os

from app.database import get_db
from app.models.appointment import Appointment
from app.models.message import Message
from app.models.teacher import Teacher
from app.schemas.message import MessageCreate, MessageResponse

router = APIRouter(prefix="/api/appointments", tags=["Messages"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/student/login")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"


def _get_authorized_sender(appointment_id: int, token: str, db: Session):
    """
    Decodes the token WITHOUT assuming student or teacher up front, then checks
    whether this specific person is actually part of this specific appointment.
    Returns (role, email) if allowed, otherwise raises 403.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        role = payload.get("role")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if role == "student" and appointment.student_email == email:
        return "student", email

    if role == "teacher":
        teacher = db.query(Teacher).filter(Teacher.email == email).first()
        if teacher and appointment.teacher_id == teacher.id:
            return "teacher", email

    raise HTTPException(status_code=403, detail="You are not part of this appointment")


@router.get("/{appointment_id}/messages", response_model=List[MessageResponse])
def list_messages(appointment_id: int, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    _get_authorized_sender(appointment_id, token, db)
    return (
        db.query(Message)
        .filter(Message.appointment_id == appointment_id)
        .order_by(Message.created_at.asc())
        .all()
    )


@router.post("/{appointment_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(
    appointment_id: int,
    payload: MessageCreate,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    role, email = _get_authorized_sender(appointment_id, token, db)

    new_message = Message(
        appointment_id=appointment_id,
        sender_role=role,
        sender_email=email,
        content=payload.content,
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    return new_message