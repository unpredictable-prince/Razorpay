import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Ensure ecommerce backend directory is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# Support Cloud SQL / PostgreSQL / Supabase / Neon or SQLite fallback
db_url = os.environ.get("ECOMMERCE_DATABASE_URL") or os.environ.get("DATABASE_URL") or os.environ.get("POSTGRES_URL")

if db_url and not db_url.startswith("sqlite"):
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    SQLALCHEMY_DATABASE_URL = db_url
    engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True, pool_recycle=300)
else:
    if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
        DB_PATH = "/tmp/ecommerce.db"
    else:
        DB_PATH = os.path.join(BASE_DIR, "ecommerce.db")
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def init_ecommerce_db():
    """Initializes ecommerce database tables and seeds catalog if empty."""
    import app.models  # noqa: F401
    Base.metadata.create_all(bind=engine)

    try:
        db = SessionLocal()
        from app.models import Product
        if db.query(Product).count() == 0:
            import app.main as ecommerce_main
            ecommerce_main.seed_products()
        db.close()
    except Exception as e:
        print("Notice: Ecommerce auto-seed check status:", e)


def get_db():
    """Dependency helper to yield a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
