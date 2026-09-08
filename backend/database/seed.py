from datetime import datetime, timedelta, timezone
import os
import sys

# Ensure backend directory is in sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Base, engine, SessionLocal
from app.models import Notification, Transaction

# Realistic seed transactions featuring real customer names and identities
SAMPLE_TRANSACTIONS = [
    {
        "payment_id": "pay_rec_001",
        "customer_id": "cust_101",
        "customer_name": "Sam",
        "customer_email": "sam@gmail.com",
        "customer_phone": "9876543210",
        "order_id": "ord_aura_1001",
        "amount": 49900,  # ₹499
        "currency": "INR",
        "status": "captured",
        "failure_reason": None,
        "retry_count": 0,
        "recovery_status": "not_required",
        "days_ago": 1,
    },
    {
        "payment_id": "pay_aura_seed_001",
        "customer_id": "cust_sam_01",
        "customer_name": "Sam",
        "customer_email": "sam@gmail.com",
        "customer_phone": "9876543210",
        "order_id": "ord_aura_1001",
        "amount": 299900,  # ₹2,999
        "currency": "INR",
        "status": "failed",
        "failure_reason": "bank_server_down",
        "retry_count": 1,
        "recovery_status": "executed",
        "days_ago": 1,
    },
    {
        "payment_id": "pay_aura_seed_002",
        "customer_id": "cust_ram_02",
        "customer_name": "Ram",
        "customer_email": "ram.kumar@example.com",
        "customer_phone": "9812345678",
        "order_id": "ord_aura_1002",
        "amount": 149900,  # ₹1,499
        "currency": "INR",
        "status": "captured",
        "failure_reason": None,
        "retry_count": 0,
        "recovery_status": "not_required",
        "days_ago": 2,
    },
    {
        "payment_id": "pay_aura_seed_003",
        "customer_id": "cust_ayush_03",
        "customer_name": "Ayush",
        "customer_email": "ayush.verma@example.com",
        "customer_phone": "9988776655",
        "order_id": "ord_aura_1003",
        "amount": 499900,  # ₹4,999
        "currency": "INR",
        "status": "failed",
        "failure_reason": "bank_server_down",
        "retry_count": 0,
        "recovery_status": "pending",
        "days_ago": 2,
    },
    {
        "payment_id": "pay_aura_seed_004",
        "customer_id": "cust_priya_04",
        "customer_name": "Priya",
        "customer_email": "priya.singh@example.com",
        "customer_phone": "9765432109",
        "order_id": "ord_aura_1004",
        "amount": 79900,  # ₹799
        "currency": "INR",
        "status": "failed",
        "failure_reason": "card_expired",
        "retry_count": 1,
        "recovery_status": "pending",
        "days_ago": 3,
    },
    {
        "payment_id": "pay_aura_seed_005",
        "customer_id": "cust_rahul_05",
        "customer_name": "Rahul",
        "customer_email": "rahul.sharma@example.com",
        "customer_phone": "9876123456",
        "order_id": "ord_aura_1005",
        "amount": 189900,  # ₹1,899
        "currency": "INR",
        "status": "failed",
        "failure_reason": "customer_cancelled",
        "retry_count": 0,
        "recovery_status": "human_review",
        "days_ago": 3,
    },
    {
        "payment_id": "pay_aura_seed_006",
        "customer_id": "cust_ananya_06",
        "customer_name": "Ananya",
        "customer_email": "ananya.roy@example.com",
        "customer_phone": "9123456789",
        "order_id": "ord_aura_1006",
        "amount": 349900,  # ₹3,499
        "currency": "INR",
        "status": "captured",
        "failure_reason": None,
        "retry_count": 0,
        "recovery_status": "not_required",
        "days_ago": 4,
    },
    {
        "payment_id": "pay_aura_seed_007",
        "customer_id": "cust_arjun_07",
        "customer_name": "Arjun",
        "customer_email": "arjun.kapoor@example.com",
        "customer_phone": "9811223344",
        "order_id": "ord_aura_1007",
        "amount": 129900,  # ₹1,299
        "currency": "INR",
        "status": "failed",
        "failure_reason": "insufficient_funds",
        "retry_count": 1,
        "recovery_status": "pending",
        "days_ago": 4,
    },
    {
        "payment_id": "pay_aura_seed_008",
        "customer_id": "cust_neha_08",
        "customer_name": "Neha",
        "customer_email": "neha.gupta@example.com",
        "customer_phone": "9711223344",
        "order_id": "ord_aura_1008",
        "amount": 899900,  # ₹8,999
        "currency": "INR",
        "status": "failed",
        "failure_reason": "authentication_failed",
        "retry_count": 3,
        "recovery_status": "human_review",
        "days_ago": 5,
    },
    {
        "payment_id": "pay_aura_seed_009",
        "customer_id": "cust_pooja_09",
        "customer_name": "Pooja",
        "customer_email": "pooja.mehta@example.com",
        "customer_phone": "9611223344",
        "order_id": "ord_aura_1009",
        "amount": 219900,  # ₹2,199
        "currency": "INR",
        "status": "captured",
        "failure_reason": None,
        "retry_count": 0,
        "recovery_status": "not_required",
        "days_ago": 5,
    },
    {
        "payment_id": "pay_aura_seed_010",
        "customer_id": "cust_vikram_10",
        "customer_name": "Vikram",
        "customer_email": "vikram.rathore@example.com",
        "customer_phone": "9511223344",
        "order_id": "ord_aura_1010",
        "amount": 399900,  # ₹3,999
        "currency": "INR",
        "status": "failed",
        "failure_reason": "recurring_mandate_failed",
        "retry_count": 1,
        "recovery_status": "executed",
        "days_ago": 6,
    },
    {
        "payment_id": "pay_aura_seed_011",
        "customer_id": "cust_sam_01",
        "customer_name": "Sam",
        "customer_email": "sam@gmail.com",
        "customer_phone": "9876543210",
        "order_id": "ord_aura_1011",
        "amount": 199900,  # ₹1,999
        "currency": "INR",
        "status": "captured",
        "failure_reason": None,
        "retry_count": 0,
        "recovery_status": "not_required",
        "days_ago": 6,
    },
    {
        "payment_id": "pay_aura_seed_012",
        "customer_id": "cust_priya_04",
        "customer_name": "Priya",
        "customer_email": "priya.singh@example.com",
        "customer_phone": "9765432109",
        "order_id": "ord_aura_1012",
        "amount": 249900,  # ₹2,499
        "currency": "INR",
        "status": "failed",
        "failure_reason": "network_timeout",
        "retry_count": 0,
        "recovery_status": "executed",
        "days_ago": 7,
    },
]


def seed_database():
    """Initializes database tables and seeds realistic demo transactions."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        inserted_tx = 0

        for item in SAMPLE_TRANSACTIONS:
            existing = (
                db.query(Transaction)
                .filter(Transaction.payment_id == item["payment_id"])
                .first()
            )
            created_at = now - timedelta(days=item["days_ago"])

            if not existing:
                tx = Transaction(
                    payment_id=item["payment_id"],
                    customer_id=item["customer_id"],
                    customer_name=item["customer_name"],
                    customer_email=item["customer_email"],
                    customer_phone=item["customer_phone"],
                    order_id=item["order_id"],
                    amount=item["amount"],
                    currency=item["currency"],
                    status=item["status"],
                    failure_reason=item["failure_reason"],
                    retry_count=item["retry_count"],
                    recovery_status=item["recovery_status"],
                    created_at=created_at,
                )
                db.add(tx)
                inserted_tx += 1

                # Seed corresponding Merchant Notification
                if item["status"] == "failed":
                    notif_title = f"Failed Payment: {item['customer_name']}"
                    notif_severity = "error" if item["recovery_status"] == "pending" else "success" if item["recovery_status"] == "executed" else "warning"
                    notif_msg = f"{item['customer_name']}'s payment '{item['payment_id']}' failed ({item['failure_reason']}). Recovery status: {item['recovery_status']}."

                    notif = Notification(
                        recipient_type="merchant",
                        payment_id=item["payment_id"],
                        order_id=item["order_id"],
                        notification_type="payment_failed",
                        title=notif_title,
                        message=notif_msg,
                        severity=notif_severity,
                        is_read=0,
                        created_at=created_at,
                    )
                    db.add(notif)

        db.commit()
        print(f"Seed completed: {inserted_tx} new transactions inserted.")
    except Exception as e:
        db.rollback()
        print(f"Seed error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
