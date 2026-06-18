from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Admin Schemas
class AdminBase(BaseModel):
    username: str
    name: str

class AdminCreate(AdminBase):
    password: str

class AdminResponse(AdminBase):
    id: int
    class Config:
        from_attributes = True

# Student Schemas
class StudentBase(BaseModel):
    application_number: str
    name: str
    community: str
    email: EmailStr
    mobile: str
    ug_percentage: float = Field(..., ge=0, le=100)
    date_of_birth: date

class StudentCreate(StudentBase):
    degrees: List[str]  # e.g., ["MCA", "MSC_CS"]

class StudentResponse(StudentBase):
    id: int
    registered_at: datetime
    degrees: List[str]
    class Config:
        from_attributes = True

# Exam Schemas
class ExamBase(BaseModel):
    name: str
    total_questions: int = Field(30, ge=1)
    duration_minutes: int = Field(30, ge=1)
    start_date: datetime
    end_date: datetime
    result_visibility: bool = True

class ExamCreate(ExamBase):
    pass

class ExamResponse(ExamBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Question Schemas
class QuestionBase(BaseModel):
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str = Field(..., pattern="^[A-Da-d]$")
    marks: float = 1.0

class QuestionCreate(QuestionBase):
    pass

class QuestionResponse(QuestionBase):
    id: int
    exam_id: int
    created_at: datetime
    class Config:
        from_attributes = True

class QuestionResponseForStudent(BaseModel):
    id: int
    exam_id: int
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    marks: float
    class Config:
        from_attributes = True

# Student Answer Schemas
class StudentAnswerSave(BaseModel):
    question_id: int
    selected_option: Optional[str] = Field(None, pattern="^[A-Da-d]$")

class StudentAnswerResponse(BaseModel):
    id: int
    attempt_id: int
    question_id: int
    selected_option: Optional[str]
    is_correct: Optional[bool]
    marks_obtained: float
    class Config:
        from_attributes = True

# Exam Attempt Schemas
class ExamAttemptStart(BaseModel):
    application_number: str
    exam_id: int

class ExamAttemptResponse(BaseModel):
    id: int
    student_id: int
    exam_id: int
    started_at: datetime
    submitted_at: Optional[datetime]
    total_questions: int
    correct_answers: int
    wrong_answers: int
    score: float
    percentage: float
    is_submitted: bool
    class Config:
        from_attributes = True

# Detailed score representation for students upon submission (No Rank)
class ExamSubmitResultResponse(BaseModel):
    attempt_id: int
    application_number: str
    student_name: str
    degrees: List[str]
    total_questions: int
    attempted_questions: int
    correct_answers: int
    wrong_answers: int
    score: float
    percentage: float
    result_visibility: bool

# Leaderboard Schemas for Admin Dashboard (Restricted)
class LeaderboardEntry(BaseModel):
    rank: int
    application_number: str
    student_name: str
    degrees: List[str]
    community: str
    marks: float
    percentage: float
    submitted_at: Optional[datetime] = None
