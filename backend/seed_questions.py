import datetime
from app.database import SessionLocal
from app.models import Exam, Question

def seed_data():
    db = SessionLocal()
    try:
        # Get or create active exam
        exam = db.query(Exam).first()
        if not exam:
            exam = Exam(
                name="Periyar University Entrance Examination 2026",
                total_questions=5,
                duration_minutes=10,
                start_date=datetime.datetime.utcnow() - datetime.timedelta(days=1),
                end_date=datetime.datetime.utcnow() + datetime.timedelta(days=15),
                result_visibility=True
            )
            db.add(exam)
            db.commit()
            db.refresh(exam)
            print("Seeded exam.")

        # Check if questions exist
        q_count = db.query(Question).filter(Question.exam_id == exam.id).count()
        if q_count == 0:
            sample_questions = [
                Question(
                    exam_id=exam.id,
                    question_text="What is the time complexity of searching in a Balanced Binary Search Tree (BST)?",
                    option_a="O(1)",
                    option_b="O(log n)",
                    option_c="O(n)",
                    option_d="O(n log n)",
                    correct_option="B",
                    marks=1.0
                ),
                Question(
                    exam_id=exam.id,
                    question_text="Which of the following sorting algorithms is stable and has a worst-case time complexity of O(n log n)?",
                    option_a="Quick Sort",
                    option_b="Heap Sort",
                    option_c="Merge Sort",
                    option_d="Selection Sort",
                    correct_option="C",
                    marks=1.0
                ),
                Question(
                    exam_id=exam.id,
                    question_text="In Python, which of the following is used to manage thread execution locks?",
                    option_a="threading.Lock()",
                    option_b="threading.Mutex()",
                    option_c="thread.wait()",
                    option_d="thread.lock()",
                    correct_option="A",
                    marks=1.0
                ),
                Question(
                    exam_id=exam.id,
                    question_text="Which SQL join returns all records when there is a match in either left or right table?",
                    option_a="LEFT JOIN",
                    option_b="RIGHT JOIN",
                    option_c="INNER JOIN",
                    option_d="FULL OUTER JOIN",
                    correct_option="D",
                    marks=1.0
                ),
                Question(
                    exam_id=exam.id,
                    question_text="What does CSS stand for in web application development?",
                    option_a="Computer Style Sheets",
                    option_b="Cascading Style Sheets",
                    option_c="Creative Style Sheets",
                    option_d="Colorful Style Sheets",
                    correct_option="B",
                    marks=1.0
                )
            ]
            db.add_all(sample_questions)
            
            # Update exam total questions count
            exam.total_questions = len(sample_questions)
            
            db.commit()
            print(f"Seeded {len(sample_questions)} sample questions successfully.")
        else:
            print(f"Questions already exist: {q_count} count.")
    except Exception as e:
        print(f"Error seeding data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
