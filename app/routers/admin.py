# PLACE AT: app/routers/admin.py  (NEW FILE)

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional

from app.database import get_db
from app.models.teacher import Teacher
from app.models.teacher_request import TeacherAccessRequest
from app.schemas.teacher import TeacherPublic, TeacherAdminCreate
from app.schemas.teacher_request import TeacherAccessRequestResponse
from app.utils.email_sender import send_teacher_setup_email, send_admin_status_email
from app.utils.security import get_current_admin, generate_setup_token, get_password_hash

router = APIRouter(prefix="/api/admin", tags=["Admin"])


def _generate_next_teacher_id(db: Session) -> str:
    last_teacher = db.query(Teacher).order_by(Teacher.id.desc()).first()
    if last_teacher and last_teacher.id.startswith("T"):
        try:
            last_num = int(last_teacher.id[1:])
            return f"T{last_num + 1:03d}"
        except ValueError:
            pass
    return "T001"


# ==========================================
# VIEW REQUESTS
# ==========================================
@router.get("/requests", response_model=List[TeacherAccessRequestResponse])
def list_requests(
    status_filter: Optional[str] = None,  # e.g. "Pending", "Approved", "Rejected"
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

    # Double-check no teacher account was created for this email in the meantime
    existing = db.query(Teacher).filter(Teacher.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="A teacher account already exists for this email.")

    setup_token = generate_setup_token()
    new_teacher = Teacher(
        id=_generate_next_teacher_id(db),
        name=req.name,
        email=req.email,
        department_id=req.department_id,
        password=None,  # NOT set yet — teacher sets it via the emailed link
        setup_token=setup_token,
        setup_token_expires=datetime.utcnow() + timedelta(hours=24),
        staff_type=req.staff_type,
    )
    db.add(new_teacher)

    req.status = "Approved"
    req.resolved_at = datetime.utcnow()
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

    req.status = "Rejected"
    req.resolved_at = datetime.utcnow()
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
    """Optional shortcut: admin creates a teacher without them requesting access first."""
    existing = db.query(Teacher).filter(Teacher.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="A teacher account already exists for this email.")

    setup_token = generate_setup_token()
    new_teacher = Teacher(
        id=_generate_next_teacher_id(db),
        name=payload.name,
        email=payload.email,
        department_id=payload.department_id,
        password=None,
        setup_token=setup_token,
        setup_token_expires=datetime.utcnow() + timedelta(hours=24),
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