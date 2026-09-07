import pytest
from agent.tools import get_customer_history, get_customer_summary, get_transaction
from app.database import SessionLocal, init_db
from app.models import Transaction
from database.seed import seed_database


@pytest.fixture(autouse=True)
def setup_db():
    init_db()
    db = SessionLocal()
    if db.query(Transaction).count() == 0:
        seed_database()

    # Ensure a customer with multiple transactions exists for testing
    existing = db.query(Transaction).filter(Transaction.customer_id == "cust_multi_test").all()
    if not existing:
        tx1 = Transaction(
            payment_id="pay_multi_001",
            customer_id="cust_multi_test",
            amount=50000,
            currency="INR",
            status="captured",
            failure_reason=None,
            retry_count=0,
            recovery_status="not_required",
        )
        tx2 = Transaction(
            payment_id="pay_multi_002",
            customer_id="cust_multi_test",
            amount=25000,
            currency="INR",
            status="failed",
            failure_reason="bank_server_down",
            retry_count=1,
            recovery_status="pending",
        )
        db.add_all([tx1, tx2])
        db.commit()

    db.close()


def test_get_existing_transaction():
    result = get_transaction("pay_rec_001")
    assert result["found"] is True
    assert result["payment_id"] == "pay_rec_001"
    assert result["customer_id"] == "cust_101"
    assert result["amount"] == 49900
    assert result["status"] == "captured"
    assert result["failure_reason"] is None


def test_get_missing_transaction():
    result = get_transaction("pay_non_existent_999")
    assert result["found"] is False
    assert "not found" in result["error"]


def test_get_customer_history_with_records():
    history = get_customer_history("cust_multi_test")
    assert isinstance(history, list)
    assert len(history) == 2
    payment_ids = [tx["payment_id"] for tx in history]
    assert "pay_multi_001" in payment_ids
    assert "pay_multi_002" in payment_ids


def test_get_customer_history_no_records():
    history = get_customer_history("cust_unknown_999")
    assert isinstance(history, list)
    assert len(history) == 0


def test_get_customer_summary_calculations():
    # cust_multi_test has 1 captured (50000) and 1 failed (25000) transaction
    summary = get_customer_summary("cust_multi_test")
    assert summary["customer_id"] == "cust_multi_test"
    assert summary["total_transactions"] == 2
    assert summary["successful_transactions"] == 1
    assert summary["failed_transactions"] == 1
    assert summary["total_successful_amount"] == 50000
    assert summary["latest_transaction_status"] in ("captured", "failed")


def test_get_customer_summary_no_history():
    summary = get_customer_summary("cust_empty_999")
    assert summary["customer_id"] == "cust_empty_999"
    assert summary["total_transactions"] == 0
    assert summary["successful_transactions"] == 0
    assert summary["failed_transactions"] == 0
    assert summary["total_successful_amount"] == 0
    assert summary["latest_transaction_status"] is None
