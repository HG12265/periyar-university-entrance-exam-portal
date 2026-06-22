import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.database import get_db
from app.models import Exam, Student, ExamAttempt, Question, StudentAnswer, Admin
from app.schemas import ExamCreate, ExamResponse, ExamSubmitResultResponse
from app.auth import get_current_admin

router = APIRouter(prefix="/api/v1/exams", tags=["Exams"])

def get_main_exam(db: Session) -> Exam:
    exam = db.query(Exam).first()
    if not exam:
        exam = Exam(
            name="Periyar University Entrance Examination 2026",
            total_questions=30,
            duration_minutes=30,
            start_date=datetime.datetime.utcnow(),
            end_date=datetime.datetime.utcnow() + datetime.timedelta(days=30),
            result_visibility=True
        )
        db.add(exam)
        db.commit()
        db.refresh(exam)
    return exam

@router.get("/active")
def get_active_exam(db: Session = Depends(get_db)):
    exam = get_main_exam(db)
    now = datetime.datetime.utcnow()
    is_active = exam.start_date <= now <= exam.end_date
    return {
        "id": exam.id,
        "name": exam.name,
        "total_questions": exam.total_questions,
        "duration_minutes": exam.duration_minutes,
        "start_date": exam.start_date,
        "end_date": exam.end_date,
        "result_visibility": exam.result_visibility,
        "is_active_now": is_active,
        "server_time": now
    }

@router.put("/settings", response_model=ExamResponse)
def update_exam_settings(exam_data: ExamCreate, current_admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    exam = db.query(Exam).first()
    if not exam:
        exam = Exam()
        db.add(exam)
    
    exam.name = exam_data.name
    exam.total_questions = exam_data.total_questions
    exam.duration_minutes = exam_data.duration_minutes
    exam.start_date = exam_data.start_date
    exam.end_date = exam_data.end_date
    exam.result_visibility = exam_data.result_visibility
    
    db.commit()
    db.refresh(exam)
    return exam

class ExamStartRequest(BaseModel):
    application_number: str

@router.post("/start")
def start_exam(payload: ExamStartRequest, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.application_number == payload.application_number).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student registration details not found. Please register first."
        )
    
    exam = get_main_exam(db)
    now = datetime.datetime.utcnow()
    if now < exam.start_date or now > exam.end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The examination is not currently active or available."
        )
        
    # Find all linked students who share the same email
    linked_students = db.query(Student).filter(
        (Student.email == student.email) & (Student.email != "")
    ).all()
    if not linked_students:
        linked_students = [student]

    questions = db.query(Question).filter(Question.exam_id == exam.id).all()
    if not questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No questions are available in the question bank for this exam."
        )

    primary_attempt = None

    for s in linked_students:
        attempt = db.query(ExamAttempt).filter(
            ExamAttempt.student_id == s.id,
            ExamAttempt.exam_id == exam.id
        ).first()
        
        if attempt and attempt.is_submitted:
            if s.id == student.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You have already submitted and completed this examination."
                )
            
        if not attempt:
            attempt = ExamAttempt(
                student_id=s.id,
                exam_id=exam.id,
                started_at=now,
                is_submitted=False
            )
            db.add(attempt)
            db.flush()
            
            for q in questions:
                empty_ans = StudentAnswer(
                    attempt_id=attempt.id,
                    question_id=q.id,
                    selected_option=None,
                    is_correct=None,
                    marks_obtained=0.0
                )
                db.add(empty_ans)
            db.commit()
            
        if s.id == student.id:
            primary_attempt = attempt

    if not primary_attempt:
        primary_attempt = db.query(ExamAttempt).filter(
            ExamAttempt.student_id == student.id,
            ExamAttempt.exam_id == exam.id
        ).first()

    saved_answers = db.query(StudentAnswer).filter(StudentAnswer.attempt_id == primary_attempt.id).all()
    answers_map = {ans.question_id: ans.selected_option for ans in saved_answers}

    questions_list = []
    for q in questions:
        questions_list.append({
            "id": q.id,
            "question_text": q.question_text,
            "option_a": q.option_a,
            "option_b": q.option_b,
            "option_c": q.option_c,
            "option_d": q.option_d,
            "marks": q.marks,
            "image_url": q.image_url,
            "option_a_image_url": q.option_a_image_url,
            "option_b_image_url": q.option_b_image_url,
            "option_c_image_url": q.option_c_image_url,
            "option_d_image_url": q.option_d_image_url,
        })

    elapsed_seconds = (now - attempt.started_at).total_seconds()
    duration_seconds = exam.duration_minutes * 60
    remaining_seconds = max(0, int(duration_seconds - elapsed_seconds))

    return {
        "attempt_id": attempt.id,
        "exam_name": exam.name,
        "duration_minutes": exam.duration_minutes,
        "remaining_seconds": remaining_seconds,
        "questions": questions_list,
        "answers": answers_map
    }

class SaveAnswerPayload(BaseModel):
    attempt_id: int
    question_id: int
    selected_option: Optional[str] = None

@router.post("/save-answer")
def save_answer(payload: SaveAnswerPayload, db: Session = Depends(get_db)):
    attempt = db.query(ExamAttempt).filter(ExamAttempt.id == payload.attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Exam attempt not found.")
    if attempt.is_submitted:
        raise HTTPException(status_code=400, detail="Cannot edit answers of a submitted exam.")
        
    student = db.query(Student).filter(Student.id == attempt.student_id).first()
    
    # Find all linked students who share the same email
    linked_students = db.query(Student).filter(
        (Student.email == student.email) & (Student.email != "")
    ).all()
    if not linked_students:
        linked_students = [student]

    for s in linked_students:
        s_attempt = db.query(ExamAttempt).filter(
            ExamAttempt.student_id == s.id,
            ExamAttempt.exam_id == attempt.exam_id
        ).first()
        
        if s_attempt and not s_attempt.is_submitted:
            db_answer = db.query(StudentAnswer).filter(
                StudentAnswer.attempt_id == s_attempt.id,
                StudentAnswer.question_id == payload.question_id
            ).first()
            
            if not db_answer:
                db_answer = StudentAnswer(
                    attempt_id=s_attempt.id,
                    question_id=payload.question_id
                )
                db.add(db_answer)
                
            db_answer.selected_option = payload.selected_option.upper() if payload.selected_option else None
            
    db.commit()
    return {"status": "saved"}

class SubmitExamPayload(BaseModel):
    attempt_id: int

@router.post("/submit", response_model=ExamSubmitResultResponse)
def submit_exam(payload: SubmitExamPayload, db: Session = Depends(get_db)):
    attempt = db.query(ExamAttempt).filter(ExamAttempt.id == payload.attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Exam attempt not found.")
        
    student = db.query(Student).filter(Student.id == attempt.student_id).first()
    exam = db.query(Exam).filter(Exam.id == attempt.exam_id).first()
    
    # Find all linked students who share the same email
    linked_students = db.query(Student).filter(
        (Student.email == student.email) & (Student.email != "")
    ).all()
    if not linked_students:
        linked_students = [student]

    primary_result = None

    for s in linked_students:
        s_attempt = db.query(ExamAttempt).filter(
            ExamAttempt.student_id == s.id,
            ExamAttempt.exam_id == attempt.exam_id
        ).first()
        
        if not s_attempt:
            continue
            
        degrees_list = [d.degree for d in s.degrees]
        
        if s_attempt.is_submitted:
            saved_answers = db.query(StudentAnswer).filter(StudentAnswer.attempt_id == s_attempt.id).all()
            attempted_count = sum(1 for ans in saved_answers if ans.selected_option is not None)
            entrance_perc = s_attempt.percentage
            final_perc = round((s.ug_percentage * 0.5) + (entrance_perc * 0.5), 2)
            
            res_payload = {
                "attempt_id": s_attempt.id,
                "application_number": s.application_number,
                "student_name": s.name,
                "degrees": degrees_list,
                "total_questions": s_attempt.total_questions,
                "attempted_questions": attempted_count,
                "correct_answers": s_attempt.correct_answers,
                "wrong_answers": s_attempt.wrong_answers,
                "score": s_attempt.score,
                "percentage": s_attempt.percentage,
                "ug_percentage": s.ug_percentage,
                "entrance_percentage": entrance_perc,
                "final_percentage": final_perc,
                "result_visibility": exam.result_visibility
            }
            if s.id == student.id:
                primary_result = res_payload
            continue

        # Score s_attempt
        questions = db.query(Question).filter(Question.exam_id == exam.id).all()
        saved_answers = db.query(StudentAnswer).filter(StudentAnswer.attempt_id == s_attempt.id).all()
        answers_map = {ans.question_id: ans for ans in saved_answers}
        
        correct_count = 0
        wrong_count = 0
        attempted_count = 0
        total_score = 0.0
        
        for q in questions:
            ans = answers_map.get(q.id)
            selected = ans.selected_option if ans else None
            
            if selected:
                attempted_count += 1
                if selected.upper() == q.correct_option.upper():
                    correct_count += 1
                    score_diff = q.marks
                    if ans:
                        ans.is_correct = True
                        ans.marks_obtained = score_diff
                else:
                    wrong_count += 1
                    score_diff = 0.0
                    if ans:
                        ans.is_correct = False
                        ans.marks_obtained = score_diff
            else:
                score_diff = 0.0
                if ans:
                    ans.is_correct = None
                    ans.marks_obtained = score_diff
                    
            total_score += score_diff
            
        max_possible_score = sum([q.marks for q in questions])
        percentage = 0.0
        if max_possible_score > 0:
            percentage = round((total_score / max_possible_score) * 100, 2)
            
        s_attempt.is_submitted = True
        s_attempt.submitted_at = datetime.datetime.utcnow()
        s_attempt.total_questions = len(questions)
        s_attempt.correct_answers = correct_count
        s_attempt.wrong_answers = wrong_count
        s_attempt.score = total_score
        s_attempt.percentage = percentage
        
        db.commit()
        db.refresh(s_attempt)
        
        entrance_perc = s_attempt.percentage
        final_perc = round((s.ug_percentage * 0.5) + (entrance_perc * 0.5), 2)
        
        res_payload = {
            "attempt_id": s_attempt.id,
            "application_number": s.application_number,
            "student_name": s.name,
            "degrees": degrees_list,
            "total_questions": s_attempt.total_questions,
            "attempted_questions": attempted_count,
            "correct_answers": s_attempt.correct_answers,
            "wrong_answers": s_attempt.wrong_answers,
            "score": s_attempt.score,
            "percentage": s_attempt.percentage,
            "ug_percentage": s.ug_percentage,
            "entrance_percentage": entrance_perc,
            "final_percentage": final_perc,
            "result_visibility": exam.result_visibility
        }
        if s.id == student.id:
            primary_result = res_payload

    if not primary_result:
        degrees_list = [d.degree for d in student.degrees]
        entrance_perc = attempt.percentage
        final_perc = round((student.ug_percentage * 0.5) + (entrance_perc * 0.5), 2)
        primary_result = {
            "attempt_id": attempt.id,
            "application_number": student.application_number,
            "student_name": student.name,
            "degrees": degrees_list,
            "total_questions": attempt.total_questions,
            "attempted_questions": attempted_count,
            "correct_answers": attempt.correct_answers,
            "wrong_answers": attempt.wrong_answers,
            "score": attempt.score,
            "percentage": attempt.percentage,
            "ug_percentage": student.ug_percentage,
            "entrance_percentage": entrance_perc,
            "final_percentage": final_perc,
            "result_visibility": exam.result_visibility
        }

    return primary_result
