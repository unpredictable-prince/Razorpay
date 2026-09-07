import hashlib
import hmac
import json
import pytest
from fastapi.testclient import TestClient

from app.database import SessionLocal, init_db
from app.main import app
from app.models import Transaction

TEST_WEBHOOK_SECRET = "test_webhook_secret_123"


@pytest.fixture(autouse=True)
def setup_webhook_env(monkeypatch):
    monkeypatch.setenv("RAZORPAY_WEBHOOK_SECRET", TEST_WEBHOOK_SECRET)
    init_db()
    db = SessionLocal()
    db.query(Transaction).filter(Transaction.payment_id.like("pay_wh_%")).delete(synchronize_session=False)
    db.commit()
    db.close()


def generate_signature(payload_dict: dict, secret: str = TEST_WEBHOOK_SECRET) -> str:
    raw_bytes = json.dumps(payload_dict).encode("utf-8")
    return hmac.new(secret.encode("utf-8"), raw_bytes, hashlib.sha256).hexdigest()


def test_missing_signature_header():
    client = TestClient(app)
    payload = {"event": "payment.failed"}
    response = client.post("/webhooks/razorpay", json=payload)
    assert response.status_code == 400
    assert "Missing X-Razorpay-Signature" in response.json()["detail"]


def test_invalid_signature_header():
    client = TestClient(app)
    payload = {"event": "payment.failed"}
    headers = {"X-Razorpay-Signature": "invalid_signature_hash_123"}
    response = client.post("/webhooks/razorpay", json=payload, headers=headers)
    assert response.status_code == 400
    assert "signature verification failed" in response.json()["detail"]


def test_malformed_json_payload():
    client = TestClient(app)
    raw_data = b"INVALID_NON_JSON_DATA"
    sig = hmac.new(TEST_WEBHOOK_SECRET.encode("utf-8"), raw_data, hashlib.sha256).hexdigest()
    headers = {"X-Razorpay-Signature": sig, "Content-Type": "application/json"}
    response = client.post("/webhooks/razorpay", content=raw_data, headers=headers)
    assert response.status_code == 400
    assert "Malformed JSON payload" in response.json()["detail"]


def test_missing_payment_entity():
    client = TestClient(app)
    payload = {"event": "payment.failed", "payload": {}}
    raw_bytes = json.dumps(payload).encode("utf-8")
    sig = hmac.new(TEST_WEBHOOK_SECRET.encode("utf-8"), raw_bytes, hashlib.sha256).hexdigest()
    headers = {"X-Razorpay-Signature": sig, "Content-Type": "application/json"}

    response = client.post("/webhooks/razorpay", content=raw_bytes, headers=headers)
    assert response.status_code == 400
    assert "missing payment entity" in response.json()["detail"]


def test_unsupported_event():
    client = TestClient(app)
    payload = {
        "event": "order.paid",
        "payload": {"payment": {"entity": {"id": "pay_wh_unsupported_001"}}},
    }
    raw_bytes = json.dumps(payload).encode("utf-8")
    sig = hmac.new(TEST_WEBHOOK_SECRET.encode("utf-8"), raw_bytes, hashlib.sha256).hexdigest()
    headers = {"X-Razorpay-Signature": sig, "Content-Type": "application/json"}

    response = client.post("/webhooks/razorpay", content=raw_bytes, headers=headers)
    assert response.status_code == 200
    assert response.json()["status"] == "ignored"


def test_valid_payment_failed_webhook():
    client = TestClient(app)
    payment_id = "pay_wh_failed_001"
    payload = {
        "entity": "event",
        "event": "payment.failed",
        "payload": {
            "payment": {
                "entity": {
                    "id": payment_id,
                    "amount": 200000,
                    "currency": "INR",
                    "status": "failed",
                    "error_reason": "bank_server_down",
                    "contact": "+919876543210",
                }
            }
        },
    }
    raw_bytes = json.dumps(payload).encode("utf-8")
    sig = hmac.new(TEST_WEBHOOK_SECRET.encode("utf-8"), raw_bytes, hashlib.sha256).hexdigest()
    headers = {"X-Razorpay-Signature": sig, "Content-Type": "application/json"}

    response = client.post("/webhooks/razorpay", content=raw_bytes, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "accepted"
    assert data["payment_id"] == payment_id
    assert data["pipeline_executed"] is True
    assert data["execution_result"]["status"] == "executed"

    # Database state verification
    db = SessionLocal()
    tx = db.query(Transaction).filter(Transaction.payment_id == payment_id).first()
    assert tx is not None
    assert tx.recovery_status == "executed"
    db.close()


def test_idempotent_duplicate_payment_failed_webhook():
    client = TestClient(app)
    payment_id = "pay_wh_failed_001"
    payload = {
        "entity": "event",
        "event": "payment.failed",
        "payload": {
            "payment": {
                "entity": {
                    "id": payment_id,
                    "amount": 200000,
                    "currency": "INR",
                    "status": "failed",
                    "error_reason": "bank_server_down",
                    "contact": "+919876543210",
                }
            }
        },
    }
    raw_bytes = json.dumps(payload).encode("utf-8")
    sig = hmac.new(TEST_WEBHOOK_SECRET.encode("utf-8"), raw_bytes, hashlib.sha256).hexdigest()
    headers = {"X-Razorpay-Signature": sig, "Content-Type": "application/json"}

    # First delivery
    client.post("/webhooks/razorpay", content=raw_bytes, headers=headers)

    # Second delivery of duplicate event
    response = client.post("/webhooks/razorpay", content=raw_bytes, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "accepted"
    assert data["idempotent"] is True
    assert "already processed" in data["message"]


def test_payment_authorized_webhook():
    client = TestClient(app)
    payment_id = "pay_wh_auth_001"
    payload = {
        "entity": "event",
        "event": "payment.authorized",
        "payload": {
            "payment": {
                "entity": {
                    "id": payment_id,
                    "amount": 150000,
                    "currency": "INR",
                    "status": "authorized",
                    "contact": "+919876543210",
                }
            }
        },
    }
    raw_bytes = json.dumps(payload).encode("utf-8")
    sig = hmac.new(TEST_WEBHOOK_SECRET.encode("utf-8"), raw_bytes, hashlib.sha256).hexdigest()
    headers = {"X-Razorpay-Signature": sig, "Content-Type": "application/json"}

    response = client.post("/webhooks/razorpay", content=raw_bytes, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "accepted"
    assert data["updated_status"] == "authorized"

    db = SessionLocal()
    tx = db.query(Transaction).filter(Transaction.payment_id == payment_id).first()
    assert tx is not None
    assert tx.status == "authorized"
    db.close()


def test_payment_failed_followed_by_captured_sequence():
    client = TestClient(app)
    payment_id = "pay_wh_fail_then_cap_001"

    # Step 1: Send payment.failed
    fail_payload = {
        "entity": "event",
        "event": "payment.failed",
        "payload": {
            "payment": {
                "entity": {
                    "id": payment_id,
                    "amount": 500000,
                    "currency": "INR",
                    "status": "failed",
                    "error_reason": "card_expired",
                }
            }
        },
    }
    raw_fail = json.dumps(fail_payload).encode("utf-8")
    sig_fail = hmac.new(TEST_WEBHOOK_SECRET.encode("utf-8"), raw_fail, hashlib.sha256).hexdigest()
    headers_fail = {"X-Razorpay-Signature": sig_fail, "Content-Type": "application/json"}
    r1 = client.post("/webhooks/razorpay", content=raw_fail, headers=headers_fail)
    assert r1.status_code == 200

    # Step 2: Send payment.captured for same payment_id
    cap_payload = {
        "entity": "event",
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": payment_id,
                    "amount": 500000,
                    "currency": "INR",
                    "status": "captured",
                }
            }
        },
    }
    raw_cap = json.dumps(cap_payload).encode("utf-8")
    sig_cap = hmac.new(TEST_WEBHOOK_SECRET.encode("utf-8"), raw_cap, hashlib.sha256).hexdigest()
    headers_cap = {"X-Razorpay-Signature": sig_cap, "Content-Type": "application/json"}
    r2 = client.post("/webhooks/razorpay", content=raw_cap, headers=headers_cap)
    assert r2.status_code == 200

def test_modified_payload_rejected():
    client = TestClient(app)
    original_payload = {"event": "payment.failed", "payload": {"payment": {"entity": {"id": "pay_wh_orig_001"}}}}
    sig = generate_signature(original_payload)

    # Modify payload content while keeping original signature
    modified_payload = {"event": "payment.failed", "payload": {"payment": {"entity": {"id": "pay_wh_mod_999"}}}}
    modified_bytes = json.dumps(modified_payload).encode("utf-8")
    headers = {"X-Razorpay-Signature": sig, "Content-Type": "application/json"}

    response = client.post("/webhooks/razorpay", content=modified_bytes, headers=headers)
    assert response.status_code == 400
    assert "signature verification failed" in response.json()["detail"]


def test_missing_payment_id():
    client = TestClient(app)
    payload = {"event": "payment.failed", "payload": {"payment": {"entity": {"amount": 50000}}}}
    raw_bytes = json.dumps(payload).encode("utf-8")
    sig = hmac.new(TEST_WEBHOOK_SECRET.encode("utf-8"), raw_bytes, hashlib.sha256).hexdigest()
    headers = {"X-Razorpay-Signature": sig, "Content-Type": "application/json"}

    response = client.post("/webhooks/razorpay", content=raw_bytes, headers=headers)
    assert response.status_code == 400
    assert "missing payment entity or payment ID" in response.json()["detail"]


def test_policy_engine_rejection_webhook():
    client = TestClient(app)
    payment_id = "pay_wh_high_val_001"
    payload = {
        "entity": "event",
        "event": "payment.failed",
        "payload": {
            "payment": {
                "entity": {
                    "id": payment_id,
                    "amount": 2000000,  # ₹20,000 (Exceeds ₹10,000 limit)
                    "currency": "INR",
                    "status": "failed",
                    "error_reason": "bank_server_down",
                }
            }
        },
    }
    raw_bytes = json.dumps(payload).encode("utf-8")
    sig = hmac.new(TEST_WEBHOOK_SECRET.encode("utf-8"), raw_bytes, hashlib.sha256).hexdigest()
    headers = {"X-Razorpay-Signature": sig, "Content-Type": "application/json"}

    response = client.post("/webhooks/razorpay", content=raw_bytes, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "accepted"
    assert data["policy_decision"]["allowed"] is False
    assert data["policy_decision"]["decision"] == "human_review"
    assert data["execution_result"]["status"] == "human_review"


