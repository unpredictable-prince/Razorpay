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


def run_phase13_verification():
    print("=" * 75)
    print("  PHASE 13 — RECOVERAI DIFFERENTIATION & DEMO EXPERIENCE E2E VERIFICATION")
    print("=" * 75)

    init_db()
    if not os.environ.get("RAZORPAY_WEBHOOK_SECRET"):
        os.environ["RAZORPAY_WEBHOOK_SECRET"] = "whsec_test_secret_12345"

    results = {}

    # 1. Test Demo Simulation Endpoint
    print("\n[13A] Testing Demo Simulation Endpoint (/demo/simulate)...")
    res_sim = client.post(
        "/demo/simulate",
        json={
            "scenario": "bank_server_down",
            "customer_name": "Sam",
            "customer_email": "sam@gmail.com",
            "customer_phone": "9876543210",
            "amount": 299900,
        },
    )
    if res_sim.status_code == 200 and res_sim.json().get("status") == "ok":
        payment_id = res_sim.json()["payment_id"]
        print(f"  ✓ Demo Simulation Successful for Customer 'Sam' (ID: {payment_id}) -> PASS")
        results["demo_simulate"] = "PASS"
    else:
        results["demo_simulate"] = "FAIL"

    # 2. Test Customer Journey Inspection API
    print("\n[13B] Testing Customer Journey Inspection API (/transactions/customer/Sam)...")
    res_journey = client.get("/transactions/customer/Sam")
    if res_journey.status_code == 200 and res_journey.json().get("customer_name") == "Sam":
        jdata = res_journey.json()
        print(f"  ✓ Customer Journey Retrieved: {jdata['total_orders']} orders, {len(jdata['timeline'])} timeline events -> PASS")
        results["customer_journey_api"] = "PASS"
    else:
        results["customer_journey_api"] = "FAIL"

    # 3. Test Merchant Notification Personification
    print("\n[13C] Testing Merchant Notification Personification...")
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

    # 4. Test Demo Reset API
    print("\n[13D] Testing Safe Demo Reset API (/demo/reset)...")
    res_reset = client.post("/demo/reset")
    if res_reset.status_code == 200 and res_reset.json().get("status") == "ok":
        db = SessionLocal()
        try:
            demo_txs = db.query(Transaction).filter(Transaction.payment_id.like("pay_demo_%")).all()
            if len(demo_txs) == 0:
                print("  ✓ Safe Demo Reset Executed: Demo records cleaned cleanly -> PASS")
                results["demo_reset"] = "PASS"
            else:
                results["demo_reset"] = "FAIL"
        finally:
            db.close()
    else:
        results["demo_reset"] = "FAIL"

    # Summary
    print("\n" + "=" * 75)
    print("  PHASE 13 VERIFICATION SUMMARY")
    print("=" * 75)
    all_pass = True
    for k, v in results.items():
        print(f"  {k:35s} : {v}")
        if v != "PASS":
            all_pass = False

    print("=" * 75)
    if all_pass:
        print("  OVERALL RESULT: ALL PHASE 13 VERIFICATION CHECKS PASSED SUCCESSFULLY!")
    else:
        print("  OVERALL RESULT: SOME CHECKS FAILED.")
    print("=" * 75)


if __name__ == "__main__":
    run_phase13_verification()
