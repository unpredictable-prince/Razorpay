import os
import pytest
from agent.llm_service import BaseLLMProvider, GeminiLLMProvider, LLMService
from agent.recovery_agent import RecoveryAgent


class MockLLMProvider(BaseLLMProvider):
    """Mock LLM Provider that returns pre-configured responses without making network requests."""

    def __init__(self, mock_response: str):
        self.mock_response = mock_response
        self.last_prompt = None

    def generate_recommendation(self, prompt: str) -> str:
        self.last_prompt = prompt
        return self.mock_response


def test_llm_service_valid_recommendation():
    mock_json = """{
      "decision": "recoverable",
      "reason": "Temporary network timeout detected with low retry count.",
      "recommended_action": "retry_later",
      "confidence": 0.92,
      "requires_human_review": false
    }"""
    provider = MockLLMProvider(mock_json)
    service = LLMService(provider=provider)

    tx = {
        "payment_id": "pay_mock_001",
        "status": "failed",
        "failure_reason": "network_timeout",
        "retry_count": 1,
        "amount": 29900,
    }
    result = service.analyze_transaction(tx)

    assert result["decision"] == "recoverable"
    assert result["reason"] == "Temporary network timeout detected with low retry count."
    assert result["recommended_action"] == "retry_later"
    assert result["confidence"] == 0.92
    assert result["requires_human_review"] is False


def test_agent_with_mocked_llm_service():
    mock_json = """{
      "decision": "human_review",
      "reason": "Authentication failure with multiple retries.",
      "recommended_action": "human_review",
      "confidence": 0.85,
      "requires_human_review": true
    }"""
    provider = MockLLMProvider(mock_json)
    service = LLMService(provider=provider)
    agent = RecoveryAgent(use_llm=True, llm_service=service)

    tx = {
        "payment_id": "pay_mock_002",
        "status": "failed",
        "failure_reason": "authentication_failed",
        "retry_count": 3,
    }
    result = agent.evaluate(tx)

    assert result["payment_id"] == "pay_mock_002"
    assert result["decision"] == "human_review"
    assert result["recommended_action"] == "human_review"
    assert result["confidence"] == 0.85
    assert result["requires_human_review"] is True


def test_llm_service_missing_api_key(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("LLM_API_KEY", raising=False)

    provider = GeminiLLMProvider(api_key=None)
    with pytest.raises(ValueError, match="LLM API key not found"):
        provider.generate_recommendation("Sample prompt")


def test_llm_service_invalid_json():
    provider = MockLLMProvider("Not a valid JSON response from LLM")
    service = LLMService(provider=provider)

    tx = {"payment_id": "pay_mock_003", "status": "failed"}
    with pytest.raises(ValueError, match="Failed to parse LLM response as JSON"):
        service.analyze_transaction(tx)


def test_llm_service_missing_required_schema_field():
    incomplete_json = """{
      "decision": "recoverable",
      "reason": "Missing recommended_action field"
    }"""
    provider = MockLLMProvider(incomplete_json)
    service = LLMService(provider=provider)

    tx = {"payment_id": "pay_mock_004", "status": "failed"}
    with pytest.raises(ValueError, match="Missing required field"):
        service.analyze_transaction(tx)
