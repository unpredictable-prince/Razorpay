import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Ensure backend directory is in sys.path for app module imports
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# SQLite database URL (creates recoverai.db in /tmp on Vercel or in backend dir locally)
if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
    DB_PATH = "/tmp/recoverai.db"
else:
    DB_PATH = os.path.join(BASE_DIR, "recoverai.db")

SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

# engine setup with check_same_thread=False for SQLite compatibility with FastAPI
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def init_db():
    """Initializes the database by creating all tables defined by SQLAlchemy models."""
    import app.models  # noqa: F401

    Base.metadata.create_all(bind=engine)


def get_db():
    """Dependency for providing a database session to API routes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
