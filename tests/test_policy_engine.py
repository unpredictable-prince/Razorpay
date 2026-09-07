import pytest
from agent.policy_engine import PolicyEngine


@pytest.fixture
def policy_engine():
    return PolicyEngine(max_amount_paise=1000000)  # ₹10,000 limit in paise


def test_policy_successful_payment(policy_engine):
    tx = {
        "payment_id": "p1",
        "status": "captured",
        "failure_reason": None,
        "retry_count": 0,
        "amount": 50000,
    }
    rec = {"decision": "no_action", "recommended_action": "none"}
    res = policy_engine.evaluate(tx, rec)
    assert res["allowed"] is False
    assert res["decision"] == "blocked"
    assert "prohibited" in res["reason"].lower() or "captured" in res["reason"].lower()


def test_policy_temporary_failure_zero_retries(policy_engine):
    tx = {
        "payment_id": "p2",
        "status": "failed",
        "failure_reason": "bank_server_down",
        "retry_count": 0,
        "amount": 100000,
    }
    rec = {"decision": "attempt_recovery", "recommended_action": "retry_later"}
    res = policy_engine.evaluate(tx, rec)
    assert res["allowed"] is True
    assert res["decision"] == "approved"


def test_policy_temporary_failure_three_retries(policy_engine):
    tx = {
        "payment_id": "p3",
        "status": "failed",
        "failure_reason": "bank_server_down",
        "retry_count": 3,
        "amount": 100000,
    }
    rec = {"decision": "attempt_recovery", "recommended_action": "retry_later"}
    res = policy_engine.evaluate(tx, rec)
    assert res["allowed"] is False
    assert res["decision"] == "human_review"
    assert "retry limit" in res["reason"].lower() or "retries" in res["reason"].lower()


def test_policy_customer_cancellation(policy_engine):
    tx = {
        "payment_id": "p4",
        "status": "failed",
        "failure_reason": "customer_cancelled",
        "retry_count": 0,
        "amount": 50000,
    }
    rec = {"decision": "reengage_customer", "recommended_action": "customer_reengagement"}
    res = policy_engine.evaluate(tx, rec)
    assert res["allowed"] is False
    assert res["decision"] == "human_review"


def test_policy_insufficient_funds_zero_retries(policy_engine):
    tx = {
        "payment_id": "p5",
        "status": "failed",
        "failure_reason": "insufficient_funds",
        "retry_count": 0,
        "amount": 50000,
    }
    rec = {"decision": "reengage_customer", "recommended_action": "customer_reengagement"}
    res = policy_engine.evaluate(tx, rec)
    assert res["allowed"] is True
    assert res["decision"] == "approved"


def test_policy_insufficient_funds_two_retries(policy_engine):
    tx = {
        "payment_id": "p6",
        "status": "failed",
        "failure_reason": "insufficient_funds",
        "retry_count": 2,
        "amount": 50000,
    }
    rec = {"decision": "reengage_customer", "recommended_action": "customer_reengagement"}
    res = policy_engine.evaluate(tx, rec)
    assert res["allowed"] is False
    assert res["decision"] == "human_review"


def test_policy_expired_card(policy_engine):
    tx = {
        "payment_id": "p7",
        "status": "failed",
        "failure_reason": "card_expired",
        "retry_count": 1,
        "amount": 50000,
    }

    # Case A: AI tries direct automated retry => BLOCKED
    rec_retry = {"decision": "attempt_recovery", "recommended_action": "retry_later"}
    res_retry = policy_engine.evaluate(tx, rec_retry)
    assert res_retry["allowed"] is False
    assert res_retry["decision"] == "blocked"

    # Case B: AI requests update_payment_method => APPROVED
    rec_update = {"decision": "attempt_recovery", "recommended_action": "update_payment_method"}
    res_update = policy_engine.evaluate(tx, rec_update)
    assert res_update["allowed"] is True
    assert res_update["decision"] == "approved"


def test_policy_high_amount_above_threshold(policy_engine):
    # ₹15,000 = 1,500,000 paise (exceeds ₹10,000 threshold)
    tx = {
        "payment_id": "p8",
        "status": "failed",
        "failure_reason": "bank_server_down",
        "retry_count": 0,
        "amount": 1500000,
    }
    rec = {"decision": "attempt_recovery", "recommended_action": "retry_later"}
    res = policy_engine.evaluate(tx, rec)
    assert res["allowed"] is False
    assert res["decision"] == "human_review"
    assert "exceeds" in res["reason"].lower() or "limit" in res["reason"].lower()


def test_policy_unknown_failure_reason(policy_engine):
    tx = {
        "payment_id": "p9",
        "status": "failed",
        "failure_reason": "unknown_anomaly_error",
        "retry_count": 0,
        "amount": 50000,
    }
    rec = {"decision": "attempt_recovery", "recommended_action": "retry_later"}
    res = policy_engine.evaluate(tx, rec)
    assert res["allowed"] is False
    assert res["decision"] == "human_review"


def test_policy_subscription_failure(policy_engine):
    tx = {
        "payment_id": "p10",
        "status": "failed",
        "failure_reason": "recurring_mandate_failed",
        "retry_count": 1,
        "amount": 299900,
    }
    rec = {"decision": "attempt_recovery", "recommended_action": "subscription_recovery"}
    res = policy_engine.evaluate(tx, rec)
    assert res["allowed"] is True
    assert res["decision"] == "approved"


def test_policy_payment_declined_with_many_retries(policy_engine):
    tx = {
        "payment_id": "p11",
        "status": "failed",
        "failure_reason": "payment_declined",
        "retry_count": 3,
        "amount": 50000,
    }
    rec = {"decision": "attempt_recovery", "recommended_action": "retry_later"}
    res = policy_engine.evaluate(tx, rec)
    assert res["allowed"] is False
    assert res["decision"] == "human_review"
