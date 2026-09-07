import pytest
from app.services.recovery_analyzer import analyze_transaction_recovery


def test_successful_payment():
    tx = {
        "payment_id": "pay_001",
        "status": "captured",
        "failure_reason": None,
        "retry_count": 0,
    }
    analysis = analyze_transaction_recovery(tx)
    assert analysis["payment_id"] == "pay_001"
    assert analysis["is_failed"] is False
    assert analysis["potentially_recoverable"] is False
    assert analysis["risk_level"] == "none"
    assert analysis["recommended_action"] == "none"


def test_temporary_bank_failure():
    tx1 = {
        "payment_id": "pay_002",
        "status": "failed",
        "failure_reason": "bank_server_down",
        "retry_count": 1,
    }
    analysis1 = analyze_transaction_recovery(tx1)
    assert analysis1["is_failed"] is True
    assert analysis1["potentially_recoverable"] is True
    assert analysis1["risk_level"] == "medium"
    assert analysis1["recommended_action"] == "retry_later"

    tx2 = {
        "payment_id": "pay_003",
        "status": "failed",
        "failure_reason": "network_timeout",
        "retry_count": 2,
    }
    analysis2 = analyze_transaction_recovery(tx2)
    assert analysis2["is_failed"] is True
    assert analysis2["potentially_recoverable"] is True
    assert analysis2["risk_level"] == "medium"
    assert analysis2["recommended_action"] == "retry_later"


def test_expired_card():
    tx = {
        "payment_id": "pay_004",
        "status": "failed",
        "failure_reason": "card_expired",
        "retry_count": 1,
    }
    analysis = analyze_transaction_recovery(tx)
    assert analysis["is_failed"] is True
    assert analysis["potentially_recoverable"] is True
    assert analysis["risk_level"] == "medium"
    assert analysis["recommended_action"] == "update_payment_method"


def test_customer_cancellation():
    tx = {
        "payment_id": "pay_005",
        "status": "failed",
        "failure_reason": "customer_cancelled",
        "retry_count": 0,
    }
    analysis = analyze_transaction_recovery(tx)
    assert analysis["is_failed"] is True
    assert analysis["potentially_recoverable"] is False
    assert analysis["risk_level"] == "low"
    assert analysis["recommended_action"] == "customer_reengagement"


def test_insufficient_funds():
    # retry_count < 2 => potentially_recoverable = True
    tx_rec = {
        "payment_id": "pay_006",
        "status": "failed",
        "failure_reason": "insufficient_funds",
        "retry_count": 1,
    }
    analysis_rec = analyze_transaction_recovery(tx_rec)
    assert analysis_rec["is_failed"] is True
    assert analysis_rec["potentially_recoverable"] is True
    assert analysis_rec["risk_level"] == "medium"
    assert analysis_rec["recommended_action"] == "customer_reengagement"

    # retry_count == 2 => potentially_recoverable = False
    tx_unrec = {
        "payment_id": "pay_007",
        "status": "failed",
        "failure_reason": "insufficient_funds",
        "retry_count": 2,
    }
    analysis_unrec = analyze_transaction_recovery(tx_unrec)
    assert analysis_unrec["is_failed"] is True
    assert analysis_unrec["potentially_recoverable"] is False
    assert analysis_unrec["risk_level"] == "medium"
    assert analysis_unrec["recommended_action"] == "customer_reengagement"


def test_too_many_retries():
    tx = {
        "payment_id": "pay_008",
        "status": "failed",
        "failure_reason": "bank_server_down",
        "retry_count": 3,
    }
    analysis = analyze_transaction_recovery(tx)
    assert analysis["is_failed"] is True
    assert analysis["potentially_recoverable"] is False
    assert analysis["risk_level"] == "high"
    assert analysis["recommended_action"] == "human_review"


def test_subscription_failure():
    tx = {
        "payment_id": "pay_009",
        "status": "failed",
        "failure_reason": "recurring_mandate_failed",
        "retry_count": 1,
    }
    analysis = analyze_transaction_recovery(tx)
    assert analysis["is_failed"] is True
    assert analysis["potentially_recoverable"] is True
    assert analysis["risk_level"] == "medium"
    assert analysis["recommended_action"] == "subscription_recovery"


def test_authentication_failed_and_declined():
    tx_auth = {
        "payment_id": "pay_010",
        "status": "failed",
        "failure_reason": "authentication_failed",
        "retry_count": 1,
    }
    analysis_auth = analyze_transaction_recovery(tx_auth)
    assert analysis_auth["is_failed"] is True
    assert analysis_auth["potentially_recoverable"] is False
    assert analysis_auth["risk_level"] == "medium"
    assert analysis_auth["recommended_action"] == "human_review"
