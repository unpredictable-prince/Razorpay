import json
import os
import sys

# Ensure workspace root and backend directories are in sys.path
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
backend_dir = os.path.join(root_dir, "backend")
for path in [root_dir, backend_dir]:
    if path not in sys.path:
        sys.path.insert(0, path)

from agent.llm_service import BaseLLMProvider, LLMService
from agent.policy_engine import PolicyEngine
from agent.recovery_agent import RecoveryAgent
from app.services.recovery_analyzer import analyze_transaction_recovery
from app.services.recovery_service import RecoveryService


class SafeMockLLMProvider(BaseLLMProvider):
    """
    Mock LLM Provider for safe local testing without API keys or real network calls.
    Returns realistic structured JSON recommendations.
    """

    def generate_recommendation(self, prompt: str) -> str:
        # Inspect prompt to return appropriate mock LLM response
        if "bank_server_down" in prompt or "network_timeout" in prompt:
            return json.dumps({
                "decision": "recoverable",
                "reason": "Temporary infrastructure failure detected; zero retry attempts recorded.",
                "recommended_action": "retry_later",
                "confidence": 0.95,
                "requires_human_review": False,
            })
        elif "card_expired" in prompt:
            return json.dumps({
                "decision": "recoverable",
                "reason": "Payment method has expired; customer must update card details.",
                "recommended_action": "update_payment_method",
                "confidence": 0.92,
                "requires_human_review": False,
            })
        elif "insufficient_funds" in prompt:
            return json.dumps({
                "decision": "reengage_customer",
                "reason": "Account has insufficient funds; sending re-engagement notification.",
                "recommended_action": "customer_reengagement",
                "confidence": 0.88,
                "requires_human_review": False,
            })
        else:
            return json.dumps({
                "decision": "human_review",
                "reason": "High risk or complex failure pattern detected.",
                "recommended_action": "human_review",
                "confidence": 0.85,
                "requires_human_review": True,
            })


def run_manual_recovery_pipeline(transaction: dict):
    """
    Executes a transaction through all RecoverAI stages in sequential order:
    1. Recovery Analyzer
    2. Recovery Agent
    3. Policy Engine
    4. Recovery Service
    """
    print("\n" + "=" * 50)
    print("=== INPUT TRANSACTION ===")
    print("=" * 50)
    print(f"Payment ID       : {transaction.get('payment_id')}")
    print(f"Customer ID      : {transaction.get('customer_id')}")
    print(f"Amount           : ₹{transaction.get('amount', 0) / 100:,.2f} ({transaction.get('amount')} paise)")
    print(f"Currency         : {transaction.get('currency', 'INR')}")
    print(f"Status           : {transaction.get('status')}")
    print(f"Failure Reason   : {transaction.get('failure_reason')}")
    print(f"Retry Count      : {transaction.get('retry_count')}")
    print(f"Recovery Status  : {transaction.get('recovery_status')}")

    # Stage 1: Recovery Analyzer
    print("\n" + "=" * 50)
    print("=== RECOVERY ANALYZER ===")
    print("=" * 50)
    analyzer_result = analyze_transaction_recovery(transaction)
    print(json.dumps(analyzer_result, indent=2))

    # Stage 2: AI Recovery Agent
    print("\n" + "=" * 50)
    print("=== AI AGENT ===")
    print("=" * 50)
    mock_provider = SafeMockLLMProvider()
    llm_service = LLMService(provider=mock_provider)
    agent = RecoveryAgent(use_llm=True, llm_service=llm_service)
    agent_result = agent.evaluate(transaction)
    print(json.dumps(agent_result, indent=2))

    # Stage 3: Policy Engine
    print("\n" + "=" * 50)
    print("=== POLICY ENGINE ===")
    print("=" * 50)
    policy_engine = PolicyEngine(max_amount_paise=1000000)  # ₹10,000 limit
    policy_result = policy_engine.evaluate(transaction, agent_result)
    print(json.dumps(policy_result, indent=2))

    # Stage 4: Recovery Service Execution
    print("\n" + "=" * 50)
    print("=== RECOVERY SERVICE ===")
    print("=" * 50)
    recovery_service = RecoveryService()
    service_result = recovery_service.execute_recovery_action(
        transaction=transaction,
        policy_evaluation=policy_result,
        recommended_action=agent_result.get("recommended_action", "retry_payment"),
        db=None,  # No DB mutation for manual test script
    )
    print(json.dumps(service_result, indent=2))

    # Stage 5: Final Result Summary
    print("\n" + "=" * 50)
    print("=== FINAL RESULT ===")
    print("=" * 50)
    print(f"Payment ID       : {service_result.get('payment_id')}")
    print(f"Executed Action  : {service_result.get('action')}")
    print(f"Execution Status : {service_result.get('status')}")
    print(f"Policy Allowed   : {policy_result.get('allowed')}")
    print(f"Policy Decision  : {policy_result.get('decision')}")
    print(f"Recovered Amount : ₹{service_result.get('recovered_amount', 0) / 100:,.2f}")
    print(f"Message          : {service_result.get('message')}")
    print("=" * 50 + "\n")


if __name__ == "__main__":
    # Test Case 1: Temporary bank failure with 0 retries (₹2,000 = 200,000 paise)
    test_transaction_1 = {
        "payment_id": "TEST001",
        "customer_id": "CUSTOMER001",
        "amount": 200000,  # ₹2,000 in paise
        "currency": "INR",
        "status": "failed",
        "failure_reason": "bank_server_down",
        "retry_count": 0,
        "recovery_status": "pending",
    }

    run_manual_recovery_pipeline(test_transaction_1)
