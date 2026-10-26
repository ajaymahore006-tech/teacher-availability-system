import os
import secrets
from datetime import datetime, timedelta, timezone
import bcrypt
from passlib.context import CryptContext
import jwt

# 1. Configuration variables
SECRET_KEY = os.getenv("SECRET_KEY", "super_secret_key_for_teacher_availability_app")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # Token expires in 1 hour

# 2. Setup fallback password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# 3. Function to hash a password before saving to the database
def get_password_hash(password: str) -> str:
    # Truncate to 72 bytes as required by bcrypt specification
    pw_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pw_bytes, salt).decode("utf-8")


# 4. Function to verify a plain password against a hashed one during login
def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not plain_password or not hashed_password:
        return False
    pw_bytes = plain_password.encode("utf-8")[:72]
    try:
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pw_bytes, hash_bytes)
    except Exception:
        try:
            return pwd_context.verify(plain_password[:72], hashed_password)
        except Exception:
            return False


# 5. Function to generate the JWT "VIP Wristband"
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# 6. Generate a secure one-time setup token (for teacher "set password" links)
def generate_setup_token() -> str:
    return secrets.token_urlsafe(32)


from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt as jose_jwt, JWTError

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/student/login")


# This is the "Bouncer" that checks the wristband
def get_current_user_email(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jose_jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        return email
    except JWTError:
        raise credentials_exception


from sqlalchemy.orm import Session
from app.database import get_db
from app.models.teacher import Teacher


# This guard checks if the token belongs to a TEACHER
def get_current_teacher(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authorized as a teacher",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jose_jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")

        if email is None or role != "teacher":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    teacher = db.query(Teacher).filter(Teacher.email == email).first()
    if teacher is None:
        raise credentials_exception

    return teacher


# Guard: checks if the token belongs to a teacher who is ALSO an admin.
def get_current_admin(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Admin access required",
    )
    try:
        payload = jose_jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")

        if email is None or role != "teacher":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    teacher = db.query(Teacher).filter(Teacher.email == email).first()
    if teacher is None or not teacher.is_admin:
        raise credentials_exception

    return teacher


from app.models.student import Student


def get_current_student(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate student credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jose_jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")

        if email is None or role != "student":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    student = db.query(Student).filter(Student.email == email).first()
    if student is None:
        raise credentials_exception

    return student
