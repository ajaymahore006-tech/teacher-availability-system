from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from datetime import datetime
from app.models.teacher import Teacher
from app.models.otp import OTPCode
from app.schemas.teacher import TeacherLogin, TeacherSignupWithOTP
from app.schemas.otp import TeacherOTPRequest
from app.utils.email_sender import send_otp_email
import random
from datetime import datetime, timedelta
from app.utils.security import (
    verify_password,
    create_access_token,
    get_password_hash,
    get_current_teacher,
)

# This creates the router we will connect later
router = APIRouter(prefix="/api/teacher", tags=["Teacher"])


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def register_teacher(request: TeacherSignupWithOTP, db: Session = Depends(get_db)):
    # 1. Fetch the OTP record for this email
    otp_record = db.query(OTPCode).filter(OTPCode.email == request.email).first()

    # 2. Verify the OTP exists and matches
    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No OTP requested for this email.",
        )

    if otp_record.otp != request.otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP code."
        )

    # 3. Check if the OTP has expired
    if otp_record.expires_at < datetime.now():
        db.delete(otp_record)  # Clean up the expired code
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired. Please request a new one.",
        )

    # 4. Check if the Teacher email already exists
    existing_teacher = db.query(Teacher).filter(Teacher.email == request.email).first()
    if existing_teacher:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email is already registered as a Teacher.",
        )

    # 5. Auto-generate a unique Teacher ID (e.g. T001, T002, ...)
    last_teacher = db.query(Teacher).order_by(Teacher.id.desc()).first()
    if last_teacher and last_teacher.id.startswith("T"):
        last_num = int(last_teacher.id[1:])
        new_id = f"T{last_num + 1:03d}"
    else:
        new_id = "T001"

    # 6. Hash the password and create the teacher instance
    hashed_password = get_password_hash(request.password)
    new_teacher = Teacher(
        id=new_id,  # auto-generated, not from request
        name=request.name,
        email=request.email,
        department_id=request.department_id,
        password=hashed_password,
        status=request.status,
    )

    db.add(new_teacher)
    db.delete(otp_record)
    db.commit()
    db.refresh(new_teacher)

    access_token = create_access_token(
        data={"sub": new_teacher.email, "role": "teacher"}
    )

    return {"access_token": access_token, "token_type": "bearer"}


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


@router.post("/send-otp")
def request_teacher_otp(request: TeacherOTPRequest, db: Session = Depends(get_db)):

    # 1. Check if the email is already registered as a Teacher
    existing_teacher = db.query(Teacher).filter(Teacher.email == request.email).first()
    if existing_teacher:
        raise HTTPException(
            status_code=400, detail="This email is already registered. Please log in."
        )

    # 2. Generate a 6-digit random OTP
    otp_code = str(random.randint(100000, 999999))

    # 3. Set expiration time (e.g., 5 minutes from now)
    expiry_time = datetime.now() + timedelta(minutes=5)

    # 4. Check if an OTP already exists for this email in the database
    existing_otp = db.query(OTPCode).filter(OTPCode.email == request.email).first()

    if existing_otp:
        # Agar purana OTP hai, toh usko update kar do naye wale se
        existing_otp.otp = otp_code
        existing_otp.expires_at = expiry_time
    else:
        # Agar nahi hai, toh naya OTP record banao
        new_otp = OTPCode(email=request.email, otp=otp_code, expires_at=expiry_time)
        db.add(new_otp)

    db.commit()

    # ==========================================
    # 5. SEND EMAIL LOGIC
    # ==========================================
    email_sent = send_otp_email(request.email, otp_code)
    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send the email. Please try again later.",
        )

    return {"message": "OTP has been sent to your email successfully."}


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
    current_teacher=Depends(get_current_teacher),  # The Bouncer!
):
    # 1. Find the appointment AND verify it belongs to this specific teacher
    appointment = (
        db.query(Appointment)
        .filter(
            Appointment.id == appointment_id,
            Appointment.teacher_id == current_teacher.id,
        )
        .first()
    )

    # 2. If it doesn't exist or belongs to someone else, block them!
    if not appointment:
        raise HTTPException(
            status_code=404,
            detail="Appointment not found or you are not authorized to update it",
        )

    # 3. Update the status
    appointment.status = update_data.status

    # 4. Save the changes to MySQL
    db.commit()
    db.refresh(appointment)

    return {
        "message": f"Appointment {appointment.status} successfully!",
        "appointment_id": appointment.id,
        "new_status": appointment.status,
    }


from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
import os

# Update tokenUrl to match your teacher login endpoint
oauth2_scheme_teacher = OAuth2PasswordBearer(tokenUrl="api/teacher/login")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"


@router.get("/profile")
def get_teacher_profile(
    token: str = Depends(oauth2_scheme_teacher), db: Session = Depends(get_db)
):
    # 1. Decode the token to get the teacher's email
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

    # 2. Fetch the teacher from the database (Make sure your Model is imported as Teacher)
    teacher = db.query(Teacher).filter(Teacher.email == email).first()
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found"
        )

    # 3. Return the teacher details
    return teacher
