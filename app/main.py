from fastapi import FastAPI
from app.database import Base, engine
from app.routers import student as student_router
from app.routers import teacher as teacher_router

from app.models import student as student_model
from app.models import request as request_model
from app.models import teacher as teacher_model
from app.models import department as department_model

# Create all database tables
Base.metadata.create_all(bind=engine)

# Initilize the fastapi app
app = FastAPI(
    title="Digital Faculty Assistant API",
    description="Backend API for managing teacher availability and student requests.",
)

app.include_router(student_router.router)
app.include_router(teacher_router.router)

@app.get("/")
def read_root():
    return {'detail':'Welcome to Digital Faculty Assistant API'}
