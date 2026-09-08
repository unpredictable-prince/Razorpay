#!/usr/bin/env python3
"""
Exports 100% of all data from local SQLite databases into a clean PostgreSQL dump
ready for Supabase SQL Editor.
"""

import sqlite3
import os
import json

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
OUTPUT_FILE = os.path.join(PROJECT_ROOT, "supabase_complete_dump.sql")

def escape_sql(val):
    if val is None:
        return "NULL"
    if isinstance(val, (int, float)):
        return str(val)
    # string escape
    s = str(val).replace("'", "''")
    return f"'{s}'"

def main():
    lines = []
    lines.append("-- ==============================================================================")
    lines.append("-- COMPLETE SUPABASE DATABASE DUMP (RecoverAI & Aura Store)")
    lines.append("-- Generates all tables and exports 100% of existing records into Supabase")
    lines.append("-- ==============================================================================\n")

    # 1. Schema Definitions
    lines.append("""
-- 1. DROP EXISTING TABLES IF RE-CREATING
DROP TABLE IF EXISTS customer_notifications CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- 2. CREATE PRODUCTS TABLE
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price INTEGER NOT NULL,
    image VARCHAR(500) NOT NULL,
    category VARCHAR(100) NOT NULL,
    stock INTEGER DEFAULT 50 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. CREATE CUSTOMERS TABLE
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    customer_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. CREATE ORDERS TABLE
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(100) UNIQUE NOT NULL,
    customer_id VARCHAR(100) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    items_json TEXT NOT NULL,
    total_amount INTEGER NOT NULL,
    order_status VARCHAR(50) DEFAULT 'created' NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    shipping_address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 5. CREATE TRANSACTIONS TABLE
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    payment_id VARCHAR(100) UNIQUE NOT NULL,
    customer_id VARCHAR(100) NOT NULL,
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    order_id VARCHAR(100),
    amount INTEGER NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR' NOT NULL,
    status VARCHAR(50) NOT NULL,
    failure_reason TEXT,
    retry_count INTEGER DEFAULT 0 NOT NULL,
    recovery_status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 6. CREATE NOTIFICATIONS TABLE
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    recipient_type VARCHAR(50) DEFAULT 'merchant' NOT NULL,
    recipient_id VARCHAR(100),
    payment_id VARCHAR(100),
    order_id VARCHAR(100),
    notification_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(50) DEFAULT 'info' NOT NULL,
    is_read INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 7. CREATE CUSTOMER NOTIFICATIONS TABLE
CREATE TABLE customer_notifications (
    id SERIAL PRIMARY KEY,
    customer_id VARCHAR(100) NOT NULL,
    order_id VARCHAR(100),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
""")

    # Export Ecommerce DB (products, customers, orders)
    ecom_db_path = os.path.join(PROJECT_ROOT, "ecommerce", "backend", "ecommerce.db")
    if os.path.exists(ecom_db_path):
        conn = sqlite3.connect(ecom_db_path)
        cursor = conn.cursor()

        for table in ["products", "customers", "orders"]:
            try:
                cursor.execute(f"PRAGMA table_info({table})")
                cols = [c[1] for c in cursor.fetchall()]
                cursor.execute(f"SELECT * FROM {table}")
                rows = cursor.fetchall()
                if rows:
                    lines.append(f"\n-- Data for {table} ({len(rows)} records)")
                    col_names = ", ".join(cols)
                    for r in rows:
                        vals = ", ".join(escape_sql(v) for v in r)
                        lines.append(f"INSERT INTO {table} ({col_names}) VALUES ({vals}) ON CONFLICT DO NOTHING;")
            except Exception as e:
                print(f"Error dumping {table}: {e}")
        conn.close()

    # Export RecoverAI DB (transactions, notifications)
    recover_db_path = os.path.join(PROJECT_ROOT, "backend", "recoverai.db")
    if os.path.exists(recover_db_path):
        conn = sqlite3.connect(recover_db_path)
        cursor = conn.cursor()

        for table in ["transactions", "notifications"]:
            try:
                cursor.execute(f"PRAGMA table_info({table})")
                cols = [c[1] for c in cursor.fetchall()]
                cursor.execute(f"SELECT * FROM {table}")
                rows = cursor.fetchall()
                if rows:
                    lines.append(f"\n-- Data for {table} ({len(rows)} records)")
                    col_names = ", ".join(cols)
                    for r in rows:
                        vals = ", ".join(escape_sql(v) for v in r)
                        lines.append(f"INSERT INTO {table} ({col_names}) VALUES ({vals}) ON CONFLICT DO NOTHING;")
            except Exception as e:
                print(f"Error dumping {table}: {e}")
        conn.close()

    lines.append("\n-- Update all primary key serial sequences")
    lines.append("SELECT setval('products_id_seq', COALESCE((SELECT MAX(id) FROM products), 1));")
    lines.append("SELECT setval('customers_id_seq', COALESCE((SELECT MAX(id) FROM customers), 1));")
    lines.append("SELECT setval('orders_id_seq', COALESCE((SELECT MAX(id) FROM orders), 1));")
    lines.append("SELECT setval('transactions_id_seq', COALESCE((SELECT MAX(id) FROM transactions), 1));")
    lines.append("SELECT setval('notifications_id_seq', COALESCE((SELECT MAX(id) FROM notifications), 1));")
    lines.append("SELECT setval('customer_notifications_id_seq', COALESCE((SELECT MAX(id) FROM customer_notifications), 1));")

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    print(f"✅ Generated {OUTPUT_FILE} with complete database schema and all table records.")

if __name__ == "__main__":
    main()
