import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# load environments veriables
load_dotenv()

# # 1. Calculate the absolute path to the root folder (one level up from 'app')
# BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# # 2. Tell dotenv exactly where the .env file is located
# load_dotenv(os.path.join(BASE_DIR, ".env"))

# Database configuration
db_host = os.getenv("DB_HOST", "localhost")
db_port = os.getenv("DB_PORT", "3306")
db_user = os.getenv("DB_USER", "root")
db_password = os.getenv("DB_PASSWORD", "")
db_name = os.getenv("DB_NAME", "DFA")

# Create database url 
SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

# Create sqllchemyu engine 
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Create sessionlocal class
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

# Create base class for our models to inherite from
Base = declarative_base()

# Dependency to get the database session for our API routes
def get_db():
    db = SessionLocal()
    try:
        yield db 
    finally:
        db.close()




