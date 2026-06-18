import pymysql
from app.database import engine, Base
from sqlalchemy import text

def clear_database():
    print("Connecting to database and dropping all tables...")
    try:
        # Disable foreign key checks before dropping
        with engine.connect() as conn:
            conn.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
            conn.commit()
        
        # Drop all tables using SQLAlchemy Metadata
        Base.metadata.drop_all(bind=engine)
        
        # Re-enable foreign key checks
        with engine.connect() as conn:
            conn.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
            conn.commit()
            
        print("Database cleared successfully! All tables dropped.")
    except Exception as e:
        print(f"Error clearing database: {e}")

if __name__ == "__main__":
    clear_database()
