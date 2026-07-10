import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# load environments veriables
load_dotenv()

# Database configuration
db_host = os.getenv("DB_HOST", "127.0.0.1")
db_port = os.getenv("DB_PORT", "3306")
db_user = os.getenv("DB_USER", "root")
db_password = os.getenv("DB_PASSWORD", "mahoreajay123")
db_name = os.getenv("DB_NAME", "DFA")

# Create database url 
SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

# Create sqllchemyu engine 
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Create sessionlocal class
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

# Create base class for our models to inherite from
Base = SessionLocal()

# Dependency to get the database session for our API routes
def get_db():
    db = SessionLocal()
    try:
        yield db 
    finally:
        db.close()




