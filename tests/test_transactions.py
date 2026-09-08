import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, init_db
from app.models import Transaction


client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    init_db()
    db = SessionLocal()
    if db.query(Transaction).count() == 0:
        from database.seed import seed_database
        seed_database()
    db.close()


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["message"] == "RecoverAI backend is running"


def test_get_all_transactions():
    response = client.get("/transactions/")
    assert response.status_code == 200
    transactions = response.json()
    assert isinstance(transactions, list)
    assert len(transactions) >= 10


def test_get_failed_transactions():
    response = client.get("/transactions/failed")
    assert response.status_code == 200
    failed_txs = response.json()
    assert isinstance(failed_txs, list)
    assert len(failed_txs) >= 5
    assert all(tx["status"] == "failed" for tx in failed_txs)


def test_get_transaction_by_payment_id():
    response = client.get("/transactions/pay_rec_001")
    assert response.status_code == 200
    tx = response.json()
    assert tx["payment_id"] == "pay_rec_001"
    assert tx["customer_id"] == "cust_101"


def test_get_transaction_not_found():
    response = client.get("/transactions/non_existent_payment_id")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]


def test_get_transaction_stats():
    response = client.get("/transactions/stats")
    assert response.status_code == 200
    stats = response.json()
    assert "total_transactions" in stats
    assert "failed_payments" in stats
    assert "captured_payments" in stats
    assert "failed_revenue" in stats
    assert "recovered_revenue" in stats
    assert "recovery_rate" in stats
    assert "pending_recovery" in stats
    assert "human_review_required" in stats
    assert stats["total_transactions"] >= 10


def test_delete_transaction():
    # Create or ensure a test transaction exists
    db = SessionLocal()
    test_tx = Transaction(
        payment_id="pay_test_del_999",
        order_id="order_test_del_999",
        customer_id="cust_del_999",
        customer_name="Delete Test User",
        customer_email="del@example.com",
        customer_phone="+919999999999",
        amount=150000,
        currency="INR",
        status="failed",
        failure_reason="test_error",
        retry_count=0,
        recovery_status="not_required",
    )
    db.add(test_tx)
    db.commit()
    db.close()

    # Call DELETE /transactions/{payment_id}
    res = client.delete("/transactions/pay_test_del_999")
    assert res.status_code == 200
    assert res.json()["status"] == "success"

    # Verify 404 on subsequent get
    res_get = client.get("/transactions/pay_test_del_999")
    assert res_get.status_code == 404


def test_delete_customer_data():
    db = SessionLocal()
    test_tx1 = Transaction(
        payment_id="pay_cust_del_1",
        order_id="order_cust_del_1",
        customer_id="cust_multi_del",
        amount=10000,
        status="captured",
        recovery_status="not_required",
    )
    test_tx2 = Transaction(
        payment_id="pay_cust_del_2",
        order_id="order_cust_del_2",
        customer_id="cust_multi_del",
        amount=20000,
        status="failed",
        recovery_status="not_required",
    )
    db.add_all([test_tx1, test_tx2])
    db.commit()
    db.close()

    # Call DELETE /transactions/customer/{customer_id}
    res = client.delete("/transactions/customer/cust_multi_del")
    assert res.status_code == 200
    assert "Deleted 2 records" in res.json()["message"]


