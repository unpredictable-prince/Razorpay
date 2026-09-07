import os
import sys
from typing import Any, Dict, Optional

# Threshold: ₹10,000 represented in paise (10,000 * 100 = 1,000,000 paise)
DEFAULT_MAX_RECOVERY_AMOUNT_PAISE = 1000000


class PolicyEngine:
    """
    Deterministic Guardrail Policy Engine.

    Serves as the ultimate authority for authorizing revenue recovery operations.
    Evaluates AI recommendations against strict business, financial, and compliance guardrails
    that CANNOT be overridden by an LLM or AI agent.
    """

    def __init__(self, max_amount_paise: int = DEFAULT_MAX_RECOVERY_AMOUNT_PAISE):
        self.max_amount_paise = max_amount_paise

    def evaluate(
        self,
        transaction: Any,
        recommendation: Dict[str, Any],
        retry_count: Optional[int] = None,
        failure_reason: Optional[str] = None,
        amount: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Evaluates a transaction and AI recommendation against policy rules.

        :param transaction: Transaction model instance or dictionary
        :param recommendation: AI/Agent recommendation dictionary
        :param retry_count: Optional override for retry count
        :param failure_reason: Optional override for failure reason
        :param amount: Optional override for transaction amount (in paise)
        :return: Dict containing:
                 - allowed (bool)
                 - decision (str): "approved" | "blocked" | "human_review"
                 - reason (str)
        """
        # Extract attributes from dictionary or object if not overridden
        if isinstance(transaction, dict):
            tx_status = transaction.get("status", "")
            tx_failure_reason = failure_reason if failure_reason is not None else transaction.get("failure_reason")
            tx_retry_count = retry_count if retry_count is not None else transaction.get("retry_count", 0)
            tx_amount = amount if amount is not None else transaction.get("amount", 0)
        else:
            tx_status = getattr(transaction, "status", "")
            tx_failure_reason = failure_reason if failure_reason is not None else getattr(transaction, "failure_reason", None)
            tx_retry_count = retry_count if retry_count is not None else getattr(transaction, "retry_count", 0)
            tx_amount = amount if amount is not None else getattr(transaction, "amount", 0)

        rec_action = recommendation.get("recommended_action", "")
        rec_decision = recommendation.get("decision", "")

        # Policy 1: Successful payments guardrail
        if tx_status != "failed":
            return {
                "allowed": False,
                "decision": "blocked",
                "reason": "Payment was captured successfully; recovery operations are strictly prohibited.",
            }

        # Policy 9: Financial Amount Safety Threshold (₹10,000 / 1,000,000 paise limit)
        if tx_amount > self.max_amount_paise:
            amount_inr = tx_amount / 100.0
            max_inr = self.max_amount_paise / 100.0
            return {
                "allowed": False,
                "decision": "human_review",
                "reason": f"Transaction amount (₹{amount_inr:,.2f}) exceeds automatic recovery limit (₹{max_inr:,.2f}). Human review required.",
            }

        # Policy 2: Maximum Retry Limit Guardrail
        if tx_retry_count >= 3:
            return {
                "allowed": False,
                "decision": "human_review",
                "reason": f"Maximum retry limit reached ({tx_retry_count} retries). Automatic retry blocked; requires manual review.",
            }

        # Policy 3: Customer Cancellation Guardrail
        if tx_failure_reason == "customer_cancelled":
            return {
                "allowed": False,
                "decision": "human_review",
                "reason": "Payment was explicitly cancelled by customer. Automatic retries prohibited.",
            }

        # Policy 4: Temporary Bank or Network Failures
        if tx_failure_reason in ("bank_server_down", "network_timeout"):
            if tx_retry_count < 3:
                return {
                    "allowed": True,
                    "decision": "approved",
                    "reason": f"Approved for automated retry: temporary infrastructure error '{tx_failure_reason}'.",
                }

        # Policy 5: Insufficient Funds Guardrail
        if tx_failure_reason == "insufficient_funds":
            if tx_retry_count >= 2:
                return {
                    "allowed": False,
                    "decision": "human_review",
                    "reason": f"Insufficient funds with retry_count={tx_retry_count}. Automatic retry blocked; requires human review.",
                }
            if rec_action == "customer_reengagement" or rec_decision == "reengage_customer":
                return {
                    "allowed": True,
                    "decision": "approved",
                    "reason": "Approved for customer re-engagement workflow.",
                }
            return {
                "allowed": False,
                "decision": "human_review",
                "reason": "Insufficient funds requires customer re-engagement rather than automated retries.",
            }

        # Policy 6: Expired Card Guardrail
        if tx_failure_reason == "card_expired":
            if rec_action == "update_payment_method":
                return {
                    "allowed": True,
                    "decision": "approved",
                    "reason": "Approved for customer payment method update request.",
                }
            return {
                "allowed": False,
                "decision": "blocked",
                "reason": "Card is expired. Direct automated retry blocked; payment method update required.",
            }

        # Policy 7: Authentication Failure or Payment Declined Guardrail
        if tx_failure_reason in ("authentication_failed", "payment_declined"):
            return {
                "allowed": False,
                "decision": "human_review",
                "reason": f"Security/declined risk trigger for '{tx_failure_reason}'. Requires human review.",
            }

        # Policy 8: Subscription or Recurring Mandate Failure
        if tx_failure_reason in ("recurring_mandate_failed", "subscription_mandate_failed"):
            if tx_retry_count < 3:
                return {
                    "allowed": True,
                    "decision": "approved",
                    "reason": f"Approved for subscription recovery workflow ({tx_failure_reason}).",
                }

        # Policy 10: Unknown or Unrecognized Failure Reason Guardrail
        return {
            "allowed": False,
            "decision": "human_review",
            "reason": f"Unrecognized failure reason '{tx_failure_reason}'. Automatic recovery blocked; requires human review.",
        }
