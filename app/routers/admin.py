from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from app.database import get_db
from app.models.teacher import Teacher
from app.models.teacher_request import TeacherAccessRequest
from app.schemas.teacher import TeacherPublic, TeacherAdminCreate
from app.schemas.teacher_request import TeacherAccessRequestResponse
from app.utils.email_sender import send_teacher_setup_email, send_admin_status_email
from app.utils.security import get_current_admin, generate_setup_token

router = APIRouter(prefix="/api/admin", tags=["Admin"])


def _generate_next_teacher_id(db: Session) -> str:
    teachers = db.query(Teacher.id).filter(Teacher.id.like("T%")).all()
    max_num = 0
    for (t_id,) in teachers:
        if t_id and t_id.startswith("T") and t_id[1:].isdigit():
            try:
                max_num = max(max_num, int(t_id[1:]))
            except ValueError:
                pass
    return f"T{max_num + 1:03d}"


# ==========================================
# VIEW REQUESTS
# ==========================================
@router.get("/requests", response_model=List[TeacherAccessRequestResponse])
def list_requests(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: Teacher = Depends(get_current_admin),
):
    query = db.query(TeacherAccessRequest)
    if status_filter:
        query = query.filter(TeacherAccessRequest.status == status_filter)
    return query.order_by(TeacherAccessRequest.created_at.desc()).all()


@router.get("/requests/{request_id}", response_model=TeacherAccessRequestResponse)
def get_request(request_id: int, db: Session = Depends(get_db), admin: Teacher = Depends(get_current_admin)):
    req = db.query(TeacherAccessRequest).filter(TeacherAccessRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    return req


# ==========================================
# APPROVE / REJECT
# ==========================================
@router.post("/requests/{request_id}/approve")
def approve_request(request_id: int, db: Session = Depends(get_db), admin: Teacher = Depends(get_current_admin)):
    req = db.query(TeacherAccessRequest).filter(TeacherAccessRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != "Pending":
        raise HTTPException(status_code=400, detail=f"This request was already {req.status.lower()}.")

    existing = db.query(Teacher).filter(Teacher.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="A teacher account already exists for this email.")

    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    setup_token = generate_setup_token()
    new_teacher = Teacher(
        id=_generate_next_teacher_id(db),
        name=req.name,
        email=req.email,
        department_id=req.department_id,
        password=None,
        setup_token=setup_token,
        setup_token_expires=now_utc + timedelta(hours=24),
        staff_type=req.staff_type,
    )
    db.add(new_teacher)

    req.status = "Approved"
    req.resolved_at = now_utc
    db.commit()

    email_sent = send_teacher_setup_email(new_teacher.email, setup_token)

    return {
        "message": "Request approved. Teacher account created and setup email sent.",
        "email_sent": email_sent,
        "teacher_id": new_teacher.id,
    }


@router.post("/requests/{request_id}/reject")
def reject_request(request_id: int, db: Session = Depends(get_db), admin: Teacher = Depends(get_current_admin)):
    req = db.query(TeacherAccessRequest).filter(TeacherAccessRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != "Pending":
        raise HTTPException(status_code=400, detail=f"This request was already {req.status.lower()}.")

    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    req.status = "Rejected"
    req.resolved_at = now_utc
    db.commit()

    return {"message": "Request rejected."}


# ==========================================
# MANAGE TEACHERS DIRECTLY
# ==========================================
@router.get("/teachers", response_model=List[TeacherPublic])
def list_teachers(db: Session = Depends(get_db), admin: Teacher = Depends(get_current_admin)):
    return db.query(Teacher).all()


@router.post("/teachers", status_code=status.HTTP_201_CREATED)
def create_teacher_directly(
    payload: TeacherAdminCreate, db: Session = Depends(get_db), admin: Teacher = Depends(get_current_admin)
):
    existing = db.query(Teacher).filter(Teacher.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="A teacher account already exists for this email.")

    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    setup_token = generate_setup_token()
    new_teacher = Teacher(
        id=_generate_next_teacher_id(db),
        name=payload.name,
        email=payload.email,
        department_id=payload.department_id,
        password=None,
        setup_token=setup_token,
        setup_token_expires=now_utc + timedelta(hours=24),
        staff_type=payload.staff_type,
    )
    db.add(new_teacher)
    db.commit()

    email_sent = send_teacher_setup_email(new_teacher.email, setup_token)
    return {"message": "Teacher created and setup email sent.", "email_sent": email_sent, "teacher_id": new_teacher.id}


@router.delete("/teachers/{teacher_id}")
def delete_teacher(teacher_id: str, db: Session = Depends(get_db), admin: Teacher = Depends(get_current_admin)):
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    if teacher.is_admin and teacher.email == admin.email:
        raise HTTPException(status_code=400, detail="You cannot delete your own admin account.")

    db.delete(teacher)
    db.commit()
    return {"message": f"Teacher {teacher_id} removed."}


# ==========================================
# PROMOTE / DEMOTE ADMIN
# ==========================================
@router.post("/teachers/{teacher_id}/promote")
def promote_to_admin(teacher_id: str, db: Session = Depends(get_db), admin: Teacher = Depends(get_current_admin)):
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    teacher.is_admin = True
    db.commit()

    email_sent = send_admin_status_email(teacher.email, teacher.name, promoted=True)
    return {"message": f"{teacher.name} is now an admin.", "email_sent": email_sent}


@router.post("/teachers/{teacher_id}/demote")
def demote_admin(teacher_id: str, db: Session = Depends(get_db), admin: Teacher = Depends(get_current_admin)):
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    if teacher.email == admin.email:
        raise HTTPException(status_code=400, detail="You cannot demote yourself.")

    teacher.is_admin = False
    db.commit()

    email_sent = send_admin_status_email(teacher.email, teacher.name, promoted=False)
    return {"message": f"{teacher.name} is no longer an admin.", "email_sent": email_sent}
