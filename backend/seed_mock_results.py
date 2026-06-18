import datetime
import random
from app.database import SessionLocal
from app.models import Exam, Question, Student, StudentDegree, ExamAttempt

# Mock names for Tamil Nadu context
MOCK_NAMES = [
    "Anbarasan K", "Bhuvaneshwari M", "Chithra S", "Dinesh Kumar R", "Elangovan P",
    "Ganesan A", "Hariharan V", "Indhumathi T", "Jeeva N", "Karthikeyan S",
    "Lavanya G", "Manikandan R", "Nandhini P", "Pradeep Kumar S", "Rajeshwari M",
    "Santhosh Kumar K", "Thangavel P", "Usha Rani R", "Vignesh A", "Yuvashree S"
]

COMMUNITIES = ["BC", "MBC", "SC", "ST"]
DEGREES_LIST = ["MCA", "MSC_CS", "MSC_DS"]

def seed_mock_results():
    db = SessionLocal()
    try:
        # 1. Fetch active exam
        exam = db.query(Exam).first()
        if not exam:
            print("No exam found. Please run seed_questions.py first.")
            return

        # Fetch questions count and total marks
        questions = db.query(Question).filter(Question.exam_id == exam.id).all()
        total_q = len(questions)
        if total_q == 0:
            print("No questions found in exam. Please seed questions first.")
            return

        print(f"Using Exam: {exam.name} (Total Questions: {total_q})")

        # 2. Generate 20 students
        created_count = 0
        for i, name in enumerate(MOCK_NAMES):
            app_no = f"PU2026{10000 + i}"
            email = f"student{i+1}@periyar.edu.in"
            mobile = f"98765{10000 + i:05d}"
            
            # Check if student already exists
            exist = db.query(Student).filter(Student.application_number == app_no).first()
            if exist:
                print(f"Student {app_no} already exists. Skipping.")
                continue

            # Random community
            community = random.choice(COMMUNITIES)
            # Random UG percentage
            ug_percentage = round(random.uniform(55.0, 95.0), 2)
            # Random Date of Birth (between 1998 and 2005)
            dob = datetime.date(random.randint(1998, 2005), random.randint(1, 12), random.randint(1, 28))

            # Create Student
            student = Student(
                application_number=app_no,
                name=name,
                community=community,
                email=email,
                mobile=mobile,
                ug_percentage=ug_percentage,
                date_of_birth=dob,
                registered_at=datetime.datetime.utcnow() - datetime.timedelta(hours=random.randint(1, 24))
            )
            db.add(student)
            db.flush()

            # Random degrees (can select 1 to 3 degrees)
            num_degs = random.randint(1, 3)
            selected_degs = random.sample(DEGREES_LIST, num_degs)
            for deg in selected_degs:
                db.add(StudentDegree(student_id=student.id, degree=deg))

            # Generate random score
            correct = random.randint(0, total_q)
            wrong = total_q - correct
            score = float(correct) * 1.0  # Assumes each question is 1 mark
            percentage = round((score / total_q) * 100.0, 2) if total_q > 0 else 0.0

            # Create Attempt
            attempt = ExamAttempt(
                student_id=student.id,
                exam_id=exam.id,
                started_at=student.registered_at + datetime.timedelta(minutes=5),
                submitted_at=student.registered_at + datetime.timedelta(minutes=35),
                total_questions=total_q,
                correct_answers=correct,
                wrong_answers=wrong,
                score=score,
                percentage=percentage,
                is_submitted=True,
                is_disqualified=False
            )
            db.add(attempt)
            created_count += 1

        db.commit()
        print(f"Successfully seeded {created_count} mock student records with exam attempts!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding mock results: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_mock_results()
