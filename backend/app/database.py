import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Ensure backend directory is in sys.path for app module imports
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# Support Cloud SQL / PostgreSQL / Supabase / Neon or SQLite fallback
db_url = os.environ.get("DATABASE_URL") or os.environ.get("POSTGRES_URL") or os.environ.get("POSTGRESQL_URL")

if db_url:
    # Fix standard postgresql scheme for SQLAlchemy
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    SQLALCHEMY_DATABASE_URL = db_url
    engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True, pool_recycle=300)
else:
    if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
        DB_PATH = "/tmp/recoverai.db"
    else:
        DB_PATH = os.path.join(BASE_DIR, "recoverai.db")
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def init_db():
    """Initializes the database and ensures tables & seed data exist."""
    import app.models  # noqa: F401
    Base.metadata.create_all(bind=engine)

    # Automatic self-seeding on cold starts if empty
    try:
        db = SessionLocal()
        from app.models import Transaction
        if db.query(Transaction).count() == 0:
            from database.seed import seed_database
            seed_database()
        db.close()
    except Exception as e:
        print("Notice: Auto-seed check status:", e)


def get_db():
    """Dependency for providing a database session to API routes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
