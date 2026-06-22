import io
import re
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Student, StudentDegree, ExamAttempt, Admin
from app.schemas import StudentCreate, StudentResponse, StudentLogin
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
        "course": s.course,
        "quota": s.quota,
        "registered_at": s.registered_at,
        "degrees": [d.degree for d in s.degrees],
    }


@router.post("/login")
@limiter.limit("15/minute")
def login_student(request: Request, login_data: StudentLogin, db: Session = Depends(get_db)):
    app_nums = []
    if login_data.application_mca and login_data.application_mca.strip():
        app_nums.append(login_data.application_mca.strip())
    if login_data.application_cs and login_data.application_cs.strip():
        app_nums.append(login_data.application_cs.strip())
    if login_data.application_ds and login_data.application_ds.strip():
        app_nums.append(login_data.application_ds.strip())

    if not app_nums:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter at least one Application Number."
        )

    # Find all student records matching these application numbers
    students = db.query(Student).filter(Student.application_number.in_(app_nums)).all()

    if not students:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No matching candidate found for the provided Application Number(s)."
        )

    primary_student = students[0]
    student_list = [_student_dict(s) for s in students]

    # Check attempt status of primary
    attempt = db.query(ExamAttempt).filter(
        ExamAttempt.student_id == primary_student.id
    ).first()

    if attempt:
        if attempt.is_submitted:
            return {
                "student": _student_dict(primary_student),
                "students": student_list,
                "status": "submitted",
                "attempt_id": attempt.id,
            }
        else:
            return {
                "student": _student_dict(primary_student),
                "students": student_list,
                "status": "resume",
                "attempt_id": attempt.id,
            }

    return {
        "student": _student_dict(primary_student),
        "students": student_list,
        "status": "eligible",
        "attempt_id": None,
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
        course=student_data.course,
        quota=student_data.quota,
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


@router.post("/bulk-upload")
async def bulk_upload_students(
    file: UploadFile = File(...),
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    if not (file.filename.endswith(".xlsx") or file.filename.endswith(".xls") or file.filename.endswith(".csv")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload an Excel (.xlsx/.xls) or CSV file."
        )

    contents = await file.read()
    try:
        if file.filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error reading Excel/CSV file: {str(e)}"
        )

    if df.empty:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty."
        )

    # Helper to find column by flexible names
    def find_column(dataframe, possible_names):
        for col in dataframe.columns:
            if str(col).strip().lower() in [n.lower() for n in possible_names]:
                return col
        return None

    degree_col = find_column(df, ["Degree"])
    course_col = find_column(df, ["Course"])
    app_no_col = find_column(df, ["Application No.", "Application No", "Application Number", "App No"])
    name_col = find_column(df, ["Student Name", "Name", "StudentName"])
    community_col = find_column(df, ["Community"])
    quota_col = find_column(df, ["Quota"])
    email_col = find_column(df, ["E-mail", "Email", "E-mail ID", "Email ID"])
    mobile_col = find_column(df, ["Mobile No.", "Mobile No", "Mobile", "Mobile Number", "Phone"])
    percentage_col = find_column(df, ["Percentage (%)", "Percentage", "Percentage(%)", "UG Percentage", "UG %"])

    # Validate that we have the key columns
    missing = []
    if not app_no_col: missing.append("Application No.")
    if not name_col: missing.append("Student Name")
    if not mobile_col: missing.append("Mobile No.")

    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing required columns: {', '.join(missing)}"
        )

    def normalize_degree(deg_str: str) -> str:
        deg_clean = str(deg_str).strip().lower().replace(".", "").replace(" ", "").replace("-", "")
        if "mca" in deg_clean:
            return "MCA"
        elif "computer" in deg_clean or "cs" in deg_clean:
            return "MSC_CS"
        elif "data" in deg_clean or "ds" in deg_clean:
            return "MSC_DS"
        return str(deg_str).strip().upper()

    def clean_val(val):
        if pd.isna(val) or val is None:
            return ""
        v_str = str(val).strip()
        if v_str.lower() in ["nan", "none"]:
            return ""
        # Handle excel float numbers converted to strings for integer fields
        if v_str.endswith(".0"):
            v_str = v_str[:-2]
        return v_str

    added_count = 0
    updated_count = 0
    errors = []

    for idx, row in df.iterrows():
        try:
            app_num = clean_val(row[app_no_col])
            if not app_num:
                errors.append(f"Row {idx+2}: Missing Application Number. Skipping.")
                continue

            name = clean_val(row[name_col])
            mobile = clean_val(row[mobile_col])
            if not name or not mobile:
                errors.append(f"Row {idx+2}: Missing Student Name or Mobile Number. Skipping.")
                continue

            community = clean_val(row[community_col]) if community_col else "OC"
            if not community:
                community = "OC"

            email = clean_val(row[email_col]) if email_col else f"{app_num.lower()}@periyar.edu"
            if not email:
                email = f"{app_num.lower()}@periyar.edu"

            course = clean_val(row[course_col]) if course_col else ""
            quota = clean_val(row[quota_col]) if quota_col else ""

            pct_val = 0.0
            if percentage_col:
                try:
                    pct_str = clean_val(row[percentage_col])
                    if pct_str:
                        pct_val = float(pct_str.replace("%", "").strip())
                except Exception:
                    pct_val = 0.0

            # Check if student exists
            student = db.query(Student).filter(Student.application_number == app_num).first()
            is_new = False
            if not student:
                is_new = True
                student = Student(
                    application_number=app_num,
                    name=name,
                    community=community,
                    email=email,
                    mobile=mobile,
                    ug_percentage=pct_val,
                    course=course,
                    quota=quota
                )
                db.add(student)
                db.flush()
                added_count += 1
            else:
                student.name = name
                student.community = community
                student.email = email
                student.mobile = mobile
                student.ug_percentage = pct_val
                student.course = course
                student.quota = quota
                updated_count += 1

            # Update degrees
            if degree_col:
                # delete existing degree associations for this student if updating
                if not is_new:
                    db.query(StudentDegree).filter(StudentDegree.student_id == student.id).delete()
                    db.flush()

                deg_raw = clean_val(row[degree_col])
                # Split comma/semicolon/slash-separated degrees
                degrees_split = re.split(r'[,;/+]', deg_raw)
                for d_str in degrees_split:
                    d_clean = d_str.strip()
                    if d_clean:
                        norm_deg = normalize_degree(d_clean)
                        db.add(StudentDegree(student_id=student.id, degree=norm_deg))
            
            db.commit()

        except Exception as row_err:
            db.rollback()
            errors.append(f"Row {idx+2}: Error saving student {app_num}: {str(row_err)}")

    return {
        "status": "success",
        "added_count": added_count,
        "updated_count": updated_count,
        "errors": errors
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
