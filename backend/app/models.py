import datetime
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(150), nullable=False)

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    application_number = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    community = Column(String(100), nullable=False)
    email = Column(String(150), nullable=False)
    mobile = Column(String(20), nullable=False)
    ug_percentage = Column(Float, nullable=False)
    registered_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    degrees = relationship("StudentDegree", back_populates="student", cascade="all, delete-orphan")
    attempts = relationship("ExamAttempt", back_populates="student", cascade="all, delete-orphan")

class StudentDegree(Base):
    __tablename__ = "student_degrees"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    degree = Column(String(50), nullable=False)  # MCA, MSC_CS, MSC_DS

    student = relationship("Student", back_populates="degrees")

class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    total_questions = Column(Integer, default=30)
    duration_minutes = Column(Integer, default=30)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    result_visibility = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    questions = relationship("Question", back_populates="exam", cascade="all, delete-orphan")
    attempts = relationship("ExamAttempt", back_populates="exam", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    question_text = Column(Text, nullable=False)
    option_a = Column(String(255), nullable=False)
    option_b = Column(String(255), nullable=False)
    option_c = Column(String(255), nullable=False)
    option_d = Column(String(255), nullable=False)
    correct_option = Column(String(10), nullable=False)  # A, B, C, D
    marks = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    exam = relationship("Exam", back_populates="questions")
    answers = relationship("StudentAnswer", back_populates="question", cascade="all, delete-orphan")

class ExamAttempt(Base):
    __tablename__ = "exam_attempts"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    exam_id = Column(Integer, ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    submitted_at = Column(DateTime, nullable=True)
    total_questions = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    wrong_answers = Column(Integer, default=0)
    score = Column(Float, default=0.0)
    percentage = Column(Float, default=0.0)
    is_submitted = Column(Boolean, default=False)
    is_disqualified = Column(Boolean, default=False, server_default="0")

    student = relationship("Student", back_populates="attempts")
    exam = relationship("Exam", back_populates="attempts")
    answers = relationship("StudentAnswer", back_populates="attempt", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint('student_id', 'exam_id', name='_student_exam_attempt_uc'),
    )

class StudentAnswer(Base):
    __tablename__ = "student_answers"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("exam_attempts.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    selected_option = Column(String(10), nullable=True)  # A, B, C, D, or None
    is_correct = Column(Boolean, nullable=True)
    marks_obtained = Column(Float, default=0.0)

    attempt = relationship("ExamAttempt", back_populates="answers")
    question = relationship("Question", back_populates="answers")

    __table_args__ = (
        UniqueConstraint('attempt_id', 'question_id', name='_attempt_question_uc'),
    )
