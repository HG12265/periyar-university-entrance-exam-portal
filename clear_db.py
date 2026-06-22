import os
import sys

# Add backend folder to python search path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(current_dir, "backend")
sys.path.insert(0, backend_dir)

# Configure database credentials for host machine access (port 3307 mapped to MySQL container)
os.environ["DATABASE_HOST"] = "localhost"
os.environ["DATABASE_PORT"] = "3307"
os.environ["DATABASE_USER"] = "root"
os.environ["DATABASE_PASSWORD"] = "PeriyarDbRootPassword2026!"
os.environ["DATABASE_NAME"] = "periyar_entrance_exam"

from sqlalchemy import text
from app.database import engine, Base, SessionLocal
from app.models import Admin, Student, StudentDegree, Exam, Question, ExamAttempt, StudentAnswer
from app.auth import get_password_hash
from app.config import settings

def main():
    print("--------------------------------------------------")
    print("Clearing all tables in Periyar Entrance Database...")
    print("--------------------------------------------------")
    try:
        # 1. Clear database tables
        with engine.connect() as connection:
            # Safely disable foreign key checks for dropping tables
            connection.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
            Base.metadata.drop_all(bind=engine)
            Base.metadata.create_all(bind=engine)
            connection.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
        print("[SUCCESS] All tables dropped and recreated!")

        # 2. Seed default admin immediately
        print("Seeding admin account...")
        db = SessionLocal()
        try:
            hashed_pw = get_password_hash(settings.ADMIN_PASSWORD)
            default_admin = Admin(
                username=settings.ADMIN_USERNAME,
                password_hash=hashed_pw,
                name="Periyar Admin"
            )
            db.add(default_admin)
            db.commit()
            print("[SUCCESS] Admin account seeded successfully!")
        except Exception as seed_err:
            print(f"[ERROR] Failed to seed admin: {seed_err}")
        finally:
            db.close()

        print("\nDatabase is fully cleared and Admin account is ready! No container restarts needed.")
    except Exception as e:
        print(f"[ERROR] Clear database failed: {e}")
    print("--------------------------------------------------")

if __name__ == "__main__":
    main()
