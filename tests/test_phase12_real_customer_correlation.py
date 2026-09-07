import hashlib
import hmac
import json
import os
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal, init_db
from app.models import Notification, Transaction

if not os.environ.get("RAZORPAY_WEBHOOK_SECRET"):
    os.environ["RAZORPAY_WEBHOOK_SECRET"] = "whsec_test_secret_12345"

client = TestClient(app)


def generate_webhook_signature(raw_body: bytes, secret: str) -> str:
    return hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()


@pytest.fixture(autouse=True)
def setup_test_db():
    init_db()
    yield


def test_real_customer_name_automatic_correlation():
    """
    Verifies that when a customer (e.g. Sam) places an order in Aura Store,
    the customer's real name, email, phone, and order_id automatically flow
    from Razorpay webhook notes into recoverai.db, API responses, and Notifications.
    """
    secret = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "whsec_test_secret_12345")
    payment_id = f"pay_sam_test_{os.urandom(4).hex()}"
    customer_id = "cust_sam_99"
    order_id = "ord_aura_sam_99"

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

    raw_body = json.dumps(payload).encode("utf-8")
    sig = generate_webhook_signature(raw_body, secret)

    # 1. Ingest Webhook
    response = client.post("/webhooks/razorpay", content=raw_body, headers={"X-Razorpay-Signature": sig})
    assert response.status_code == 200
    assert response.json()["pipeline_executed"] is True

    # 2. Database Persistence Verification
    db = SessionLocal()
    try:
        tx = db.query(Transaction).filter(Transaction.payment_id == payment_id).first()
        assert tx is not None
        assert tx.customer_name == "Sam"
        assert tx.customer_email == "sam@gmail.com"
        assert tx.customer_phone == "9876543210"
        assert tx.order_id == order_id
        assert tx.customer_id == customer_id

        # Merchant Notification Verification
        m_notif = db.query(Notification).filter(Notification.payment_id == payment_id, Notification.recipient_type == "merchant").first()
        assert m_notif is not None
        assert "Sam" in m_notif.title or "Sam" in m_notif.message

        # Customer Notification Verification
        c_notif = db.query(Notification).filter(Notification.payment_id == payment_id, Notification.recipient_type == "customer").first()
        assert c_notif is not None
        assert "confidence" not in c_notif.message.lower()
        assert "policy" not in c_notif.message.lower()
    finally:
        db.close()

    # 3. REST API Endpoint Verification
    res_api = client.get(f"/transactions/{payment_id}")
    assert res_api.status_code == 200
    api_data = res_api.json()
    assert api_data["customer_name"] == "Sam"
    assert api_data["customer_email"] == "sam@gmail.com"
    assert api_data["order_id"] == order_id
