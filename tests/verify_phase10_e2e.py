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
from app.models import Notification, Transaction

client = TestClient(app)


def generate_signature(body_bytes: bytes, secret: str) -> str:
    return hmac.new(secret.encode("utf-8"), body_bytes, hashlib.sha256).hexdigest()


def run_phase_10_e2e_verification():
    print("=" * 70)
    print("      PHASE 10 — RECOVERAI ALERT & NOTIFICATION SYSTEM VERIFICATION")
    print("=" * 70)

    secret = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "whsec_test_secret_12345")
    os.environ["RAZORPAY_WEBHOOK_SECRET"] = secret

    results = {}

    # Scenario 1: Recoverable Failure (bank_server_down)
    print("\n[10A] Testing Recoverable Failure Notification Flow (bank_server_down)...")
    pay_rec = f"pay_p10_rec_{os.urandom(4).hex()}"
    p_rec = {
        "event": "payment.failed",
        "payload": {
            "payment": {
                "entity": {
                    "id": pay_rec,
                    "amount": 499900,
                    "currency": "INR",
                    "status": "failed",
                    "error_reason": "bank_server_down",
                    "notes": {"customer_id": "cust_p10_01"},
                }
            }
        },
    }
    body = json.dumps(p_rec).encode("utf-8")
    res = client.post("/webhooks/razorpay", content=body, headers={"X-Razorpay-Signature": generate_signature(body, secret)})
    if res.status_code == 200:
        db = SessionLocal()
        try:
            n = db.query(Notification).filter(Notification.payment_id == pay_rec, Notification.recipient_type == "merchant").first()
            if n and n.severity == "success":
                print(f"  ✓ Merchant Notification Created ({n.title}) -> PASS")
                results["scenario_1_recoverable"] = "PASS"
            else:
                results["scenario_1_recoverable"] = "FAIL"
        finally:
            db.close()
    else:
        results["scenario_1_recoverable"] = "FAIL"

    # Scenario 2: Non-Recoverable Failure (customer_cancelled)
    print("\n[10B] Testing Non-Recoverable Failure Notification Flow (customer_cancelled)...")
    pay_non = f"pay_p10_non_{os.urandom(4).hex()}"
    p_non = {
        "event": "payment.failed",
        "payload": {
            "payment": {
                "entity": {
                    "id": pay_non,
                    "amount": 149900,
                    "currency": "INR",
                    "status": "failed",
                    "error_reason": "customer_cancelled",
                    "notes": {"customer_id": "cust_p10_02"},
                }
            }
        },
    }
    body = json.dumps(p_non).encode("utf-8")
    res = client.post("/webhooks/razorpay", content=body, headers={"X-Razorpay-Signature": generate_signature(body, secret)})
    if res.status_code == 200:
        db = SessionLocal()
        try:
            n = db.query(Notification).filter(Notification.payment_id == pay_non, Notification.recipient_type == "merchant").first()
            if n and n.severity in ["warning", "error"]:
                print(f"  ✓ Non-Recoverable Notification Created ({n.title}, Severity: {n.severity}) -> PASS")
                results["scenario_2_non_recoverable"] = "PASS"
            else:
                results["scenario_2_non_recoverable"] = "FAIL"
        finally:
            db.close()
    else:
        results["scenario_2_non_recoverable"] = "FAIL"

    # Scenario 3: Human Review Required (authentication_failed)
    print("\n[10C] Testing Human Review Required Notification Flow (authentication_failed)...")
    pay_hr = f"pay_p10_hr_{os.urandom(4).hex()}"
    p_hr = {
        "event": "payment.failed",
        "payload": {
            "payment": {
                "entity": {
                    "id": pay_hr,
                    "amount": 899900,
                    "currency": "INR",
                    "status": "failed",
                    "error_reason": "authentication_failed",
                    "notes": {"customer_id": "cust_p10_03"},
                }
            }
        },
    }
    body = json.dumps(p_hr).encode("utf-8")
    res = client.post("/webhooks/razorpay", content=body, headers={"X-Razorpay-Signature": generate_signature(body, secret)})
    if res.status_code == 200:
        db = SessionLocal()
        try:
            n = db.query(Notification).filter(Notification.payment_id == pay_hr, Notification.recipient_type == "merchant").first()
            if n and n.severity == "warning":
                print(f"  ✓ Human Review Notification Created ({n.title}) -> PASS")
                results["scenario_3_human_review"] = "PASS"
            else:
                results["scenario_3_human_review"] = "FAIL"
        finally:
            db.close()
    else:
        results["scenario_3_human_review"] = "FAIL"

    # Scenario 4: Payment Captured
    print("\n[10D] Testing Payment Captured Notification Flow...")
    pay_cap = f"pay_p10_cap_{os.urandom(4).hex()}"
    p_cap = {
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": pay_cap,
                    "amount": 219900,
                    "currency": "INR",
                    "status": "captured",
                }
            }
        },
    }
    body = json.dumps(p_cap).encode("utf-8")
    res = client.post("/webhooks/razorpay", content=body, headers={"X-Razorpay-Signature": generate_signature(body, secret)})
    if res.status_code == 200:
        db = SessionLocal()
        try:
            n = db.query(Notification).filter(Notification.payment_id == pay_cap, Notification.recipient_type == "merchant").first()
            if n and n.notification_type == "payment_captured":
                print(f"  ✓ Payment Captured Notification Created ({n.title}) -> PASS")
                results["scenario_4_captured"] = "PASS"
            else:
                results["scenario_4_captured"] = "FAIL"
        finally:
            db.close()
    else:
        results["scenario_4_captured"] = "FAIL"

    # Scenario 5: Payment Authorized
    print("\n[10E] Testing Payment Authorized Notification Flow...")
    pay_auth = f"pay_p10_auth_{os.urandom(4).hex()}"
    p_auth = {
        "event": "payment.authorized",
        "payload": {
            "payment": {
                "entity": {
                    "id": pay_auth,
                    "amount": 129900,
                    "currency": "INR",
                    "status": "authorized",
                }
            }
        },
    }
    body = json.dumps(p_auth).encode("utf-8")
    res = client.post("/webhooks/razorpay", content=body, headers={"X-Razorpay-Signature": generate_signature(body, secret)})
    if res.status_code == 200:
        db = SessionLocal()
        try:
            n = db.query(Notification).filter(Notification.payment_id == pay_auth, Notification.recipient_type == "merchant").first()
            if n and n.notification_type == "payment_authorized":
                print(f"  ✓ Payment Authorized Notification Created ({n.title}) -> PASS")
                results["scenario_5_authorized"] = "PASS"
            else:
                results["scenario_5_authorized"] = "FAIL"
        finally:
            db.close()
    else:
        results["scenario_5_authorized"] = "FAIL"

    # Test REST API Notification Endpoints
    print("\n[10F] Testing REST API Notification Endpoints...")
    res_notifs = client.get("/notifications")
    res_unread = client.get("/notifications/unread-count")
    if res_notifs.status_code == 200 and res_unread.status_code == 200:
        print(f"  ✓ GET /notifications (Items: {len(res_notifs.json())}) & Unread Count ({res_unread.json()['unread_count']}) -> PASS")
        results["api_endpoints"] = "PASS"
    else:
        results["api_endpoints"] = "FAIL"

    # Summary
    print("\n" + "=" * 70)
    print("      PHASE 10 VERIFICATION SUMMARY")
    print("=" * 70)
    all_pass = True
    for k, v in results.items():
        print(f"  {k:35s} : {v}")
        if v != "PASS":
            all_pass = False

    print("=" * 70)
    if all_pass:
        print("  OVERALL RESULT: ALL PHASE 10 NOTIFICATION CHECKS PASSED SUCCESSFULLY!")
    else:
        print("  OVERALL RESULT: SOME CHECKS FAILED.")
    print("=" * 70)


if __name__ == "__main__":
    run_phase_10_e2e_verification()
