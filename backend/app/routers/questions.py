import io
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Question, Exam, Admin
from app.schemas import QuestionCreate, QuestionResponse
from app.auth import get_current_admin

router = APIRouter(prefix="/api/v1/questions", tags=["Questions"])

def get_or_create_exam(db: Session) -> Exam:
    exam = db.query(Exam).first()
    if not exam:
        exam = Exam(
            name="Periyar University Entrance Examination 2026",
            total_questions=30,
            duration_minutes=30,
            negative_mark=0.0,
            start_date=pd.Timestamp.now(),
            end_date=pd.Timestamp.now() + pd.Timedelta(days=30),
            result_visibility=True
        )
        db.add(exam)
        db.commit()
        db.refresh(exam)
    return exam

# Admin CRUD
@router.get("", response_model=List[QuestionResponse])
def get_all_questions(current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    exam = get_or_create_exam(db)
    return db.query(Question).filter(Question.exam_id == exam.id).all()

@router.post("", response_model=QuestionResponse)
def create_question(question_data: QuestionCreate, current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    exam = get_or_create_exam(db)
    new_q = Question(
        exam_id=exam.id,
        question_text=question_data.question_text,
        option_a=question_data.option_a,
        option_b=question_data.option_b,
        option_c=question_data.option_c,
        option_d=question_data.option_d,
        correct_option=question_data.correct_option.upper(),
        marks=question_data.marks
    )
    db.add(new_q)
    db.commit()
    db.refresh(new_q)
    return new_q

@router.put("/{question_id}", response_model=QuestionResponse)
def update_question(question_id: int, question_data: QuestionCreate, current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    question.question_text = question_data.question_text
    question.option_a = question_data.option_a
    question.option_b = question_data.option_b
    question.option_c = question_data.option_c
    question.option_d = question_data.option_d
    question.correct_option = question_data.correct_option.upper()
    question.marks = question_data.marks
    
    db.commit()
    db.refresh(question)
    return question

@router.delete("/{question_id}")
def delete_question(question_id: int, current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    db.delete(question)
    db.commit()
    return {"status": "deleted", "question_id": question_id}

@router.post("/bulk-upload")
async def bulk_upload_questions(
    file: UploadFile = File(...),
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # Check if the file is Excel
    if not (file.filename.endswith(".xlsx") or file.filename.endswith(".xls") or file.filename.endswith(".csv")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload an Excel (.xlsx/.xls) or CSV file."
        )
        
    contents = await file.read()
    exam = get_or_create_exam(db)
    
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
        
    # Check column names or assume default order:
    # 0: Question, 1: Option A, 2: Option B, 3: Option C, 4: Option D, 5: Correct Answer, 6: Marks
    added_count = 0
    errors = []
    
    for idx, row in df.iterrows():
        try:
            # Clean values
            q_text = str(row.iloc[0]).strip()
            opt_a = str(row.iloc[1]).strip()
            opt_b = str(row.iloc[2]).strip()
            opt_c = str(row.iloc[3]).strip()
            opt_d = str(row.iloc[4]).strip()
            correct = str(row.iloc[5]).strip().upper()
            
            # Marks defaults to 1.0 if not provided or invalid
            try:
                marks = float(row.iloc[6]) if len(row) > 6 and not pd.isna(row.iloc[6]) else 1.0
            except:
                marks = 1.0
                
            if not q_text or q_text == "nan":
                continue  # Skip empty rows
                
            # Validate correct option
            if correct not in ["A", "B", "C", "D"]:
                errors.append(f"Row {idx + 2}: Correct Answer '{correct}' must be A, B, C, or D.")
                continue
                
            # Create question
            db_q = Question(
                exam_id=exam.id,
                question_text=q_text,
                option_a=opt_a,
                option_b=opt_b,
                option_c=opt_c,
                option_d=opt_d,
                correct_option=correct,
                marks=marks
            )
            db.add(db_q)
            added_count += 1
            
        except Exception as row_error:
            errors.append(f"Row {idx + 2}: Failed to process due to: {str(row_error)}")
            
    if added_count > 0:
        db.commit()
        
    return {
        "status": "success" if not errors else "partial_success",
        "added_count": added_count,
        "errors": errors
    }
