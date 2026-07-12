import os
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
import jwt

# 1. Configuration variables
# We grab existing secret key from the .env file
SECRET_KEY = os.getenv("SECRET_KEY", "super_secret_key_for_teacher_availability_app")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # Token expires in 1 hour

# 2. Setup the password hashing context (using bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# 3. Function to hash a password before saving to the database
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


# 4. Function to verify a plain password against a hashed one during login
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# 5. Function to generate the JWT "VIP Wristband"
def create_access_token(data: dict):
    to_encode = data.copy()

    # Set the expiration time
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})

    # Generate the token using your secret key and the algorithm
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt


from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError  # Make sure you have these imported!

# This tells FastAPI where the login route is
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/student/login")


# This is the "Bouncer" that checks the wristband
def get_current_user_email(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # We unlock the token using your SECRET_KEY
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        return email
    except JWTError:
        raise credentials_exception


from sqlalchemy.orm import Session
from app.database import get_db
from app.models.teacher import Teacher


# This new guard checks if the token belongs to a TEACHER
def get_current_teacher(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authorized as a teacher",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decode the token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")  # We look for the "role" we saved during login

        if email is None or role != "teacher":
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    # Find the teacher in the database
    teacher = db.query(Teacher).filter(Teacher.email == email).first()
    if teacher is None:
        raise credentials_exception

    return teacher
