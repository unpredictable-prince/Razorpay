import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Path for SQLite ecommerce database
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "ecommerce.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def init_ecommerce_db():
    """Initializes ecommerce database tables."""
    import app.models  # noqa: F401

    Base.metadata.create_all(bind=engine)


def get_db():
    """Dependency helper to yield a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
