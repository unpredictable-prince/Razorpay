import hashlib
import hmac
import json
import os
import sys
from fastapi.testclient import TestClient

# Ensure backend directory is in sys.path
backend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
from app.database import SessionLocal
from app.models import Transaction

client = TestClient(app)


def generate_signature(body_bytes: bytes, secret: str) -> str:
    return hmac.new(secret.encode("utf-8"), body_bytes, hashlib.sha256).hexdigest()


def run_phase_9_2_e2e_verification():
    print("=" * 65)
    print("      PHASE 9.2 — REAL CUSTOMER PAYMENT TO RECOVERAI VERIFICATION")
    print("=" * 65)

    secret = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "whsec_test_secret_12345")
    os.environ["RAZORPAY_WEBHOOK_SECRET"] = secret

    results = {}

    # 1. Test Signature Security Validation
    print("\n[9.2A] Testing HMAC-SHA256 Signature Security...")
    payload_bad_sig = {"event": "payment.failed", "payload": {"payment": {"entity": {"id": "pay_bad_sig"}}}}
    body_bad = json.dumps(payload_bad_sig).encode("utf-8")

    res_bad = client.post("/webhooks/razorpay", content=body_bad, headers={"X-Razorpay-Signature": "invalid_sig"})
    if res_bad.status_code == 400:
        print("  ✓ Invalid Signature Blocked (HTTP 400 Bad Request) -> PASS")
        results["invalid_sig_security"] = "PASS"
    else:
        print(f"  ✗ Invalid Signature Test Failed (Status: {res_bad.status_code}) -> FAIL")
        results["invalid_sig_security"] = "FAIL"

    # 2. Test Customer Payment Failure Webhook Pipeline
    print("\n[9.2B] Testing Customer Payment Failure Webhook Flow...")
    payment_id = f"pay_aura_test_{os.urandom(4).hex()}"
    customer_id = "cust_aura_8801"

    payload_fail = {
        "event": "payment.failed",
        "payload": {
            "payment": {
                "entity": {
                    "id": payment_id,
                    "amount": 499900,
                    "currency": "INR",
                    "status": "failed",
                    "error_reason": "bank_server_down",
                    "error_code": "BAD_REQUEST_ERROR",
                    "contact": "+919876543210",
                    "email": "rahul.sharma@example.com",
                    "notes": {
                        "order_id": "ord_aura_8801",
                        "customer_id": customer_id,
                    },
                }
            }
        },
    }

    body_fail = json.dumps(payload_fail).encode("utf-8")
    sig_fail = generate_signature(body_fail, secret)

    res_fail = client.post("/webhooks/razorpay", content=body_fail, headers={"X-Razorpay-Signature": sig_fail})
    if res_fail.status_code == 200 and res_fail.json().get("pipeline_executed") is True:
        print("  ✓ Customer Payment Failure Ingested & Pipeline Executed -> PASS")
        results["payment_failed_pipeline"] = "PASS"
    else:
        print(f"  ✗ Payment Failure Test Failed: {res_fail.text}")
        results["payment_failed_pipeline"] = "FAIL"

    # 3. Test Database Persistence & Customer Correlation
    print("\n[9.2C] Verifying SQLite Database Persistence & Identity Correlation...")
    db = SessionLocal()
    try:
        tx = db.query(Transaction).filter(Transaction.payment_id == payment_id).first()
        if tx and tx.customer_id == customer_id:
            print(f"  ✓ Transaction {payment_id} linked to Customer {tx.customer_id} in SQLite -> PASS")
            results["db_persistence"] = "PASS"
        else:
            print("  ✗ Database Record Check Failed -> FAIL")
            results["db_persistence"] = "FAIL"
    finally:
        db.close()

    # 4. Test Customer Payment Capture Webhook Flow
    print("\n[9.2D] Testing Customer Payment Captured Webhook Flow...")
    pay_cap_id = f"pay_aura_cap_{os.urandom(4).hex()}"
    payload_cap = {
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": pay_cap_id,
                    "amount": 149900,
                    "currency": "INR",
                    "status": "captured",
                    "notes": {"customer_id": "cust_aura_8802"},
                }
            }
        },
    }
    body_cap = json.dumps(payload_cap).encode("utf-8")
    sig_cap = generate_signature(body_cap, secret)

    res_cap = client.post("/webhooks/razorpay", content=body_cap, headers={"X-Razorpay-Signature": sig_cap})
    if res_cap.status_code == 200 and res_cap.json().get("updated_status") == "captured":
        print("  ✓ Payment Captured Webhook Ingested -> PASS")
        results["payment_captured"] = "PASS"
    else:
        print(f"  ✗ Payment Captured Webhook Failed: {res_cap.text}")
        results["payment_captured"] = "FAIL"

    # 5. Test Merchant Dashboard Stats API
    print("\n[9.2E] Testing Merchant Dashboard API Endpoints...")
    res_stats = client.get("/transactions/stats")
    if res_stats.status_code == 200 and res_stats.json().get("total_transactions", 0) > 0:
        print("  ✓ Merchant Dashboard Stats API Functional -> PASS")
        results["merchant_dashboard_api"] = "PASS"
    else:
        print(f"  ✗ Merchant Dashboard API Failed: {res_stats.text}")
        results["merchant_dashboard_api"] = "FAIL"

    # Summary
    print("\n" + "=" * 65)
    print("      PHASE 9.2 VERIFICATION SUMMARY")
    print("=" * 65)
    all_pass = True
    for k, v in results.items():
        print(f"  {k:30s} : {v}")
        if v != "PASS":
            all_pass = False

    print("=" * 65)
    if all_pass:
        print("  OVERALL RESULT: ALL PHASE 9.2 INTEGRATION CHECKS PASSED SUCCESSFULLY!")
    else:
        print("  OVERALL RESULT: SOME CHECKS FAILED.")
    print("=" * 65)


if __name__ == "__main__":
    run_phase_9_2_e2e_verification()
