#!/usr/bin/env python3
"""
RecoverAI & Aura Store: Supabase Migration Script
Copies all existing data from local SQLite databases directly into Supabase PostgreSQL.
"""

import os
import sys
from decimal import Decimal
from sqlalchemy import create_engine, text

# Add backend and ecommerce backend paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
sys.path.insert(0, os.path.join(PROJECT_ROOT, "backend"))
sys.path.insert(0, os.path.join(PROJECT_ROOT, "ecommerce", "backend"))

import app.models as recoverai_models
from app.database import Base as RecoverAIBase, SessionLocal as RecoverAISessionLocal
import ecommerce.backend.app.models as ecommerce_models
from ecommerce.backend.app.database import Base as EcommerceBase, SessionLocal as EcommerceSessionLocal


def run_migration(supabase_url: str):
    print(f"🔗 Connecting to Supabase at: {supabase_url.split('@')[-1] if '@' in supabase_url else supabase_url}")
    
    # Format URL for pg8000/psycopg2
    if supabase_url.startswith("postgres://"):
        supabase_url = supabase_url.replace("postgres://", "postgresql+pg8000://", 1)
    elif supabase_url.startswith("postgresql://") and "+pg8000" not in supabase_url and "+psycopg2" not in supabase_url:
        supabase_url = supabase_url.replace("postgresql://", "postgresql+pg8000://", 1)
        
    supabase_engine = create_engine(supabase_url, pool_pre_ping=True)
    
    print("🛠️ Creating tables in Supabase...")
    RecoverAIBase.metadata.create_all(bind=supabase_engine)
    EcommerceBase.metadata.create_all(bind=supabase_engine)
    print("✅ Tables created/verified in Supabase.")
    
    from sqlalchemy.orm import sessionmaker
    SupabaseSession = sessionmaker(autocommit=False, autoflush=False, bind=supabase_engine)
    supabase_db = SupabaseSession()
    
    # 1. Migrate Products
    ecommerce_local_db = EcommerceSessionLocal()
    try:
        products = ecommerce_local_db.query(ecommerce_models.Product).all()
        print(f"📦 Migrating {len(products)} products...")
        for p in products:
            existing = supabase_db.query(ecommerce_models.Product).filter_by(id=p.id).first()
            if not existing:
                new_p = ecommerce_models.Product(
                    id=p.id,
                    name=p.name,
                    description=p.description,
                    price=p.price,
                    image=p.image,
                    category=p.category,
                    stock=p.stock
                )
                supabase_db.add(new_p)
        supabase_db.commit()
        print("✅ Products migrated successfully.")
    except Exception as e:
        print(f"⚠️ Error migrating products: {e}")
        supabase_db.rollback()
    finally:
        ecommerce_local_db.close()

    # 2. Migrate Transactions
    recoverai_local_db = RecoverAISessionLocal()
    try:
        txs = recoverai_local_db.query(recoverai_models.Transaction).all()
        print(f"💳 Migrating {len(txs)} transactions...")
        for tx in txs:
            existing = supabase_db.query(recoverai_models.Transaction).filter_by(payment_id=tx.payment_id).first()
            if not existing:
                new_tx = recoverai_models.Transaction(
                    payment_id=tx.payment_id,
                    order_id=tx.order_id,
                    amount=tx.amount,
                    currency=tx.currency,
                    status=tx.status,
                    failure_code=tx.failure_code,
                    failure_reason=tx.failure_reason,
                    action_taken=tx.action_taken,
                    recovery_attempt_count=tx.recovery_attempt_count,
                    requires_human_review=tx.requires_human_review,
                    customer_id=tx.customer_id,
                    customer_name=tx.customer_name,
                    customer_email=tx.customer_email,
                    customer_phone=tx.customer_phone,
                    created_at=tx.created_at,
                    updated_at=tx.updated_at
                )
                supabase_db.add(new_tx)
        supabase_db.commit()
        print("✅ Transactions migrated successfully.")
    except Exception as e:
        print(f"⚠️ Error migrating transactions: {e}")
        supabase_db.rollback()
    finally:
        recoverai_local_db.close()
        supabase_db.close()

    print("\n🎉 Supabase migration finished successfully!")


if __name__ == "__main__":
    url = os.environ.get("DATABASE_URL") or os.environ.get("SUPABASE_DB_URL")
    if len(sys.argv) > 1:
        url = sys.argv[1]
    
    if not url:
        print("Usage: python scripts/migrate_to_supabase.py '<SUPABASE_POSTGRES_CONNECTION_STRING>'")
        print("Or set DATABASE_URL in environment.")
        sys.exit(1)
        
    run_migration(url)
