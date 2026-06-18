from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any
from app.database import get_db
from app.models import Admin, Student, StudentDegree, Exam, Question, ExamAttempt
from app.schemas import AdminResponse, Token
from app.auth import create_access_token, get_current_admin, verify_password, get_password_hash

router = APIRouter(prefix="/api/v1/auth", tags=["Admin Auth"])

@router.post("/login", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.username == form_data.username).first()
    if not admin or not verify_password(form_data.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": admin.username})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=AdminResponse)
def read_admin_me(current_admin: Admin = Depends(get_current_admin)):
    return current_admin

@router.get("/dashboard-stats")
def get_dashboard_stats(current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    # 1. Total counts
    total_students = db.query(Student).count()
    total_exams = db.query(Exam).count()
    total_questions = db.query(Question).count()
    total_submissions = db.query(ExamAttempt).filter(ExamAttempt.is_submitted == True).count()
    total_active_attempts = db.query(ExamAttempt).filter(ExamAttempt.is_submitted == False).count()

    # 2. Submissions by degree
    degree_counts = db.query(
        StudentDegree.degree, func.count(StudentDegree.student_id)
    ).group_by(StudentDegree.degree).all()
    
    DEGREE_NAME_MAP = {
        "MCA": "MCA",
        "MSC_CS": "M.Sc Computer Science",
        "MSC_DS": "M.Sc Data Science"
    }
    degree_stats = {DEGREE_NAME_MAP.get(deg, deg): count for deg, count in degree_counts}

    # 3. Community distributions
    community_counts = db.query(
        Student.community, func.count(Student.id)
    ).group_by(Student.community).all()
    community_stats = {community: count for community, count in community_counts}

    # 4. Average scores
    avg_score = db.query(func.avg(ExamAttempt.score)).filter(ExamAttempt.is_submitted == True).scalar()
    avg_score = round(float(avg_score), 2) if avg_score is not None else 0.0

    return {
        "totals": {
            "students": total_students,
            "exams": total_exams,
            "questions": total_questions,
            "submissions": total_submissions,
            "active_attempts": total_active_attempts,
            "average_score": avg_score
        },
        "by_degree": degree_stats,
        "by_community": community_stats
    }
