# seed_demo_users.py

from datetime import datetime, timezone
from typing import Iterable

from sqlmodel import SQLModel, Session, select

from database import engine
from models import User
from security import hash_password


DEMO_USERS = [
    {
        "email": "student.demo@lumeni.local",
        "full_name": "Student Demo",
        "role": "student",
        "password": "student123",
        "institution_id": None,
    },
    {
        "email": "lecturer.demo@lumeni.local",
        "full_name": "Lecturer Demo",
        "role": "lecturer",
        "password": "lecturer123",
        "institution_id": None,
    },
    {
        "email": "admin.demo@lumeni.local",
        "full_name": "Admin Demo",
        "role": "admin",
        "password": "admin123",
        "institution_id": None,
    },
]


def upsert_user(session: Session, payload: dict) -> None:
    existing = session.exec(
        select(User).where(User.email == payload["email"])
    ).first()

    hashed = hash_password(payload["password"])
    now_utc = datetime.now(timezone.utc)

    if existing:
        existing.full_name = payload["full_name"]
        existing.role = payload["role"]
        existing.hashed_password = hashed
        existing.last_login = now_utc
        existing.institution_id = payload.get("institution_id")
        session.add(existing)
        return

    new_user = User(
        email=payload["email"],
        full_name=payload["full_name"],
        role=payload["role"],
        hashed_password=hashed,
        last_login=now_utc,
        institution_id=payload.get("institution_id"),
    )
    session.add(new_user)


def seed_demo_users(users: Iterable[dict]) -> None:
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        for payload in users:
            upsert_user(session, payload)
        session.commit()


if __name__ == "__main__":
    seed_demo_users(DEMO_USERS)
    print("Demo users ready:")
    for payload in DEMO_USERS:
        print(f"- {payload['role']}: {payload['email']} / {payload['password']}")
