import os
from datetime import datetime, timedelta, timezone
from sqlalchemy import inspect, text

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine, SessionLocal
import app.models  # Ensures all SQLAlchemy models are registered and relationships resolved

from app.routers import student as student_router
from app.routers import teacher as teacher_router
from app.routers import admin as admin_router
from app.routers import message as message_router

app = FastAPI(
    title="Digital Faculty Assistant API",
    description="Backend API for managing teacher availability, CR management, and student requests.",
)

# --- 1. MIDDLEWARE ---
default_origins = "http://localhost:8000,http://127.0.0.1:8000,http://localhost:5173,http://127.0.0.1:5173"
raw_origins = os.getenv("CORS_ORIGINS", default_origins)
origins = list(set([o.strip() for o in (raw_origins + "," + default_origins).split(",") if o.strip()]))

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


def _ensure_schema_columns():
    """Safely check and add columns that may not exist if tables were created previously."""
    try:
        inspector = inspect(engine)
        table_names = inspector.get_table_names()

        if "appointments" in table_names:
            appt_cols = [c["name"] for c in inspector.get_columns("appointments")]
            with engine.connect() as conn:
                if "student_last_read" not in appt_cols:
                    conn.execute(text("ALTER TABLE appointments ADD COLUMN student_last_read DATETIME NULL"))
                if "teacher_last_read" not in appt_cols:
                    conn.execute(text("ALTER TABLE appointments ADD COLUMN teacher_last_read DATETIME NULL"))
                conn.commit()

        if "teachers" in table_names:
            teacher_cols = [c["name"] for c in inspector.get_columns("teachers")]
            with engine.connect() as conn:
                if "staff_type" not in teacher_cols:
                    conn.execute(text("ALTER TABLE teachers ADD COLUMN staff_type VARCHAR(50) NOT NULL DEFAULT 'Teaching'"))
                if "is_admin" not in teacher_cols:
                    conn.execute(text("ALTER TABLE teachers ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE"))
                if "setup_token" not in teacher_cols:
                    conn.execute(text("ALTER TABLE teachers ADD COLUMN setup_token VARCHAR(255) NULL"))
                if "setup_token_expires" not in teacher_cols:
                    conn.execute(text("ALTER TABLE teachers ADD COLUMN setup_token_expires DATETIME NULL"))
                conn.commit()

        if "students" in table_names:
            student_cols = [c["name"] for c in inspector.get_columns("students")]
            with engine.connect() as conn:
                if "section" not in student_cols:
                    conn.execute(text("ALTER TABLE students ADD COLUMN section VARCHAR(20) NULL"))
                if "is_cr" not in student_cols:
                    conn.execute(text("ALTER TABLE students ADD COLUMN is_cr BOOLEAN NOT NULL DEFAULT FALSE"))
                conn.commit()
    except Exception as e:
        print(f"[Schema Migration] Column check skipped or failed: {e}")


# --- 3. STARTUP DB INITIALIZATION & ADMIN BOOTSTRAP ---
@app.on_event("startup")
def startup_init():
    try:
        _ensure_schema_columns()
    except Exception as e:
        print(f"[Warning] Could not ensure schema columns: {e}")

    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"[Warning] Could not initialize database tables: {e}")

    # Admin bootstrap
    from app.models.teacher import Teacher
    from app.utils.security import generate_setup_token
    from app.utils.email_sender import send_teacher_setup_email
    from app.routers.admin import _generate_next_teacher_id

    bootstrap_email = os.getenv("ADMIN_BOOTSTRAP_EMAIL")
    if not bootstrap_email:
        return

    try:
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

            now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
            setup_token = generate_setup_token()
            new_admin = Teacher(
                id=_generate_next_teacher_id(db),
                name="Admin",
                email=bootstrap_email,
                department_id=None,
                password=None,
                is_admin=True,
                setup_token=setup_token,
                setup_token_expires=now_utc + timedelta(hours=24),
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
    except Exception as e:
        print(f"[Bootstrap] Error bootstrapping admin: {e}")
