from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Student, StudentDegree, ExamAttempt, Admin
from app.schemas import StudentCreate, StudentResponse
from app.auth import get_current_admin
from app.limiter import limiter

router = APIRouter(prefix="/api/v1/students", tags=["Students"])


def _student_dict(s: Student) -> dict:
    """Serialize a Student ORM object to a dict (used in all responses)."""
    return {
        "id": s.id,
        "application_number": s.application_number,
        "name": s.name,
        "community": s.community,
        "email": s.email,
        "mobile": s.mobile,
        "ug_percentage": s.ug_percentage,
        "date_of_birth": str(s.date_of_birth) if s.date_of_birth else None,
        "registered_at": s.registered_at,
        "degrees": [d.degree for d in s.degrees],
    }


@router.post("/register")
@limiter.limit("10/minute")
def register_student(request: Request, student_data: StudentCreate, db: Session = Depends(get_db)):
    # ── Check Application Number uniqueness ──────────────────────────────────
    existing_by_appno = db.query(Student).filter(
        Student.application_number == student_data.application_number
    ).first()

    if existing_by_appno:
        attempt = db.query(ExamAttempt).filter(
            ExamAttempt.student_id == existing_by_appno.id
        ).first()
        if attempt:
            if attempt.is_submitted:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This application number has already completed the examination. Duplicate attempts are not allowed."
                )
            else:
                # Active attempt → allow resume
                return {
                    "student": _student_dict(existing_by_appno),
                    "status": "resume",
                    "attempt_id": attempt.id,
                }
        # Registered but no attempt yet → go to instructions
        return {
            "student": _student_dict(existing_by_appno),
            "status": "registered",
            "attempt_id": None,
        }

    # ── Check Email uniqueness (friendly message) ────────────────────────────
    existing_by_email = db.query(Student).filter(
        Student.email == str(student_data.email)
    ).first()
    if existing_by_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email address is already registered with another application number. Please use a different email."
        )

    # ── Validate degree selection ────────────────────────────────────────────
    if not student_data.degrees:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one degree must be selected."
        )

    # ── Create new student ───────────────────────────────────────────────────
    new_student = Student(
        application_number=student_data.application_number,
        name=student_data.name,
        community=student_data.community,
        email=str(student_data.email),
        mobile=student_data.mobile,
        ug_percentage=student_data.ug_percentage,
        date_of_birth=student_data.date_of_birth,
    )
    db.add(new_student)
    db.flush()  # get new_student.id before inserting degrees

    for deg in student_data.degrees:
        db.add(StudentDegree(student_id=new_student.id, degree=deg))

    db.commit()
    db.refresh(new_student)

    return {
        "student": _student_dict(new_student),
        "status": "new",
        "attempt_id": None,
    }


@router.get("", response_model=List[dict])
def list_students(
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    students_list = db.query(Student).order_by(Student.registered_at.desc()).all()
    return [_student_dict(s) for s in students_list]


@router.get("/{application_number}")
def get_student_by_app_num(application_number: str, db: Session = Depends(get_db)):
    student = db.query(Student).filter(
        Student.application_number == application_number
    ).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    return _student_dict(student)
