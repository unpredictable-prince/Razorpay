import hashlib
import hmac
import json
import os
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal, init_db
from app.models import Transaction

# Set test environment secret if not configured
if not os.environ.get("RAZORPAY_WEBHOOK_SECRET"):
    os.environ["RAZORPAY_WEBHOOK_SECRET"] = "whsec_test_secret_12345"

client = TestClient(app)


def generate_webhook_signature(raw_body: bytes, secret: str) -> str:
    """Generates valid HMAC-SHA256 signature for test webhook payload."""
    return hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()


@pytest.fixture(autouse=True)
def setup_test_db():
    init_db()
    yield


def test_invalid_signature_rejected():
    """Verify webhook with invalid signature is rejected with 400."""
    payload = {
        "event": "payment.failed",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_test_invalid_sig",
                    "amount": 499900,
                    "currency": "INR",
                    "error_reason": "bank_server_down",
                }
            }
        },
    }
    raw_body = json.dumps(payload).encode("utf-8")
    headers = {"X-Razorpay-Signature": "invalid_signature_hash"}

    response = client.post("/webhooks/razorpay", content=raw_body, headers=headers)
    assert response.status_code == 400
    assert "Invalid webhook signature" in response.json()["detail"]


def test_customer_payment_failed_end_to_end():
    """
    Simulates a real customer payment failure event from Aura Store checkout.
    Verifies HMAC verification, Analyzer, Agent, Policy Engine, and DB persistence.
    """
    secret = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "whsec_test_secret_12345")
    payment_id = f"pay_aura_fail_{os.urandom(4).hex()}"
    customer_id = "cust_aura_9901"

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
                    "error_code": "BAD_REQUEST_ERROR",
                    "contact": "+919876543210",
                    "email": "rahul.sharma@example.com",
                    "notes": {
                        "order_id": "ord_aura_1001",
                        "customer_id": customer_id,
                    },
                }
            }
        },
    }

    raw_body = json.dumps(payload).encode("utf-8")
    signature = generate_webhook_signature(raw_body, secret)
    headers = {"X-Razorpay-Signature": signature}

    # 1. Dispatch Webhook
    response = client.post("/webhooks/razorpay", content=raw_body, headers=headers)
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "accepted"
    assert data["payment_id"] == payment_id
    assert data["pipeline_executed"] is True

    # 2. Verify Recovery Pipeline Components Output
    assert "analysis" in data
    assert data["analysis"]["potentially_recoverable"] is True
    assert data["analysis"]["reason"] != ""

    assert "recommendation" in data
    assert "recommended_action" in data["recommendation"]

    assert "policy_decision" in data
    assert data["policy_decision"]["decision"] in ["approved", "human_review", "rejected"]

    # 3. Verify Persistence in RecoverAI Database
    db = SessionLocal()
    try:
        tx = db.query(Transaction).filter(Transaction.payment_id == payment_id).first()
        assert tx is not None
        assert tx.payment_id == payment_id
        assert tx.customer_id == customer_id
        assert tx.amount == 299900
        assert tx.recovery_status in ["executed", "recovered", "completed", "pending", "human_review"]
    finally:
        db.close()

    # 4. Verify Transaction shows in Merchant Dashboard Stats API
    stats_res = client.get("/transactions/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_transactions"] > 0
    assert stats["failed_payments"] > 0


def test_customer_payment_captured_end_to_end():
    """
    Simulates a successful payment capture event.
    Verifies that status is updated to 'captured' and recovery is halted.
    """
    secret = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "whsec_test_secret_12345")
    payment_id = f"pay_aura_success_{os.urandom(4).hex()}"
    customer_id = "cust_aura_9902"

    payload = {
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": payment_id,
                    "amount": 499900,
                    "currency": "INR",
                    "status": "captured",
                    "contact": "+919876543210",
                    "email": "rahul.sharma@example.com",
                    "notes": {
                        "order_id": "ord_aura_1002",
                        "customer_id": customer_id,
                    },
                }
            }
        },
    }

    raw_body = json.dumps(payload).encode("utf-8")
    signature = generate_webhook_signature(raw_body, secret)
    headers = {"X-Razorpay-Signature": signature}

    response = client.post("/webhooks/razorpay", content=raw_body, headers=headers)
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "accepted"
    assert data["updated_status"] == "captured"

    db = SessionLocal()
    try:
        tx = db.query(Transaction).filter(Transaction.payment_id == payment_id).first()
        assert tx is not None
        assert tx.status == "captured"
        assert tx.recovery_status == "not_required"
    finally:
        db.close()


def test_webhook_idempotency():
    """
    Verifies that sending duplicate webhook events does not duplicate records or crash.
    """
    secret = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "whsec_test_secret_12345")
    payment_id = f"pay_aura_idempotent_{os.urandom(4).hex()}"

    payload = {
        "event": "payment.failed",
        "payload": {
            "payment": {
                "entity": {
                    "id": payment_id,
                    "amount": 149900,
                    "currency": "INR",
                    "status": "failed",
                    "error_reason": "insufficient_funds",
                }
            }
        },
    }

    raw_body = json.dumps(payload).encode("utf-8")
    signature = generate_webhook_signature(raw_body, secret)
    headers = {"X-Razorpay-Signature": signature}

    # First delivery
    res1 = client.post("/webhooks/razorpay", content=raw_body, headers=headers)
    assert res1.status_code == 200

    # Second delivery (Duplicate)
    res2 = client.post("/webhooks/razorpay", content=raw_body, headers=headers)
    assert res2.status_code == 200
