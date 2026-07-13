from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.teacher import Teacher
from app.schemas.teacher import TeacherLogin
from app.utils.security import (
    verify_password,
    create_access_token,
    get_password_hash,
    get_current_teacher,
)

# This creates the router we will connect later
router = APIRouter(prefix="/api/teacher", tags=["Teacher"])


@router.post("/login")
def teacher_login(credentials: TeacherLogin, db: Session = Depends(get_db)):

    # 1. Look for the teacher in the database
    teacher = db.query(Teacher).filter(Teacher.email == credentials.email).first()
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Invalid Credentials"
        )

    # 2. Check if the password matches the hashed password
    if not verify_password(credentials.password, teacher.password):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Invalid Credentials"
        )

    # 3. Hand them a VIP wristband with the "teacher" label!
    access_token = create_access_token(data={"sub": teacher.email, "role": "teacher"})

    return {"access_token": access_token, "token_type": "bearer"}


# --- TEMPORARY ROUTE FOR TESTING ---
@router.post("/setup-dummy-teacher")
def setup_teacher(db: Session = Depends(get_db)):
    # Check if the dummy teacher already exists
    existing = (
        db.query(Teacher).filter(Teacher.email == "faculty@cse.iiitp.ac.in").first()
    )
    if existing:
        return {"message": "Dummy teacher already exists!"}

    new_teacher = Teacher(
        id="T001",  # Make sure this matches your DB schema for ID
        name="Dr. Smith",
        email="faculty@cse.iiitp.ac.in",
        password=get_password_hash("securepass123"),
        department_id=1,
    )
    db.add(new_teacher)
    db.commit()
    return {
        "message": "Teacher created! Email: faculty@cse.iiitp.ac.in | Pass: securepass123"
    }


from app.schemas.teacher import TeacherStatusUpdate, TeacherPublic


@router.put("/update-status")
def update_teacher_status(
    status_data: TeacherStatusUpdate,
    db: Session = Depends(get_db),
    current_teacher=Depends(get_current_teacher),  # This checks the token!
):
    # 1. Update the teacher's status in the database
    current_teacher.status = status_data.status
    db.commit()
    db.refresh(current_teacher)

    return {"message": f"Status updated to {current_teacher.status}"}


from typing import List


@router.get("/list", response_model=List[TeacherPublic])
def get_all_teachers(db: Session = Depends(get_db)):
    # 1. Fetch ALL teachers from the database
    teachers = db.query(Teacher).all()

    # 2. Return them (FastAPI will automatically filter them through TeacherPublic)
    return teachers


from app.models.appointment import Appointment
from app.schemas.appointment import AppointmentResponse
@router.get("/appointments", response_model=List[AppointmentResponse])
def get_my_appointments(
    db: Session = Depends(get_db), current_teacher=Depends(get_current_teacher)
):  # The Teacher Bouncer!
    # Fetch all appointments where the teacher_id matches the currently logged-in teacher
    appointments = (
        db.query(Appointment).filter(Appointment.teacher_id == current_teacher.id).all()
    )

    return appointments


from app.schemas.appointment import AppointmentUpdate
@router.put("/appointments/{appointment_id}")
def update_appointment_status(
    appointment_id: int, 
    update_data: AppointmentUpdate, 
    db: Session = Depends(get_db),
    current_teacher = Depends(get_current_teacher) # The Bouncer!
):
    # 1. Find the appointment AND verify it belongs to this specific teacher
    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.teacher_id == current_teacher.id
    ).first()
    
    # 2. If it doesn't exist or belongs to someone else, block them!
    if not appointment:
        raise HTTPException(
            status_code=404, 
            detail="Appointment not found or you are not authorized to update it"
        )
        
    # 3. Update the status
    appointment.status = update_data.status
    
    # 4. Save the changes to MySQL
    db.commit()
    db.refresh(appointment)
    
    return {
        "message": f"Appointment {appointment.status} successfully!", 
        "appointment_id": appointment.id,
        "new_status": appointment.status
    }

