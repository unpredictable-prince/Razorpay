import pytest
from agent.recovery_agent import RecoveryAgent


@pytest.fixture
def agent():
    return RecoveryAgent()


def test_agent_successful_payment(agent):
    tx = {
        "payment_id": "pay_test_001",
        "status": "captured",
        "failure_reason": None,
        "retry_count": 0,
    }
    result = agent.evaluate(tx)
    assert result["payment_id"] == "pay_test_001"
    assert result["decision"] == "no_action"
    assert result["recommended_action"] == "none"
    assert result["confidence"] == 1.0
    assert result["requires_human_review"] is False


def test_agent_recoverable_temporary_bank_failure(agent):
    tx = {
        "payment_id": "pay_test_002",
        "status": "failed",
        "failure_reason": "bank_server_down",
        "retry_count": 1,
    }
    result = agent.evaluate(tx)
    assert result["payment_id"] == "pay_test_002"
    assert result["decision"] == "attempt_recovery"
    assert result["recommended_action"] == "retry_later"
    assert result["confidence"] == 0.95
    assert result["requires_human_review"] is False


def test_agent_expired_card(agent):
    tx = {
        "payment_id": "pay_test_003",
        "status": "failed",
        "failure_reason": "card_expired",
        "retry_count": 0,
    }
    result = agent.evaluate(tx)
    assert result["payment_id"] == "pay_test_003"
    assert result["decision"] == "attempt_recovery"
    assert result["recommended_action"] == "update_payment_method"
    assert result["confidence"] == 0.95
    assert result["requires_human_review"] is False


def test_agent_too_many_retries(agent):
    tx = {
        "payment_id": "pay_test_004",
        "status": "failed",
        "failure_reason": "bank_server_down",
        "retry_count": 3,
    }
    result = agent.evaluate(tx)
    assert result["payment_id"] == "pay_test_004"
    assert result["decision"] == "escalate_to_human"
    assert result["recommended_action"] == "human_review"
    assert result["confidence"] == 0.85
    assert result["requires_human_review"] is True
