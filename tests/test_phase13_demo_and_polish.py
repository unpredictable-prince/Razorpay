import os
# pyrefly: ignore [missing-import]
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal, init_db
from app.models import Notification, Transaction

if not os.environ.get("RAZORPAY_WEBHOOK_SECRET"):
    os.environ["RAZORPAY_WEBHOOK_SECRET"] = "whsec_test_secret_12345"

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_test_db():
    init_db()
    yield


def test_demo_simulate_endpoint():
    """Verifies that /demo/simulate processes controlled test scenarios through the actual pipeline."""
    response = client.post(
        "/demo/simulate",
        json={
            "scenario": "bank_server_down",
            "customer_name": "Sam",
            "customer_email": "sam@gmail.com",
            "customer_phone": "9876543210",
            "amount": 299900,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["demo_scenario"] == "bank_server_down"
    assert data["customer_name"] == "Sam"
    assert data["webhook_result"]["pipeline_executed"] is True


def test_customer_journey_endpoint():
    """Verifies that GET /transactions/customer/{id} returns complete customer timeline & profile."""
    # First ensure a transaction exists for customer Sam
    client.post(
        "/demo/simulate",
        json={
            "scenario": "bank_server_down",
            "customer_name": "Sam",
            "customer_email": "sam@gmail.com",
            "customer_phone": "9876543210",
            "amount": 299900,
        },
    )

    response = client.get("/transactions/customer/Sam")
    assert response.status_code == 200
    data = response.json()
    assert data["customer_name"] == "Sam"
    assert "total_orders" in data
    assert "failed_attempts" in data
    assert "timeline" in data
    assert len(data["timeline"]) >= 1


def test_demo_reset_endpoint():
    """Verifies that /demo/reset cleanly clears demo records without corrupting DB schema."""
    # Simulate a demo event
    client.post(
        "/demo/simulate",
        json={
            "scenario": "bank_server_down",
            "customer_name": "Sam",
            "customer_email": "sam@gmail.com",
            "customer_phone": "9876543210",
            "amount": 299900,
        },
    )

    # Perform Reset
    response = client.post("/demo/reset")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

    db = SessionLocal()
    try:
        demo_txs = db.query(Transaction).filter(Transaction.payment_id.like("pay_demo_%")).all()
        assert len(demo_txs) == 0
    finally:
        db.close()
