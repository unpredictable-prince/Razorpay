import pytest
from agent.policy_engine import PolicyEngine
from app.services.recovery_service import RecoveryService


@pytest.fixture
def recovery_service():
    return RecoveryService()


@pytest.fixture
def policy_engine():
    return PolicyEngine(max_amount_paise=1000000)


def test_approved_retry_action(recovery_service, policy_engine):
    tx = {
        "payment_id": "pay_test_001",
        "status": "failed",
        "failure_reason": "bank_server_down",
        "retry_count": 0,
        "amount": 49900,
    }
    policy = policy_engine.evaluate(tx, {"recommended_action": "retry_later"})
    assert policy["allowed"] is True

    result = recovery_service.execute_recovery_action(tx, policy, "retry_payment")
    assert result["payment_id"] == "pay_test_001"
    assert result["action"] == "retry_payment"
    assert result["status"] == "executed"
    assert result["recovered_amount"] == 49900
    assert "executed" in result["message"].lower() or "succeeded" in result["message"].lower()


def test_blocked_retry_action(recovery_service, policy_engine):
    tx = {
        "payment_id": "pay_test_002",
        "status": "failed",
        "failure_reason": "bank_server_down",
        "retry_count": 3,
        "amount": 49900,
    }
    policy = policy_engine.evaluate(tx, {"recommended_action": "retry_later"})
    assert policy["allowed"] is False

    result = recovery_service.execute_recovery_action(tx, policy, "retry_payment")
    assert result["payment_id"] == "pay_test_002"
    assert result["status"] in ("blocked", "human_review")
    assert result["recovered_amount"] == 0
    assert "blocked by policy" in result["message"].lower()


def test_expired_card_payment_method_update_flow(recovery_service, policy_engine):
    tx = {
        "payment_id": "pay_test_003",
        "status": "failed",
        "failure_reason": "card_expired",
        "retry_count": 1,
        "amount": 99900,
    }
    policy = policy_engine.evaluate(tx, {"recommended_action": "update_payment_method"})
    assert policy["allowed"] is True

    result = recovery_service.execute_recovery_action(tx, policy, "request_payment_method_update")
    assert result["payment_id"] == "pay_test_003"
    assert result["action"] == "request_payment_method_update"
    assert result["status"] == "executed"
    assert result["recovered_amount"] == 0
    assert "dispatched" in result["message"].lower() or "update" in result["message"].lower()


def test_customer_reengagement_flow(recovery_service, policy_engine):
    tx = {
        "payment_id": "pay_test_004",
        "status": "failed",
        "failure_reason": "insufficient_funds",
        "retry_count": 0,
        "amount": 49900,
    }
    policy = policy_engine.evaluate(tx, {"recommended_action": "customer_reengagement"})
    assert policy["allowed"] is True

    result = recovery_service.execute_recovery_action(tx, policy, "customer_reengagement")
    assert result["payment_id"] == "pay_test_004"
    assert result["action"] == "customer_reengagement"
    assert result["status"] == "executed"
    assert result["recovered_amount"] == 0


def test_subscription_recovery_flow(recovery_service, policy_engine):
    tx = {
        "payment_id": "pay_test_005",
        "status": "failed",
        "failure_reason": "recurring_mandate_failed",
        "retry_count": 1,
        "amount": 299900,
    }
    policy = policy_engine.evaluate(tx, {"recommended_action": "subscription_recovery"})
    assert policy["allowed"] is True

    result = recovery_service.execute_recovery_action(tx, policy, "subscription_recovery")
    assert result["payment_id"] == "pay_test_005"
    assert result["action"] == "subscription_recovery"
    assert result["status"] == "executed"
    assert result["recovered_amount"] == 299900


def test_human_review_flow(recovery_service, policy_engine):
    tx = {
        "payment_id": "pay_test_006",
        "status": "failed",
        "failure_reason": "authentication_failed",
        "retry_count": 1,
        "amount": 49900,
    }
    policy = policy_engine.evaluate(tx, {"recommended_action": "human_review"})
    assert policy["allowed"] is False
    assert policy["decision"] == "human_review"

    result = recovery_service.execute_recovery_action(tx, policy, "human_review")
    assert result["payment_id"] == "pay_test_006"
    assert result["status"] == "human_review"
    assert result["recovered_amount"] == 0


def test_prevention_of_execution_unapproved_policy(recovery_service):
    tx = {
        "payment_id": "pay_test_007",
        "status": "failed",
        "failure_reason": "bank_server_down",
        "retry_count": 0,
        "amount": 50000,
    }
    unapproved_policy = {
        "allowed": False,
        "decision": "blocked",
        "reason": "Explicit policy rejection test.",
    }

    result = recovery_service.execute_recovery_action(tx, unapproved_policy, "retry_payment")
    assert result["status"] == "blocked"
    assert result["recovered_amount"] == 0
    assert "blocked by policy" in result["message"].lower()
