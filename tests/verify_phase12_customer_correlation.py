import hashlib
import hmac
import json
import os
import sys
from fastapi.testclient import TestClient

backend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
from app.database import SessionLocal, init_db
from app.models import Notification, Transaction

client = TestClient(app)


def generate_signature(body_bytes: bytes, secret: str) -> str:
    return hmac.new(secret.encode("utf-8"), body_bytes, hashlib.sha256).hexdigest()


def run_phase_12_verification():
    print("=" * 75)
    print("  PHASE 12 — REAL CUSTOMER IDENTITY & PAYMENT CORRELATION VERIFICATION")
    print("=" * 75)

    init_db()
    secret = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "whsec_test_secret_12345")
    os.environ["RAZORPAY_WEBHOOK_SECRET"] = secret

    results = {}

    # Simulate Aura Store Order Checkout for Customer "Sam"
    print("\n[12A] Simulating Customer 'Sam' Checkout & Payment Failure Webhook...")
    payment_id = f"pay_sam_demo_{os.urandom(4).hex()}"
    customer_id = "cust_sam_001"
    order_id = "ord_aura_sam_001"

    payload = {
        "event": "payment.failed",
        "payload": {
            "payment": {
                "entity": {
                    "id": payment_id,
                    "amount": 299900,
                    "currency": "INR",
                    "status": "failed",
                    "error_reason": "bank_server_down",
                    "contact": "9876543210",
                    "email": "sam@gmail.com",
                    "notes": {
                        "order_id": order_id,
                        "customer_id": customer_id,
                        "customer_name": "Sam",
                        "customer_email": "sam@gmail.com",
                        "customer_phone": "9876543210",
                    },
                }
            }
        },
    }

    body = json.dumps(payload).encode("utf-8")
    sig = generate_signature(body, secret)

    res = client.post("/webhooks/razorpay", content=body, headers={"X-Razorpay-Signature": sig})
    if res.status_code == 200 and res.json().get("pipeline_executed") is True:
        print("  ✓ Webhook Ingested & Pipeline Executed -> PASS")
        results["webhook_ingestion"] = "PASS"
    else:
        results["webhook_ingestion"] = "FAIL"

    # Database Identity Correlation Check
    print("\n[12B] Checking SQLite Database Real Customer Identity Storage...")
    db = SessionLocal()
    try:
        tx = db.query(Transaction).filter(Transaction.payment_id == payment_id).first()
        if tx and tx.customer_name == "Sam" and tx.customer_email == "sam@gmail.com" and tx.order_id == order_id:
            print(f"  ✓ Transaction linked to Customer Name: '{tx.customer_name}', Email: '{tx.customer_email}', Order ID: '{tx.order_id}' -> PASS")
            results["db_correlation"] = "PASS"
        else:
            results["db_correlation"] = "FAIL"
    finally:
        db.close()

    # REST API Response Serialization Check
    print("\n[12C] Checking Merchant Dashboard REST API Serialization...")
    res_api = client.get(f"/transactions/{payment_id}")
    if res_api.status_code == 200 and res_api.json().get("customer_name") == "Sam":
        print(f"  ✓ REST API returns customer_name: '{res_api.json()['customer_name']}' -> PASS")
        results["api_serialization"] = "PASS"
    else:
        results["api_serialization"] = "FAIL"

    # Merchant Notification Check
    print("\n[12D] Checking Merchant Notification Customer Name Personalization...")
    db = SessionLocal()
    try:
        m_notif = db.query(Notification).filter(Notification.payment_id == payment_id, Notification.recipient_type == "merchant").first()
        if m_notif and "Sam" in m_notif.message:
            print(f"  ✓ Merchant Alert Personified: '{m_notif.message}' -> PASS")
            results["merchant_notification"] = "PASS"
        else:
            results["merchant_notification"] = "FAIL"
    finally:
        db.close()

    # Customer Privacy Check
    print("\n[12E] Checking Customer Notification Clean Messaging & Privacy...")
    db = SessionLocal()
    try:
        c_notif = db.query(Notification).filter(Notification.payment_id == payment_id, Notification.recipient_type == "customer").first()
        if c_notif and "confidence" not in c_notif.message.lower() and "policy" not in c_notif.message.lower():
            print(f"  ✓ Customer Notification Safe: '{c_notif.message}' -> PASS")
            results["customer_privacy"] = "PASS"
        else:
            results["customer_privacy"] = "FAIL"
    finally:
        db.close()

    # Summary
    print("\n" + "=" * 75)
    print("  PHASE 12 VERIFICATION SUMMARY")
    print("=" * 75)
    all_pass = True
    for k, v in results.items():
        print(f"  {k:35s} : {v}")
        if v != "PASS":
            all_pass = False

    print("=" * 75)
    if all_pass:
        print("  OVERALL RESULT: ALL PHASE 12 CORRELATION CHECKS PASSED SUCCESSFULLY!")
    else:
        print("  OVERALL RESULT: SOME CHECKS FAILED.")
    print("=" * 75)


if __name__ == "__main__":
    run_phase_12_verification()
