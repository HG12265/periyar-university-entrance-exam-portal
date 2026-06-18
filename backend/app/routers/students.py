from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Student, StudentDegree, ExamAttempt, Admin
from app.schemas import StudentCreate, StudentResponse
from app.auth import get_current_admin

router = APIRouter(prefix="/api/v1/students", tags=["Students"])

@router.post("/register")
def register_student(student_data: StudentCreate, db: Session = Depends(get_db)):
    # Check if student with application number exists
    existing_student = db.query(Student).filter(Student.application_number == student_data.application_number).first()
    
    if existing_student:
        # Check if they have attempts
        attempt = db.query(ExamAttempt).filter(ExamAttempt.student_id == existing_student.id).first()
        if attempt:
            if attempt.is_submitted:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This application number has already completed the examination. Duplicate attempts are not allowed."
                )
            else:
                # They have an active attempt. Allow them to resume.
                return {
                    "student": {
                        "id": existing_student.id,
                        "application_number": existing_student.application_number,
                        "name": existing_student.name,
                        "community": existing_student.community,
                        "email": existing_student.email,
                        "mobile": existing_student.mobile,
                        "ug_percentage": existing_student.ug_percentage,
                        "registered_at": existing_student.registered_at,
                        "degrees": [d.degree for d in existing_student.degrees]
                    },
                    "status": "resume",
                    "attempt_id": attempt.id
                }
        
        # Registered but no attempt yet
        return {
            "student": {
                "id": existing_student.id,
                "application_number": existing_student.application_number,
                "name": existing_student.name,
                "community": existing_student.community,
                "email": existing_student.email,
                "mobile": existing_student.mobile,
                "ug_percentage": existing_student.ug_percentage,
                "registered_at": existing_student.registered_at,
                "degrees": [d.degree for d in existing_student.degrees]
            },
            "status": "registered",
            "attempt_id": None
        }

    # Validate degrees input
    if not student_data.degrees:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one degree must be selected."
        )

    # Create new student
    new_student = Student(
        application_number=student_data.application_number,
        name=student_data.name,
        community=student_data.community,
        email=student_data.email,
        mobile=student_data.mobile,
        ug_percentage=student_data.ug_percentage
    )
    db.add(new_student)
    db.flush()  # Acquire student ID before inserting degrees
    
    # Save student degrees
    for deg in student_data.degrees:
        deg_record = StudentDegree(
            student_id=new_student.id,
            degree=deg
        )
        db.add(deg_record)
        
    db.commit()
    db.refresh(new_student)
    
    return {
        "student": {
            "id": new_student.id,
            "application_number": new_student.application_number,
            "name": new_student.name,
            "community": new_student.community,
            "email": new_student.email,
            "mobile": new_student.mobile,
            "ug_percentage": new_student.ug_percentage,
            "registered_at": new_student.registered_at,
            "degrees": [d.degree for d in new_student.degrees]
        },
        "status": "new",
        "attempt_id": None
    }

@router.get("", response_model=List[dict])
def list_students(current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    students_list = db.query(Student).order_by(Student.registered_at.desc()).all()
    results = []
    for s in students_list:
        results.append({
            "id": s.id,
            "application_number": s.application_number,
            "name": s.name,
            "community": s.community,
            "email": s.email,
            "mobile": s.mobile,
            "ug_percentage": s.ug_percentage,
            "registered_at": s.registered_at,
            "degrees": [d.degree for d in s.degrees]
        })
    return results

@router.get("/{application_number}")
def get_student_by_app_num(application_number: str, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.application_number == application_number).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    return {
        "id": student.id,
        "application_number": student.application_number,
        "name": student.name,
        "community": student.community,
        "email": student.email,
        "mobile": student.mobile,
        "ug_percentage": student.ug_percentage,
        "registered_at": student.registered_at,
        "degrees": [d.degree for d in student.degrees]
    }
