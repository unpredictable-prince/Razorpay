import os
import sys
import re
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

# Ensure backend directory is in sys.path for app module imports
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)


def normalize_database_url(url: str | None) -> str:
    """
    Normalizes PostgreSQL / Supabase URLs for SQLAlchemy with the pure-Python pg8000 driver.
    Preserves SQLite URLs and handles URL prefix variations.
    """
    if not url:
        return ""
    
    url = url.strip()
    
    # Handle standard postgres schemes
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+pg8000://", 1)
    elif url.startswith("postgresql://") and not ("+pg8000" in url or "+psycopg2" in url or "+asyncpg" in url):
        url = url.replace("postgresql://", "postgresql+pg8000://", 1)
    
    # Clean up any sslmode params for pg8000 if present
    if "postgresql+pg8000" in url and "sslmode=" in url:
        # pg8000 handles SSL context natively; normalize sslmode query param to prevent dialect parsing error
        url = re.sub(r"[?&]sslmode=[^&]*", "", url)
        # Fix any dangling ? or trailing &
        if url.endswith("?") or url.endswith("&"):
            url = url[:-1]
            
    return url


# Resolve database URL from environment
raw_db_url = (
    os.environ.get("DATABASE_URL")
    or os.environ.get("SUPABASE_DB_URL")
    or os.environ.get("SUPABASE_DATABASE_URL")
    or os.environ.get("POSTGRES_URL")
    or os.environ.get("POSTGRESQL_URL")
)

SQLALCHEMY_DATABASE_URL = normalize_database_url(raw_db_url)

if SQLALCHEMY_DATABASE_URL and not SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    # Production PostgreSQL / Supabase connection with serverless-friendly pooling
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=5,
        max_overflow=10,
    )
    IS_POSTGRES = True
else:
    # Local development / fallback SQLite
    if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
        DB_PATH = "/tmp/recoverai.db"
    else:
        DB_PATH = os.path.join(BASE_DIR, "recoverai.db")
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
    IS_POSTGRES = False

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def check_db_connection() -> bool:
    """Safely verifies database connectivity without leaking credentials."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as err:
        print(f"Database connection check warning: {err}")
        return False


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
