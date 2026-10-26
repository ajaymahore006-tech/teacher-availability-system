import os
import logging
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    WebSocket,
    WebSocketDisconnect,
    Query,
)
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from app.database import get_db
from app.models.appointment import Appointment
from app.models.message import Message
from app.models.teacher import Teacher
from app.schemas.message import MessageCreate, MessageResponse
from app.utils.websocket_manager import manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/appointments", tags=["Messages"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/student/login")
SECRET_KEY = os.getenv("SECRET_KEY", "super_secret_key_for_teacher_availability_app")
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
    role, email = _get_authorized_sender(appointment_id, token, db)

    # Mark as read: opening the chat means you've seen everything up to now.
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if role == "student":
        appointment.student_last_read = now
    elif role == "teacher":
        appointment.teacher_last_read = now
    db.commit()

    return (
        db.query(Message)
        .filter(Message.appointment_id == appointment_id)
        .order_by(Message.created_at.asc())
        .all()
    )


@router.post("/{appointment_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    appointment_id: int,
    payload: MessageCreate,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    role, email = _get_authorized_sender(appointment_id, token, db)
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    new_message = Message(
        appointment_id=appointment_id,
        sender_role=role,
        sender_email=email,
        content=payload.content,
        created_at=now,
    )
    db.add(new_message)

    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if role == "student":
        appointment.student_last_read = now
    elif role == "teacher":
        appointment.teacher_last_read = now

    other_role = "teacher" if role == "student" else "student"
    if manager.is_role_online(appointment_id, other_role):
        if other_role == "student":
            appointment.student_last_read = now
        else:
            appointment.teacher_last_read = now

    db.commit()
    db.refresh(new_message)

    # Broadcast to any active WebSocket listeners
    await manager.broadcast_to_room(
        appointment_id,
        {
            "type": "chat",
            "message": {
                "id": new_message.id,
                "appointment_id": new_message.appointment_id,
                "sender_role": new_message.sender_role,
                "sender_email": new_message.sender_email,
                "content": new_message.content,
                "created_at": new_message.created_at.isoformat() if new_message.created_at else None,
            },
        },
    )

    return new_message


# ==========================================
# REAL-TIME WEBSOCKET CHAT & PRESENCE
# ==========================================
@router.websocket("/{appointment_id}/ws")
async def websocket_chat(
    websocket: WebSocket,
    appointment_id: int,
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        role = payload.get("role")
    except JWTError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    authorized = False
    if role == "student" and appointment.student_email == email:
        authorized = True
    elif role == "teacher":
        teacher = db.query(Teacher).filter(Teacher.email == email).first()
        if teacher and appointment.teacher_id == teacher.id:
            authorized = True

    if not authorized:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(appointment_id, websocket, email, role)

    # Immediately mark as read upon connecting to chat
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if role == "student":
        appointment.student_last_read = now
    elif role == "teacher":
        appointment.teacher_last_read = now
    db.commit()

    # Handshake with current room state
    online_roles = manager.get_online_roles(appointment_id)
    await manager.send_personal(
        websocket,
        {
            "type": "init",
            "appointment_id": appointment_id,
            "role": role,
            "online_roles": online_roles,
        },
    )

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == "chat":
                content = (data.get("content") or "").strip()
                if content:
                    msg_now = datetime.now(timezone.utc).replace(tzinfo=None)
                    new_msg = Message(
                        appointment_id=appointment_id,
                        sender_role=role,
                        sender_email=email,
                        content=content,
                        created_at=msg_now,
                    )
                    db.add(new_msg)

                    if role == "student":
                        appointment.student_last_read = msg_now
                    elif role == "teacher":
                        appointment.teacher_last_read = msg_now

                    other_role = "teacher" if role == "student" else "student"
                    if manager.is_role_online(appointment_id, other_role):
                        if other_role == "student":
                            appointment.student_last_read = msg_now
                        else:
                            appointment.teacher_last_read = msg_now

                    db.commit()
                    db.refresh(new_msg)

                    await manager.broadcast_to_room(
                        appointment_id,
                        {
                            "type": "chat",
                            "message": {
                                "id": new_msg.id,
                                "appointment_id": new_msg.appointment_id,
                                "sender_role": new_msg.sender_role,
                                "sender_email": new_msg.sender_email,
                                "content": new_msg.content,
                                "created_at": new_msg.created_at.isoformat() if new_msg.created_at else None,
                            },
                        },
                    )

            elif msg_type == "typing":
                is_typing = bool(data.get("is_typing", False))
                await manager.broadcast_to_room(
                    appointment_id,
                    {
                        "type": "typing",
                        "sender_role": role,
                        "sender_email": email,
                        "is_typing": is_typing,
                    },
                    exclude=websocket,
                )

            elif msg_type == "read":
                read_now = datetime.now(timezone.utc).replace(tzinfo=None)
                if role == "student":
                    appointment.student_last_read = read_now
                elif role == "teacher":
                    appointment.teacher_last_read = read_now
                db.commit()

    except WebSocketDisconnect:
        manager.disconnect(appointment_id, websocket, email, role)
        online_roles = manager.get_online_roles(appointment_id)
        await manager.broadcast_to_room(
            appointment_id,
            {
                "type": "presence",
                "email": email,
                "role": role,
                "status": "offline",
                "online_roles": online_roles,
            },
        )
    except Exception as e:
        logger.error(f"WebSocket error in appointment {appointment_id}: {e}")
        manager.disconnect(appointment_id, websocket, email, role)
