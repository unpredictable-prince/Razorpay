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
from app.database import SessionLocal, init_db
from app.models import Notification, Transaction

client = TestClient(app)


def generate_signature(body_bytes: bytes, secret: str) -> str:
    return hmac.new(secret.encode("utf-8"), body_bytes, hashlib.sha256).hexdigest()


def run_phase_11_final_integration():
    print("=" * 75)
    print("    PHASE 11 — RECOVERAI MASTER FINAL SYSTEM INTEGRATION VERIFICATION")
    print("=" * 75)

    init_db()
    secret = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "whsec_test_secret_12345")
    os.environ["RAZORPAY_WEBHOOK_SECRET"] = secret

    results = {}

    # 1. Health Check Verification
    print("\n[11.1] Testing Backend Health Check (/health)...")
    res_health = client.get("/health")
    if res_health.status_code == 200 and res_health.json().get("status") == "ok":
        print("  ✓ RecoverAI FastAPI Backend Operational (HTTP 200 OK) -> PASS")
        results["health_check"] = "PASS"
    else:
        results["health_check"] = "FAIL"

    # 2. HMAC Security Audit
    print("\n[11.2] Testing Webhook HMAC-SHA256 Security Validation...")
    bad_payload = {"event": "payment.failed", "payload": {"payment": {"entity": {"id": "pay_sec_test"}}}}
    bad_body = json.dumps(bad_payload).encode("utf-8")
    res_bad_sig = client.post("/webhooks/razorpay", content=bad_body, headers={"X-Razorpay-Signature": "tampered_sig"})
    if res_bad_sig.status_code == 400:
        print("  ✓ Invalid/Tampered Webhook Signature Blocked (HTTP 400 Bad Request) -> PASS")
        results["hmac_security"] = "PASS"
    else:
        results["hmac_security"] = "FAIL"

    # 3. Scenario A: Temporary Failure & Recovery Execution (bank_server_down)
    print("\n[11.3] Testing Scenario A: Temporary Failure & Automated Recovery (bank_server_down)...")
    pay_a = f"pay_p11_a_{os.urandom(4).hex()}"
    p_a = {
        "event": "payment.failed",
        "payload": {
            "payment": {
                "entity": {
                    "id": pay_a,
                    "amount": 299900,
                    "currency": "INR",
                    "status": "failed",
                    "error_reason": "bank_server_down",
                    "contact": "+919876543210",
                    "email": "rahul@example.com",
                    "notes": {"customer_id": "cust_p11_01", "order_id": "ord_p11_01"},
                }
            }
        },
    }
    body_a = json.dumps(p_a).encode("utf-8")
    res_a = client.post("/webhooks/razorpay", content=body_a, headers={"X-Razorpay-Signature": generate_signature(body_a, secret)})
    if res_a.status_code == 200 and res_a.json().get("pipeline_executed") is True:
        db = SessionLocal()
        try:
            tx = db.query(Transaction).filter(Transaction.payment_id == pay_a).first()
            n = db.query(Notification).filter(Notification.payment_id == pay_a, Notification.recipient_type == "merchant").first()
            if tx and tx.recovery_status in ["executed", "recovered", "completed"] and n:
                print(f"  ✓ Pipeline executed, recovered in DB, and merchant notified ({n.title}) -> PASS")
                results["scenario_a_temporary_failure"] = "PASS"
            else:
                results["scenario_a_temporary_failure"] = "FAIL"
        finally:
            db.close()
    else:
        results["scenario_a_temporary_failure"] = "FAIL"

    # 4. Scenario B: Non-Recoverable Failure (customer_cancelled)
    print("\n[11.4] Testing Scenario B: Customer Cancellation Guardrail (customer_cancelled)...")
    pay_b = f"pay_p11_b_{os.urandom(4).hex()}"
    p_b = {
        "event": "payment.failed",
        "payload": {
            "payment": {
                "entity": {
                    "id": pay_b,
                    "amount": 149900,
                    "currency": "INR",
                    "status": "failed",
                    "error_reason": "customer_cancelled",
                    "notes": {"customer_id": "cust_p11_02"},
                }
            }
        },
    }
    body_b = json.dumps(p_b).encode("utf-8")
    res_b = client.post("/webhooks/razorpay", content=body_b, headers={"X-Razorpay-Signature": generate_signature(body_b, secret)})
    if res_b.status_code == 200:
        db = SessionLocal()
        try:
            n = db.query(Notification).filter(Notification.payment_id == pay_b, Notification.recipient_type == "merchant").first()
            if n and n.severity in ["warning", "error"]:
                print(f"  ✓ Guardrail blocked automated retry & routed to human review ({n.title}) -> PASS")
                results["scenario_b_customer_cancelled"] = "PASS"
            else:
                results["scenario_b_customer_cancelled"] = "FAIL"
        finally:
            db.close()
    else:
        results["scenario_b_customer_cancelled"] = "FAIL"

    # 5. Scenario C: High Risk Failure (authentication_failed)
    print("\n[11.5] Testing Scenario C: Security Risk Guardrail (authentication_failed)...")
    pay_c = f"pay_p11_c_{os.urandom(4).hex()}"
    p_c = {
        "event": "payment.failed",
        "payload": {
            "payment": {
                "entity": {
                    "id": pay_c,
                    "amount": 899900,
                    "currency": "INR",
                    "status": "failed",
                    "error_reason": "authentication_failed",
                    "notes": {"customer_id": "cust_p11_03"},
                }
            }
        },
    }
    body_c = json.dumps(p_c).encode("utf-8")
    res_c = client.post("/webhooks/razorpay", content=body_c, headers={"X-Razorpay-Signature": generate_signature(body_c, secret)})
    if res_c.status_code == 200:
        db = SessionLocal()
        try:
            n = db.query(Notification).filter(Notification.payment_id == pay_c, Notification.recipient_type == "merchant").first()
            if n and n.notification_type == "human_review_required":
                print(f"  ✓ High risk trigger correctly routed to human review ({n.title}) -> PASS")
                results["scenario_c_human_review"] = "PASS"
            else:
                results["scenario_c_human_review"] = "FAIL"
        finally:
            db.close()
    else:
        results["scenario_c_human_review"] = "FAIL"

    # 6. Scenario D: Payment Captured Event
    print("\n[11.6] Testing Scenario D: Payment Captured Webhook Event...")
    pay_d = f"pay_p11_d_{os.urandom(4).hex()}"
    p_d = {
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": pay_d,
                    "amount": 499900,
                    "currency": "INR",
                    "status": "captured",
                }
            }
        },
    }
    body_d = json.dumps(p_d).encode("utf-8")
    res_d = client.post("/webhooks/razorpay", content=body_d, headers={"X-Razorpay-Signature": generate_signature(body_d, secret)})
    if res_d.status_code == 200 and res_d.json().get("updated_status") == "captured":
        print("  ✓ Payment Captured Webhook Ingested & Persisted -> PASS")
        results["scenario_d_payment_captured"] = "PASS"
    else:
        results["scenario_d_payment_captured"] = "FAIL"

    # 7. Customer Privacy Check
    print("\n[11.7] Testing Customer Privacy & Secret Concealment...")
    db = SessionLocal()
    try:
        cust_notifs = db.query(Notification).filter(Notification.recipient_type == "customer").all()
        privacy_pass = True
        for cn in cust_notifs:
            msg = cn.message.lower()
            if "confidence" in msg or "policy" in msg or "secret" in msg or "gemini" in msg:
                privacy_pass = False
                break
        if privacy_pass and len(cust_notifs) > 0:
            print("  ✓ Customer Notifications strictly conceal AI/Policy/Secret internals -> PASS")
            results["customer_privacy"] = "PASS"
        else:
            results["customer_privacy"] = "FAIL"
    finally:
        db.close()

    # 8. Merchant Dashboard REST APIs
    print("\n[11.8] Testing Merchant Dashboard REST Endpoints...")
    res_tx = client.get("/transactions/")
    res_stats = client.get("/transactions/stats")
    res_notifs = client.get("/notifications")
    res_unread = client.get("/notifications/unread-count")

    if (
        res_tx.status_code == 200
        and res_stats.status_code == 200
        and res_notifs.status_code == 200
        and res_unread.status_code == 200
    ):
        print(f"  ✓ Transactions ({len(res_tx.json())}), Stats (Rate: {res_stats.json()['recovery_rate']}%), Notifications ({len(res_notifs.json())}) -> PASS")
        results["dashboard_apis"] = "PASS"
    else:
        results["dashboard_apis"] = "FAIL"

    # Summary
    print("\n" + "=" * 75)
    print("      PHASE 11 MASTER INTEGRATION SUMMARY")
    print("=" * 75)
    all_pass = True
    for k, v in results.items():
        print(f"  {k:40s} : {v}")
        if v != "PASS":
            all_pass = False

    print("=" * 75)
    if all_pass:
        print("  OVERALL RESULT: ALL PHASE 11 MASTER INTEGRATION CHECKS PASSED SUCCESSFULLY!")
    else:
        print("  OVERALL RESULT: SOME CHECKS FAILED.")
    print("=" * 75)


if __name__ == "__main__":
    run_phase_11_final_integration()
