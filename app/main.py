# PLACE AT: app/main.py  (REPLACES your existing file)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine, SessionLocal
from app.routers import student as student_router
from app.routers import teacher as teacher_router
from app.routers import admin as admin_router
from app.routers import message as message_router

from app.models import student as student_model
from app.models import request as request_model
from app.models import teacher as teacher_model
from app.models import department as department_model
from app.models import teacher_request as teacher_request_model
from app.models import message as message_model
from app.models.appointment import Appointment as student_appointment
import os
from datetime import datetime, timedelta

# Create all database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Digital Faculty Assistant API",
    description="Backend API for managing teacher availability and student requests.",
)

# --- 1. MIDDLEWARE ---
default_origins = "http://localhost:8000,http://127.0.0.1:8000,http://localhost:5173,http://127.0.0.1:5173"
origins = os.getenv("CORS_ORIGINS", default_origins).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. ROUTERS ---
app.include_router(student_router.router)
app.include_router(teacher_router.router)
app.include_router(admin_router.router)
app.include_router(message_router.router)


# --- 3. ADMIN BOOTSTRAP ---
# On startup, if ADMIN_BOOTSTRAP_EMAIL is set in .env:
#   - if a teacher with that email already exists, promote them to admin
#   - otherwise, create a fresh teacher record for them (no password yet)
#     and send them a "set your password" email so they can activate it.
# Once you've promoted a second real admin through the Admin Panel UI,
# you can safely delete ADMIN_BOOTSTRAP_EMAIL from your .env — nothing
# in the code needs to change.
@app.on_event("startup")
def bootstrap_admin():
    from app.models.teacher import Teacher
    from app.utils.security import generate_setup_token
    from app.utils.email_sender import send_teacher_setup_email
    from app.routers.admin import _generate_next_teacher_id

    bootstrap_email = os.getenv("ADMIN_BOOTSTRAP_EMAIL")
    if not bootstrap_email:
        return

    db = SessionLocal()
    try:
        existing = db.query(Teacher).filter(Teacher.email == bootstrap_email).first()

        if existing:
            if not existing.is_admin:
                existing.is_admin = True
                db.commit()
                print(f"[Bootstrap] Promoted existing teacher '{bootstrap_email}' to admin.")
            else:
                print(f"[Bootstrap] '{bootstrap_email}' is already an admin. Nothing to do.")
            return

        setup_token = generate_setup_token()
        new_admin = Teacher(
            id=_generate_next_teacher_id(db),
            name="Admin",
            email=bootstrap_email,
            department_id=None,
            password=None,
            is_admin=True,
            setup_token=setup_token,
            setup_token_expires=datetime.utcnow() + timedelta(hours=24),
        )
        db.add(new_admin)
        db.commit()

        print(f"[Bootstrap] Admin account created for '{bootstrap_email}'.")
        email_sent = send_teacher_setup_email(bootstrap_email, setup_token)
        if not email_sent:
            frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
            print(f"[Bootstrap] Email failed — use this link manually: {frontend_url}/set-password?token={setup_token}")
    finally:
        db.close()

# Note: Static mounts for frontend templates/assets have been removed
# because React now runs on its own independent Vite server (port 5173),
# and FastAPI serves purely as your backend API service (port 8000).