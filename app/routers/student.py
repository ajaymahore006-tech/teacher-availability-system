from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.student import Student
from app.schemas.student import StudentLogin, StudentResponse, StudentPasswordReset
from app.utils.security import verify_password, create_access_token, get_password_hash
from app.utils.email_sender import send_otp_email
import random
from datetime import datetime, timedelta
from app.schemas.otp import OTPRequest, StudentSignupWithOTP
from app.models.otp import OTPCode

# Initialize the router
router = APIRouter(prefix="/api/student", tags=["Student Authentication"])


@router.post("/send-otp")
def send_registration_otp(request: OTPRequest, db: Session = Depends(get_db)):
    # 1. Check if the student is already fully registered
    existing_student = db.query(Student).filter(Student.email == request.email).first()
    if existing_student:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )
    # 2. Generate a random 6-digit OTP and set expiration (10 minutes)
    otp_code = str(random.randint(100000, 999999))
    expiration_time = datetime.now() + timedelta(minutes=10)

    # 3. Save to the temporary otp_codes table
    # If they requested an OTP before but didn't use it, we just update the old one
    existing_otp_record = (
        db.query(OTPCode).filter(OTPCode.email == request.email).first()
    )

    if existing_otp_record:
        existing_otp_record.otp = otp_code
        existing_otp_record.expires_at = expiration_time
    else:
        new_otp_record = OTPCode(
            email=request.email, otp=otp_code, expires_at=expiration_time
        )
        db.add(new_otp_record)

    db.commit()

    # 4. Trigger the email utility function
    email_sent = send_otp_email(request.email, otp_code)

    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send the email. Please try again later.",
        )

    return {"message": "OTP sent successfully. Please check your college email."}


# (The /signup and /login routes will go below this)


@router.post(
    "/signup", response_model=StudentResponse, status_code=status.HTTP_201_CREATED
)
def register_student(request: StudentSignupWithOTP, db: Session = Depends(get_db)):
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

    # 4. Check if the roll number is already taken
    existing_roll = db.query(Student).filter(Student.roll_no == request.roll_no).first()
    if existing_roll:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This roll number is already registered.",
        )

    # 5. Hash the password and create the student
    hashed_password = get_password_hash(request.password)
    new_student = Student(
        email=request.email,
        password=hashed_password,
        name=request.name,
        roll_no=request.roll_no,
    )

    # 6. Save the student and delete the used OTP
    db.add(new_student)
    db.delete(otp_record)
    db.commit()
    db.refresh(new_student)

    return new_student


@router.post("/login")
def login_student(credentials: StudentLogin, db: Session = Depends(get_db)):
    # 1. Search the database for the student's email
    student = db.query(Student).filter(Student.email == credentials.email).first()

    # 2. Verify the student exists AND the password is correct
    if not student or not verify_password(credentials.password, student.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Generate the JWT (The "VIP Wristband")
    access_token = create_access_token(data={"sub": student.email, "role": "student"})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "message": "Login successful",
    }


@router.post("/forgot-password")
def forgot_password(request: OTPRequest, db: Session = Depends(get_db)):
    # 1. Check if the student actually exists in our system
    student = db.query(Student).filter(Student.email == request.email).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account with this email does not exist.",
        )

    # 2. Generate the OTP and set a 10-minute expiration
    otp_code = str(random.randint(100000, 999999))
    expiration_time = datetime.now() + timedelta(minutes=10)

    # 3. Save to the temporary otp_codes table (UPSERT logic)
    existing_otp_record = (
        db.query(OTPCode).filter(OTPCode.email == request.email).first()
    )
    if existing_otp_record:
        existing_otp_record.otp = otp_code
        existing_otp_record.expires_at = expiration_time
    else:
        new_otp_record = OTPCode(
            email=request.email, otp=otp_code, expires_at=expiration_time
        )
        db.add(new_otp_record)

    db.commit()

    # 4. Trigger the email utility function
    email_sent = send_otp_email(request.email, otp_code)
    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send the reset email. Please try again later.",
        )

    return {
        "message": "Password reset OTP sent successfully. Please check your college email."
    }


@router.post("/reset-password")
def reset_password(request: StudentPasswordReset, db: Session = Depends(get_db)):
    # 1. Fetch the OTP record and the Student record
    otp_record = db.query(OTPCode).filter(OTPCode.email == request.email).first()
    student = db.query(Student).filter(Student.email == request.email).first()

    # 2. Verify everything is valid
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Student not found."
        )
    if not otp_record or otp_record.otp != request.otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or missing OTP."
        )
    if otp_record.expires_at < datetime.now():
        db.delete(otp_record)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="OTP has expired."
        )

    # 3. Hash the new password and update the database
    # We hash the new password, update the database, and delete the used OTP[cite: 539].
    student.password = get_password_hash(request.new_password)
    db.delete(otp_record)
    db.commit()

    return {"message": "Password has been reset successfully. You can now log in."}


from app.utils.security import get_current_user_email  # Add this to your imports


@router.get("/dashboard")
def student_dashboard(current_email: str = Depends(get_current_user_email)):
    return {
        "message": "Welcome to the VIP area!",
        "your_email": current_email,
        "secret_data": "Here is the data only logged-in students can see.",
    }


