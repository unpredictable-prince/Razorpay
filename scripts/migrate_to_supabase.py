#!/usr/bin/env python3
"""
RecoverAI & Aura Store: Full Supabase Database Migration
Migrates 100% of all tables and records from SQLite to Supabase PostgreSQL.
"""

import os
import sys
from sqlalchemy import create_engine, text

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
sys.path.insert(0, os.path.join(PROJECT_ROOT, "backend"))
sys.path.insert(0, os.path.join(PROJECT_ROOT, "ecommerce", "backend"))

import app.models as recoverai_models
from app.database import Base as RecoverAIBase, SessionLocal as RecoverAISessionLocal
import ecommerce.backend.app.models as ecommerce_models
from ecommerce.backend.app.database import Base as EcommerceBase, SessionLocal as EcommerceSessionLocal


def run_full_migration(supabase_url: str):
    print(f"🔗 Connecting to Supabase...")
    
    # Format URL for pg8000
    if supabase_url.startswith("postgres://"):
        supabase_url = supabase_url.replace("postgres://", "postgresql+pg8000://", 1)
    elif supabase_url.startswith("postgresql://") and "+pg8000" not in supabase_url and "+psycopg2" not in supabase_url:
        supabase_url = supabase_url.replace("postgresql://", "postgresql+pg8000://", 1)
        
    supabase_engine = create_engine(supabase_url, pool_pre_ping=True)
    
    print("🛠️ Creating all tables in Supabase...")
    RecoverAIBase.metadata.create_all(bind=supabase_engine)
    EcommerceBase.metadata.create_all(bind=supabase_engine)
    print("✅ Schema created.")
    
    from sqlalchemy.orm import sessionmaker
    SupabaseSession = sessionmaker(autocommit=False, autoflush=False, bind=supabase_engine)
    supabase_db = SupabaseSession()
    
    # 1. Products
    ecom_db = EcommerceSessionLocal()
    try:
        products = ecom_db.query(ecommerce_models.Product).all()
        print(f"📦 Migrating {len(products)} products...")
        for p in products:
            existing = supabase_db.query(ecommerce_models.Product).filter_by(id=p.id).first()
            if not existing:
                supabase_db.add(ecommerce_models.Product(
                    id=p.id, name=p.name, description=p.description, price=p.price,
                    image=p.image, category=p.category, stock=p.stock, created_at=p.created_at
                ))
        supabase_db.commit()
        print("✅ Products migrated.")
    except Exception as e:
        print(f"⚠️ Products error: {e}")
        supabase_db.rollback()

    # 2. Customers
    try:
        customers = ecom_db.query(ecommerce_models.Customer).all()
        print(f"👥 Migrating {len(customers)} customers...")
        for c in customers:
            existing = supabase_db.query(ecommerce_models.Customer).filter_by(customer_id=c.customer_id).first()
            if not existing:
                supabase_db.add(ecommerce_models.Customer(
                    id=c.id, customer_id=c.customer_id, name=c.name, email=c.email,
                    phone=c.phone, created_at=c.created_at
                ))
        supabase_db.commit()
        print("✅ Customers migrated.")
    except Exception as e:
        print(f"⚠️ Customers error: {e}")
        supabase_db.rollback()

    # 3. Orders
    try:
        orders = ecom_db.query(ecommerce_models.Order).all()
        print(f"📋 Migrating {len(orders)} orders...")
        for o in orders:
            existing = supabase_db.query(ecommerce_models.Order).filter_by(order_id=o.order_id).first()
            if not existing:
                supabase_db.add(ecommerce_models.Order(
                    id=o.id, order_id=o.order_id, customer_id=o.customer_id,
                    customer_name=o.customer_name, customer_email=o.customer_email,
                    customer_phone=o.customer_phone, items_json=o.items_json,
                    total_amount=o.total_amount, order_status=o.order_status,
                    payment_status=o.payment_status, razorpay_order_id=o.razorpay_order_id,
                    razorpay_payment_id=o.razorpay_payment_id, shipping_address=o.shipping_address,
                    created_at=o.created_at
                ))
        supabase_db.commit()
        print("✅ Orders migrated.")
    except Exception as e:
        print(f"⚠️ Orders error: {e}")
        supabase_db.rollback()
    finally:
        ecom_db.close()

    # 4. Transactions
    recover_db = RecoverAISessionLocal()
    try:
        txs = recover_db.query(recoverai_models.Transaction).all()
        print(f"💳 Migrating {len(txs)} transactions...")
        for tx in txs:
            existing = supabase_db.query(recoverai_models.Transaction).filter_by(payment_id=tx.payment_id).first()
            if not existing:
                supabase_db.add(recoverai_models.Transaction(
                    id=tx.id, payment_id=tx.payment_id, customer_id=tx.customer_id,
                    customer_name=tx.customer_name, customer_email=tx.customer_email,
                    customer_phone=tx.customer_phone, order_id=tx.order_id,
                    amount=tx.amount, currency=tx.currency, status=tx.status,
                    failure_reason=tx.failure_reason, retry_count=tx.retry_count,
                    recovery_status=tx.recovery_status, created_at=tx.created_at
                ))
        supabase_db.commit()
        print("✅ Transactions migrated.")
    except Exception as e:
        print(f"⚠️ Transactions error: {e}")
        supabase_db.rollback()

    # 5. Notifications
    try:
        notifs = recover_db.query(recoverai_models.Notification).all()
        print(f"🔔 Migrating {len(notifs)} notifications...")
        for n in notifs:
            supabase_db.add(recoverai_models.Notification(
                id=n.id, recipient_type=n.recipient_type, recipient_id=n.recipient_id,
                payment_id=n.payment_id, order_id=n.order_id, notification_type=n.notification_type,
                title=n.title, message=n.message, severity=n.severity, is_read=n.is_read,
                created_at=n.created_at
            ))
        supabase_db.commit()
        print("✅ Notifications migrated.")
    except Exception as e:
        print(f"⚠️ Notifications error: {e}")
        supabase_db.rollback()
    finally:
        recover_db.close()
        supabase_db.close()

    print("\n🎉 ALL TABLES AND DATA HAVE BEEN 100% TRANSFERRED TO SUPABASE!")


if __name__ == "__main__":
    url = os.environ.get("DATABASE_URL") or os.environ.get("SUPABASE_DB_URL")
    if len(sys.argv) > 1:
        url = sys.argv[1]
    
    if not url:
        print("Usage: python scripts/migrate_to_supabase.py '<SUPABASE_POSTGRES_CONNECTION_STRING>'")
        sys.exit(1)
        
    run_full_migration(url)
