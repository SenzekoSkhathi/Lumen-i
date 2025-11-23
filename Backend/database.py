# database.py

import os
from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy import event

# Default local SQLite database
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./lumeni.db")

# Create SQLite engine
engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False}  # Required for FastAPI on SQLite
)

# Enable SQLite foreign key support
@event.listens_for(engine, "connect")
def enable_sqlite_fk(dbapi_conn, conn_record):
    dbapi_conn.execute("PRAGMA foreign_keys=ON")


def create_db_and_tables():
    print("Creating SQLite DB and tables...")
    SQLModel.metadata.create_all(engine)


def get_db():  # <-- THIS IS THE FIX (Renamed from get_session)
    with Session(engine) as session:
        yield session