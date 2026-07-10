import os
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
import jwt

# 1. Configuration variables
# We grab existing secret key from the .env file
SECRET_KEY = os.getenv("SECRET_KEY", "super_secret_key_for_teacher_availability_app")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60   # Token expires in 1 hour

# 2. Setup the password hashing context (using bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 3. Function to hash a password before saving to the database
def get_password_hash(password:str)->str:
    return pwd_context.hash(password)

# 4. Function to verify a plain password against a hashed one during login
def verify_password(plain_password:str, hashed_password:str)->bool:
    return pwd_context.verify(  plain_password, hashed_password)

# 5. Function to generate the JWT "VIP Wristband"
def create_access_token(data:dict):
    to_encode=data.copy()

    # Set the expiration time
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})

    # Generate the token using your secret key and the algorithm
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt