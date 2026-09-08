#!/usr/bin/env python3
"""
RecoverAI & Aura Store: Production Database Initializer & Idempotent Seeder
Safe for Supabase PostgreSQL and local SQLite.
Creates missing tables and ensures essential seed data is populated without duplicates.
"""

import os
import sys
import json
from datetime import datetime, timedelta, timezone
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Setup system paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.app.database import Base as RecoverAIBase, normalize_database_url
from backend.app.models import Transaction, Notification
from ecommerce.backend.app.database import Base as EcommerceBase
from ecommerce.backend.app.models import Product, Customer, Order, CustomerNotification

# 10 Featured Catalog Products
CATALOG_PRODUCTS = [
    {
        "id": 1,
        "name": "Aura Wireless Noise-Canceling Headphones",
        "description": "Premium over-ear wireless headphones featuring active noise cancellation, 30-hour battery life, and crystal-clear acoustic drivers.",
        "price": 499900,
        "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
        "category": "Audio",
        "stock": 45,
    },
    {
        "id": 2,
        "name": "Pulse Ultra Smartwatch Series 7",
        "description": "Advanced fitness smartwatch with AMOLED display, continuous heart rate monitor, SPO2 sensor, and IP68 water resistance.",
        "price": 899900,
        "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
        "category": "Wearables",
        "stock": 30,
    },
    {
        "id": 3,
        "name": "ErgoLift Ergonomic Wireless Mouse",
        "description": "Precision vertical ergonomic mouse engineered to reduce wrist strain with custom programmable buttons and dual Bluetooth connection.",
        "price": 149900,
        "image": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&q=80",
        "category": "Accessories",
        "stock": 60,
    },
    {
        "id": 4,
        "name": "Nomad Commuter Waterproof Backpack",
        "description": "Sleek 25L weather-resistant travel backpack with padded 16-inch laptop compartment and integrated USB charging port.",
        "price": 329900,
        "image": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
        "category": "Lifestyle",
        "stock": 25,
    },
    {
        "id": 5,
        "name": "VoltBoost 3-in-1 Fast Wireless Charger",
        "description": "Foldable magnetic wireless charging station for smartphone, smartwatch, and wireless earbuds simultaneously.",
        "price": 219900,
        "image": "https://images.unsplash.com/photo-1622445268465-843816584283?w=800&q=80",
        "category": "Power",
        "stock": 50,
    },
    {
        "id": 6,
        "name": "Lumina RGB Mechanical Keyboard",
        "description": "Tactile hot-swappable mechanical keyboard with customizable RGB backlighting, aluminum frame, and PBT keycaps.",
        "price": 549900,
        "image": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80",
        "category": "Gaming",
        "stock": 20,
    },
    {
        "id": 7,
        "name": "SoundBar Pro Studio Speaker",
        "description": "Compact desktop SoundBar delivering deep bass, room-filling sound, and seamless AUX / Bluetooth 5.3 connectivity.",
        "price": 679900,
        "image": "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80",
        "category": "Audio",
        "stock": 15,
    },
    {
        "id": 8,
        "name": "VisionHD 4K USB-C Webcam",
        "description": "Ultra-HD 4K streaming webcam with auto-focus, dual noise-canceling microphones, and privacy shutter.",
        "price": 399900,
        "image": "https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?w=800&q=80",
        "category": "Tech",
        "stock": 35,
    },
    {
        "id": 9,
        "name": "ThermoSmart Insulated Smart Bottle",
        "description": "Double-wall vacuum insulated stainless steel water bottle featuring real-time LED temperature display.",
        "price": 129900,
        "image": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80",
        "category": "Lifestyle",
        "stock": 40,
    },
    {
        "id": 10,
        "name": "Apex Precision Gaming Desk Pad",
        "description": "Extra-large desk mat (900x400mm) with stitched edges, anti-slip rubber base, and micro-textured cloth surface.",
        "price": 79900,
        "image": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
        "category": "Accessories",
        "stock": 80,
    },
]

# Baseline seed transactions
BASELINE_TRANSACTIONS = [
    {
        "payment_id": "pay_rec_001",
        "customer_id": "cust_sam_01",
        "customer_name": "Sam",
        "customer_email": "sam@gmail.com",
        "customer_phone": "9876543210",
        "order_id": "ord_aura_1001",
        "amount": 299900,
        "currency": "INR",
        "status": "failed",
        "failure_reason": "bank_server_down",
        "retry_count": 1,
        "recovery_status": "executed",
        "days_ago": 1,
    },
    {
        "payment_id": "pay_rec_002",
        "customer_id": "cust_ram_02",
        "customer_name": "Ram Kumar",
        "customer_email": "ram.kumar@example.com",
        "customer_phone": "9812345678",
        "order_id": "ord_aura_1002",
        "amount": 149900,
        "currency": "INR",
        "status": "captured",
        "failure_reason": None,
        "retry_count": 0,
        "recovery_status": "not_required",
        "days_ago": 2,
    },
    {
        "payment_id": "pay_rec_003",
        "customer_id": "cust_priya_04",
        "customer_name": "Priya Singh",
        "customer_email": "priya.singh@example.com",
        "customer_phone": "9765432109",
        "order_id": "ord_aura_1004",
        "amount": 79900,
        "currency": "INR",
        "status": "failed",
        "failure_reason": "card_expired",
        "retry_count": 1,
        "recovery_status": "pending",
        "days_ago": 3,
    },
    {
        "payment_id": "pay_rec_004",
        "customer_id": "cust_rahul_05",
        "customer_name": "Rahul Sharma",
        "customer_email": "rahul.sharma@example.com",
        "customer_phone": "9876123456",
        "order_id": "ord_aura_1005",
        "amount": 189900,
        "currency": "INR",
        "status": "failed",
        "failure_reason": "customer_cancelled",
        "retry_count": 0,
        "recovery_status": "human_review",
        "days_ago": 3,
    },
    {
        "payment_id": "pay_rec_005",
        "customer_id": "cust_ayush_03",
        "customer_name": "Ayush Verma",
        "customer_email": "ayush.verma@example.com",
        "customer_phone": "9988776655",
        "order_id": "ord_aura_1003",
        "amount": 499900,
        "currency": "INR",
        "status": "captured",
        "failure_reason": None,
        "retry_count": 0,
        "recovery_status": "not_required",
        "days_ago": 4,
    },
]


def init_database(db_url: str = None):
    raw_url = (
        db_url
        or os.environ.get("DATABASE_URL")
        or os.environ.get("SUPABASE_DB_URL")
        or os.environ.get("SUPABASE_DATABASE_URL")
        or os.environ.get("POSTGRES_URL")
    )

    url = normalize_database_url(raw_url)
    if not url:
        # Default local SQLite
        db_path = os.path.join(PROJECT_ROOT, "backend", "recoverai.db")
        url = f"sqlite:///{db_path}"

    is_postgres = not url.startswith("sqlite")
    print(f"🚀 Initializing Database ({'Supabase/PostgreSQL' if is_postgres else 'SQLite'})...")

    if is_postgres:
        engine = create_engine(url, pool_pre_ping=True, pool_recycle=300)
    else:
        engine = create_engine(url, connect_args={"check_same_thread": False})

    # 1. Create missing tables safely (without dropping existing data)
    print("📋 Verifying and creating missing tables...")
    RecoverAIBase.metadata.create_all(bind=engine)
    EcommerceBase.metadata.create_all(bind=engine)
    print("✅ Tables verified successfully.")

    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = Session()

    try:
        now = datetime.now(timezone.utc)

        # 2. Idempotently Seed Products
        inserted_products = 0
        for p_data in CATALOG_PRODUCTS:
            existing = db.query(Product).filter(Product.id == p_data["id"]).first()
            if not existing:
                p = Product(
                    id=p_data["id"],
                    name=p_data["name"],
                    description=p_data["description"],
                    price=p_data["price"],
                    image=p_data["image"],
                    category=p_data["category"],
                    stock=p_data["stock"],
                    created_at=now,
                )
                db.add(p)
                inserted_products += 1
        db.commit()
        print(f"📦 Products: {inserted_products} inserted ({len(CATALOG_PRODUCTS)} total available).")

        # 3. Idempotently Seed Baseline Transactions & Notifications
        inserted_tx = 0
        inserted_notifs = 0
        for tx_data in BASELINE_TRANSACTIONS:
            existing_tx = (
                db.query(Transaction)
                .filter(Transaction.payment_id == tx_data["payment_id"])
                .first()
            )
            created_at = now - timedelta(days=tx_data["days_ago"])

            if not existing_tx:
                tx = Transaction(
                    payment_id=tx_data["payment_id"],
                    customer_id=tx_data["customer_id"],
                    customer_name=tx_data["customer_name"],
                    customer_email=tx_data["customer_email"],
                    customer_phone=tx_data["customer_phone"],
                    order_id=tx_data["order_id"],
                    amount=tx_data["amount"],
                    currency=tx_data["currency"],
                    status=tx_data["status"],
                    failure_reason=tx_data["failure_reason"],
                    retry_count=tx_data["retry_count"],
                    recovery_status=tx_data["recovery_status"],
                    created_at=created_at,
                )
                db.add(tx)
                inserted_tx += 1

                # Seed associated Merchant Notification
                if tx_data["status"] == "failed":
                    notif = Notification(
                        recipient_type="merchant",
                        payment_id=tx_data["payment_id"],
                        order_id=tx_data["order_id"],
                        notification_type="payment_failed",
                        title=f"Payment Failed: {tx_data['customer_name']}",
                        message=f"Transaction {tx_data['payment_id']} failed ({tx_data['failure_reason']}). Recovery: {tx_data['recovery_status']}.",
                        severity="error" if tx_data["recovery_status"] == "pending" else "warning",
                        is_read=0,
                        created_at=created_at,
                    )
                    db.add(notif)
                    inserted_notifs += 1

        db.commit()
        print(f"💳 Transactions: {inserted_tx} inserted.")
        print(f"🔔 Notifications: {inserted_notifs} inserted.")

        # 4. If PostgreSQL, align sequence counters safely
        if is_postgres:
            try:
                db.execute(text("SELECT setval('products_id_seq', COALESCE((SELECT MAX(id) FROM products), 1));"))
                db.execute(text("SELECT setval('transactions_id_seq', COALESCE((SELECT MAX(id) FROM transactions), 1));"))
                db.commit()
            except Exception as seq_err:
                print(f"Notice: PostgreSQL sequence sync status: {seq_err}")

        print("\n🎉 Database initialization completed successfully and safely!")

    except Exception as err:
        db.rollback()
        print(f"❌ Error during database initialization: {err}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    cli_url = sys.argv[1] if len(sys.argv) > 1 else None
    init_database(cli_url)
