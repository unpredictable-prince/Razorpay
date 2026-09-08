import json
import pytest
from fastapi.testclient import TestClient
from api.index import app
from ecommerce.backend.app.database import SessionLocal
from ecommerce.backend.app.models import Order, Customer

client = TestClient(app)


def test_order_creation_and_persistence_flow():
    """Verify complete customer order creation and database persistence flow."""
    payload = {
        "customer_name": "Test User",
        "customer_email": "testuser@example.com",
        "customer_phone": "+919988776655",
        "shipping_address": "Flat 101, Test Residency, Bengaluru, KA 560001",
        "items": [
            {
                "product_id": 1,
                "name": "Aura Wireless Headphones",
                "price": 499900,
                "quantity": 2,
                "image": "https://example.com/item1.jpg",
            },
            {
                "product_id": 3,
                "name": "ErgoLift Mouse",
                "price": 149900,
                "quantity": 1,
                "image": "https://example.com/item2.jpg",
            },
        ],
    }

    # 1. Create order
    res = client.post("/api/orders", json=payload)
    assert res.status_code == 200, f"Order creation failed: {res.text}"
    order_data = res.json()

    assert "order_id" in order_data
    order_id = order_data["order_id"]
    assert order_id.startswith("ord_aura_")
    assert order_data["customer_name"] == "Test User"
    assert order_data["total_amount"] == (499900 * 2) + 149900  # ₹11,497.00
    assert order_data["payment_status"] == "pending"

    # 2. Verify direct database persistence
    db = SessionLocal()
    persisted_order = db.query(Order).filter(Order.order_id == order_id).first()
    assert persisted_order is not None
    assert persisted_order.customer_email == "testuser@example.com"
    assert persisted_order.total_amount == 1149700
    db.close()

    # 3. Retrieve order by ID
    res_get = client.get(f"/api/orders/{order_id}")
    assert res_get.status_code == 200
    assert res_get.json()["order_id"] == order_id

    # 4. Create Razorpay order
    res_rzp = client.post(
        "/api/payments/create-razorpay-order",
        json={"order_id": order_id},
    )
    assert res_rzp.status_code == 200
    rzp_data = res_rzp.json()
    assert "razorpay_order_id" in rzp_data
    assert rzp_data["amount"] == 1149700
