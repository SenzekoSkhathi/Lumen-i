# create_admin.py

from datetime import datetime, timezone
from sqlmodel import SQLModel, create_engine, Session, select
from models import User
from security import hash_password

engine = create_engine(
    "sqlite:///./lumeni.db",
    connect_args={"check_same_thread": False}
)

ADMIN_EMAIL = "skhathiadmin@gmail.com"
ADMIN_PASSWORD = "admin129"
ADMIN_FULL_NAME = "Senzeko Nduli"

def create_admin_user():
    print("Attempting to create/update admin user...")

    # Create tables if they don't exist
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        # Check if admin exists
        existing = session.exec(
            select(User).where(User.email == ADMIN_EMAIL)
        ).first()

        hashed = hash_password(ADMIN_PASSWORD)
        now_utc = datetime.now(timezone.utc)

        if existing:
            print(f"Admin '{ADMIN_EMAIL}' already exists.")
            print("👉 Updating password to ensure you can login...")
            
            existing.hashed_password = hashed
            existing.last_login = now_utc
            existing.full_name = ADMIN_FULL_NAME
            existing.role = "admin"
            
            session.add(existing)
            session.commit()
            print("✅ Admin updated successfully!")
            return

        # If not exists, create new
        new_admin = User(
            email=ADMIN_EMAIL,
            full_name=ADMIN_FULL_NAME,
            role="admin",
            hashed_password=hashed,
            last_login=now_utc
        )

        session.add(new_admin)
        session.commit()

        print("✅ Admin created successfully!")

if __name__ == "__main__":
    create_admin_user()