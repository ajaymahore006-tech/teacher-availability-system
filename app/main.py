from fastapi import FastAPI
from database import Base, engine

# Create all database tables
Base.metadata.create_all(bind=engine)

# Initilize the fastapi app
app = FastAPI(
    title="Digital Faculty Assistant API",
    description="Backend API for managing teacher availability and student requests.",
)

@app.get("/")
def read_root():
    return {'detail':'Welcome to Digital Faculty Assistant API'}
