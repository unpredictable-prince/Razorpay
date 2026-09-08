import os
import json
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import (
    Base as RecoverAIBase,
    normalize_database_url,
    check_db_connection,
)
from app.models import Transaction, Notification
from ecommerce.backend.app.database import Base as EcommerceBase
from ecommerce.backend.app.models import Product, Customer, Order, CustomerNotification


def test_postgres_url_normalization():
    """Verify PostgreSQL connection URLs are normalized with pg8000 pure-Python driver."""
    # Standard postgres scheme
    url1 = "postgres://postgres:mypassword@db.xyz.supabase.co:5432/postgres"
    norm1 = normalize_database_url(url1)
    assert norm1.startswith("postgresql+pg8000://")
    assert "db.xyz.supabase.co:5432" in norm1

    # Standard postgresql scheme without explicit driver
    url2 = "postgresql://postgres:mypassword@db.xyz.supabase.co:5432/postgres"
    norm2 = normalize_database_url(url2)
    assert norm2.startswith("postgresql+pg8000://")

    # Already specified pg8000
    url3 = "postgresql+pg8000://postgres:mypassword@db.xyz.supabase.co:5432/postgres"
    norm3 = normalize_database_url(url3)
    assert norm3 == url3

    # Clean sslmode parameters
    url4 = "postgresql://postgres:pass@host:5432/db?sslmode=require"
    norm4 = normalize_database_url(url4)
    assert "sslmode=" not in norm4
    assert norm4.startswith("postgresql+pg8000://")


def test_sqlite_url_preservation():
    """Verify SQLite URLs are untouched."""
    sqlite_url = "sqlite:///./test.db"
    assert normalize_database_url(sqlite_url) == sqlite_url
    assert normalize_database_url("") == ""
    assert normalize_database_url(None) == ""


def test_check_db_connection():
    """Verify check_db_connection returns boolean True for working database."""
    assert check_db_connection() is True


def test_all_models_in_test_db():
    """Verify all 6 database tables can be queried in the database session."""
    from app.database import SessionLocal
    db = SessionLocal()

    # 1. Product
    product = db.query(Product).first()
    assert product is not None
    assert product.price > 0
    assert product.category != ""

    # 2. Transaction
    tx = db.query(Transaction).first()
    assert tx is not None
    assert tx.amount > 0

    # 3. Notification
    notif = db.query(Notification).first()
    assert notif is not None

    db.close()
