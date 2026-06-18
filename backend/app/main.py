import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine, SessionLocal
from app.models import Admin
from app.auth import get_password_hash
from app.routers import admin, students, exams, questions, results

# Create tables
Base.metadata.create_all(bind=engine)

# Seed default admin
def seed_admin():
    db = SessionLocal()
    try:
        admin_exists = db.query(Admin).filter(Admin.username == "admin").first()
        if not admin_exists:
            hashed_pw = get_password_hash("admin123")
            default_admin = Admin(
                username="admin",
                password_hash=hashed_pw,
                name="Periyar Admin"
            )
            db.add(default_admin)
            db.commit()
            print("Default admin seeded successfully (admin / admin123).")
    except Exception as e:
        print(f"Error seeding admin: {e}")
    finally:
        db.close()

seed_admin()

app = FastAPI(
    title="Periyar University Entrance Examination Portal API",
    description="Backend services for student registration, exam taking, evaluation, leaderboard, and admin dashboard.",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(admin.router)
app.include_router(students.router)
app.include_router(exams.router)
app.include_router(questions.router)
app.include_router(results.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Periyar University Entrance Examination Portal API. Refer to /docs for API documentation."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
