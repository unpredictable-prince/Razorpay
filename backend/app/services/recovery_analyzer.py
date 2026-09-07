from typing import Any, Dict


def analyze_transaction_recovery(transaction: Any) -> Dict[str, Any]:
    """
    Analyzes a transaction using deterministic rule-based logic
    to determine recovery potential, risk level, and recommended action.

    :param transaction: Transaction object (SQLAlchemy model, Pydantic schema, or dict)
    :return: Dictionary containing structured recovery analysis:
             - payment_id (str)
             - is_failed (bool)
             - potentially_recoverable (bool)
             - risk_level (str)
             - reason (str)
             - recommended_action (str)
    """
    # Extract attributes whether transaction is a dict or object instance
    if isinstance(transaction, dict):
        payment_id = transaction.get("payment_id", "")
        status = transaction.get("status", "")
        failure_reason = transaction.get("failure_reason")
        retry_count = transaction.get("retry_count", 0)
    else:
        payment_id = getattr(transaction, "payment_id", "")
        status = getattr(transaction, "status", "")
        failure_reason = getattr(transaction, "failure_reason", None)
        retry_count = getattr(transaction, "retry_count", 0)

    is_failed = status == "failed"

    # Rule 1: Non-failed payments
    if not is_failed:
        return {
            "payment_id": payment_id,
            "is_failed": False,
            "potentially_recoverable": False,
            "risk_level": "none",
            "reason": "Payment was captured successfully; recovery not required.",
            "recommended_action": "none",
        }

    # Rule 5: High retry count (retry_count >= 3)
    if retry_count >= 3:
        return {
            "payment_id": payment_id,
            "is_failed": True,
            "potentially_recoverable": False,
            "risk_level": "high",
            "reason": f"Transaction exceeded maximum retry limit ({retry_count} retries).",
            "recommended_action": "human_review",
        }

    # Rule 2: Temporary bank or network errors
    if failure_reason in ("bank_server_down", "network_timeout"):
        return {
            "payment_id": payment_id,
            "is_failed": True,
            "potentially_recoverable": True,
            "risk_level": "medium",
            "reason": f"Temporary system/bank error: {failure_reason}.",
            "recommended_action": "retry_later",
        }

    # Rule 3: Expired card
    if failure_reason == "card_expired":
        return {
            "payment_id": payment_id,
            "is_failed": True,
            "potentially_recoverable": True,
            "risk_level": "medium",
            "reason": "Card or payment method has expired.",
            "recommended_action": "update_payment_method",
        }

    # Rule 4: Customer cancellation
    if failure_reason == "customer_cancelled":
        return {
            "payment_id": payment_id,
            "is_failed": True,
            "potentially_recoverable": False,
            "risk_level": "low",
            "reason": "Customer manually cancelled the transaction.",
            "recommended_action": "customer_reengagement",
        }

    # Rule 6: Insufficient funds
    if failure_reason == "insufficient_funds":
        return {
            "payment_id": payment_id,
            "is_failed": True,
            "potentially_recoverable": retry_count < 2,
            "risk_level": "medium",
            "reason": "Customer account has insufficient funds.",
            "recommended_action": "customer_reengagement",
        }

    # Rule 7: Authentication failure or payment decline
    if failure_reason in ("authentication_failed", "payment_declined"):
        return {
            "payment_id": payment_id,
            "is_failed": True,
            "potentially_recoverable": False,
            "risk_level": "medium",
            "reason": f"Authentication failure or decline: {failure_reason}.",
            "recommended_action": "human_review",
        }

    # Rule 8: Subscription or recurring mandate failure
    if failure_reason in ("recurring_mandate_failed", "subscription_mandate_failed"):
        return {
            "payment_id": payment_id,
            "is_failed": True,
            "potentially_recoverable": True,
            "risk_level": "medium",
            "reason": f"Subscription mandate failed: {failure_reason}.",
            "recommended_action": "subscription_recovery",
        }

    # Default fallback for unknown failure reasons
    return {
        "payment_id": payment_id,
        "is_failed": True,
        "potentially_recoverable": False,
        "risk_level": "high",
        "reason": f"Unrecognized failure reason: {failure_reason}.",
        "recommended_action": "human_review",
    }
