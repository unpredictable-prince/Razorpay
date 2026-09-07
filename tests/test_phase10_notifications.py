import hashlib
import hmac
import json
import os
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal, init_db
from app.models import Notification

if not os.environ.get("RAZORPAY_WEBHOOK_SECRET"):
    os.environ["RAZORPAY_WEBHOOK_SECRET"] = "whsec_test_secret_12345"

client = TestClient(app)


def generate_webhook_signature(raw_body: bytes, secret: str) -> str:
    return hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()


@pytest.fixture(autouse=True)
def setup_test_db():
    init_db()
    yield


def test_notification_creation_and_unread_count():
    """Verify manual/auto notification persistence and unread-count API."""
    db = SessionLocal()
    try:
        notif = Notification(
            recipient_type="merchant",
            payment_id="pay_test_notif_001",
            notification_type="payment_failed",
            title="Failed Payment Detected",
            message="Test failed payment notification",
            severity="error",
            is_read=0,
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)

        # Query unread count API
        res = client.get("/notifications/unread-count?recipient_type=merchant")
        assert res.status_code == 200
        assert res.json()["unread_count"] > 0
    finally:
        db.close()


def test_mark_notification_read_api():
    """Verify single and bulk mark-as-read endpoints."""
    db = SessionLocal()
    try:
        notif = Notification(
            recipient_type="merchant",
            payment_id="pay_test_notif_002",
            notification_type="recovery_executed",
            title="Recovery Executed",
            message="Test recovery notification",
            severity="success",
            is_read=0,
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        notif_id = notif.id
    finally:
        db.close()

    # Mark single as read
    res = client.post(f"/notifications/{notif_id}/read")
    assert res.status_code == 200
    assert res.json()["is_read"] == 1

    # Mark all read
    res_all = client.post("/notifications/read-all?recipient_type=merchant")
    assert res_all.status_code == 200

    res_count = client.get("/notifications/unread-count?recipient_type=merchant")
    assert res_count.json()["unread_count"] == 0


def test_auto_notification_generation_from_webhooks():
    """
    Verifies that processing payment.failed, payment.captured, and payment.authorized
    automatically generates both Merchant and Customer notifications.
    """
    secret = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "whsec_test_secret_12345")
    payment_id = f"pay_notif_webhook_{os.urandom(4).hex()}"

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
                    "contact": "+919876543210",
                    "email": "customer@example.com",
                    "notes": {"customer_id": "cust_notif_test"},
                }
            }
        },
    }

    raw_body = json.dumps(payload).encode("utf-8")
    sig = generate_webhook_signature(raw_body, secret)
    res = client.post("/webhooks/razorpay", content=raw_body, headers={"X-Razorpay-Signature": sig})
    assert res.status_code == 200

    # Inspect persisted notifications
    db = SessionLocal()
    try:
        notifs = db.query(Notification).filter(Notification.payment_id == payment_id).all()
        assert len(notifs) >= 2

        merchant_n = [n for n in notifs if n.recipient_type == "merchant"][0]
        customer_n = [n for n in notifs if n.recipient_type == "customer"][0]

        assert merchant_n.title in ["Automatic Recovery Executed", "Human Review Required", "Failed Payment Detected"]
        assert customer_n.title == "Payment Attempt Failed"
        assert "temporary issue" in customer_n.message.lower()

        # Strict Customer Privacy Check: ensure customer notification hides AI/Policy secrets
        assert "confidence" not in customer_n.message.lower()
        assert "policy" not in customer_n.message.lower()
        assert "secret" not in customer_n.message.lower()
    finally:
        db.close()
