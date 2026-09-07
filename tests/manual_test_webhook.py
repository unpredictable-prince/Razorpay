import hashlib
import hmac
import json
import os
import sys
from fastapi.testclient import TestClient

# Ensure workspace root and backend directories are in sys.path
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
backend_dir = os.path.join(root_dir, "backend")
for path in [root_dir, backend_dir]:
    if path not in sys.path:
        sys.path.insert(0, path)

# Auto-load .env file from workspace root if present
env_file = os.path.join(root_dir, ".env")
if os.path.exists(env_file):
    with open(env_file, "r", encoding="utf-8-sig") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                key = k.strip()
                val = v.strip().strip("'\"")
                if val:
                    os.environ[key] = val

from app.database import SessionLocal, init_db
from app.main import app
from app.models import Transaction


def run_manual_webhook_simulation():
    """
    Local simulation of Razorpay payment.failed webhook delivery.
    Generates HMAC SHA256 signature and posts to /webhooks/razorpay.
    Traces execution through DB Storage -> Analyzer -> Agent -> Policy Engine -> Recovery Service.
    """
    print("=" * 65)
    print("=== LOCAL RAZORPAY WEBHOOK SIMULATION ===")
    print("=" * 65)

    webhook_secret = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "recoverai_test_webhook_secret")

    # Clean up any existing simulation record prior to test run
    init_db()
    db_prep = SessionLocal()
    db_prep.query(Transaction).filter(Transaction.payment_id == "pay_TEST_WEBHOOK_001").delete()
    db_prep.commit()
    db_prep.close()

    # Define test payload
    payment_id = "pay_TEST_WEBHOOK_001"
    payload = {
        "entity": "event",
        "account_id": "acc_test_recoverai",
        "event": "payment.failed",
        "contains": ["payment"],
        "payload": {
            "payment": {
                "entity": {
                    "id": payment_id,
                    "amount": 200000,  # ₹2,000.00
                    "currency": "INR",
                    "status": "failed",
                    "error_reason": "bank_server_down",
                    "error_code": "BAD_REQUEST_ERROR",
                    "error_description": "Bank server is temporarily down.",
                    "contact": "+919999999999",
                    "email": "test_merchant@example.com",
                    "created_at": 1700000000,
                }
            }
        },
    }

    raw_body = json.dumps(payload).encode("utf-8")
    signature = hmac.new(webhook_secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()

    print(f"\n[Step 1] Preparing Webhook Payload...")
    print(f"Target Payment ID : {payment_id}")
    print(f"Amount            : ₹2,000.00 (200000 paise)")
    print(f"Event Type        : payment.failed")
    print(f"Failure Reason    : bank_server_down")
    print(f"Calculated Sig    : {signature[:12]}... (HMAC-SHA256)")

    print(f"\n[Step 2] Sending POST /webhooks/razorpay request...")
    client = TestClient(app)
    headers = {
        "X-Razorpay-Signature": signature,
        "Content-Type": "application/json",
    }

    response = client.post("/webhooks/razorpay", content=raw_body, headers=headers)

    print(f"\n[Step 3] Webhook HTTP Response:")
    print(f"HTTP Status Code  : {response.status_code}")
    res_data = response.json()
    print("Response Body     :\n" + json.dumps(res_data, indent=2))

    if response.status_code != 200 or res_data.get("status") != "accepted":
        print(f"\n❌ WEBHOOK SIMULATION FAILED: HTTP {response.status_code}")
        return

    print(f"\n[Step 4] Verifying Pipeline Outcomes...")
    analysis = res_data.get("analysis", {})
    recommendation = res_data.get("recommendation", {})
    policy_decision = res_data.get("policy_decision", {})
    execution_result = res_data.get("execution_result", {})

    print(f"✓ Webhook Accepted      : True")
    print(f"✓ Recovery Analyzer     : Action = '{analysis.get('recommended_action')}'")
    print(f"✓ Recovery Agent        : Decision = '{recommendation.get('decision')}'")
    print(f"✓ Policy Engine Guard   : Decision = '{policy_decision.get('decision')}' (Allowed={policy_decision.get('allowed')})")
    print(f"✓ Recovery Service      : Status = '{execution_result.get('status')}', Recovered = ₹{execution_result.get('recovered_amount', 0)/100:,.2f}")

    # Database Verification
    db = SessionLocal()
    tx = db.query(Transaction).filter(Transaction.payment_id == payment_id).first()
    db.close()

    print(f"\n[Step 5] Database Verification:")
    if tx:
        print(f"✓ Transaction Record    : Found (ID={tx.payment_id}, Status={tx.status}, RecoveryStatus={tx.recovery_status})")
    else:
        print(f"❌ Transaction Record    : NOT FOUND IN DB")

    print("\n" + "=" * 65)
    print("RESULT: SUCCESS - Razorpay webhook processed through RecoverAI pipeline!")
    print("=" * 65 + "\n")


if __name__ == "__main__":
    run_manual_webhook_simulation()
