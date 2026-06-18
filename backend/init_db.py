import pymysql
from app.database import engine, Base, SessionLocal
from app.models import Admin
from app.auth import get_password_hash

def init_database():
    print("Checking and creating tables...")
    try:
        # Create all tables using SQLAlchemy Metadata
        Base.metadata.create_all(bind=engine)
        print("All tables checked/created successfully!")
        
        # Seed default admin credentials
        db = SessionLocal()
        try:
            admin_exists = db.query(Admin).filter(Admin.username == "admin").first()
            if not admin_exists:
                hashed_pw = get_password_hash("admin123")
                default_admin = Admin(
                    username="admin",
                    password_hash=hashed_pw,
                    name="Periyar Admin"
                )
                db.add(default_admin)
                db.commit()
                print("=========================================")
                print("Default admin credentials seeded:")
                print("Username: admin")
                print("Password: admin123")
                print("=========================================")
            else:
                print("Admin account 'admin' already exists.")
        except Exception as e:
            print(f"Error seeding admin account: {e}")
        finally:
            db.close()
            
    except Exception as e:
        print(f"Error initializing database: {e}")

if __name__ == "__main__":
    init_database()
