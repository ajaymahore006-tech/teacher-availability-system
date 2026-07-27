from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers import student as student_router
from app.routers import teacher as teacher_router

from app.models import student as student_model
from app.models import request as request_model
from app.models import teacher as teacher_model
from app.models import department as department_model
from app.models.appointment import Appointment as student_appointment

# Create all database tables
Base.metadata.create_all(bind=engine)

# Initilize the fastapi app
app = FastAPI(
    title="Digital Faculty Assistant API",
    description="Backend API for managing teacher availability and student requests.",
)

# --- 1. MIDDLEWARE ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8000", 
        "http://127.0.0.1:8000"
    ],  # EXACT frontend URLs (Live Server ports)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(student_router.router)
app.include_router(teacher_router.router)

app.mount("/assets", StaticFiles(directory="frontend/assets"), name="assets")
# First, mount the /static path to serve your CSS and JS
app.mount("/static", StaticFiles(directory="frontend/static"), name="static")

# Second, mount the root "/" path to serve your HTML templates
app.mount("/", StaticFiles(directory="frontend/templates", html=True), name="frontend")
