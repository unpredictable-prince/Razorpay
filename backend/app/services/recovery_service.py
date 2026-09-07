import os
import sys
from typing import Any, Dict, Optional
from sqlalchemy.orm import Session

# Ensure backend directory is in sys.path for app module imports
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)


class RecoveryService:
    """
    Execution Layer Service for RecoverAI.

    Manages the safe, controlled execution of recovery actions after Policy Engine validation.
    Currently operates in safe local test simulation mode (no live money or external API calls).
    """

    def execute_recovery_action(
        self,
        transaction: Any,
        policy_evaluation: Dict[str, Any],
        recommended_action: str,
        db: Optional[Session] = None,
    ) -> Dict[str, Any]:
        """
        Executes a recovery action IF AND ONLY IF approved by the Policy Engine.

        :param transaction: SQLAlchemy Transaction model or dict object
        :param policy_evaluation: Evaluation result from PolicyEngine.evaluate(...)
        :param recommended_action: Target recovery action string
        :param db: Optional SQLAlchemy Session instance for DB updates
        :return: Dict containing:
                 - payment_id (str)
                 - action (str)
                 - status (str): "executed" | "blocked" | "human_review"
                 - message (str)
                 - recovered_amount (int)
        """
        # Extract transaction identifiers and details
        if isinstance(transaction, dict):
            payment_id = transaction.get("payment_id", "")
            amount = transaction.get("amount", 0)
        else:
            payment_id = getattr(transaction, "payment_id", "")
            amount = getattr(transaction, "amount", 0)

        # MANDATORY POLICY GUARDRAIL: Strict verification of Policy Engine approval
        if not policy_evaluation.get("allowed", False) or policy_evaluation.get("decision") != "approved":
            decision = policy_evaluation.get("decision", "blocked")
            status = "human_review" if decision == "human_review" else "blocked"
            return {
                "payment_id": payment_id,
                "action": recommended_action,
                "status": status,
                "message": f"Execution blocked by Policy Engine: {policy_evaluation.get('reason', 'Action not approved.')}",
                "recovered_amount": 0,
            }

        # Action 1: Automated Payment Retry (retry_payment / retry_later)
        if recommended_action in ("retry_payment", "retry_later"):
            if not isinstance(transaction, dict) and hasattr(transaction, "retry_count"):
                transaction.retry_count += 1
                transaction.status = "captured"
                transaction.recovery_status = "recovered"
                if db:
                    db.commit()

            return {
                "payment_id": payment_id,
                "action": "retry_payment",
                "status": "executed",
                "message": f"Simulated payment retry executed successfully for payment '{payment_id}'.",
                "recovered_amount": amount,
            }

        # Action 2: Payment Method Update Link (request_payment_method_update / update_payment_method)
        if recommended_action in ("request_payment_method_update", "update_payment_method"):
            if not isinstance(transaction, dict):
                transaction.recovery_status = "payment_method_update_requested"
                if db:
                    db.commit()

            return {
                "payment_id": payment_id,
                "action": "request_payment_method_update",
                "status": "executed",
                "message": f"Simulated payment method update link dispatched for '{payment_id}'.",
                "recovered_amount": 0,
            }

        # Action 3: Customer Re-engagement Notification
        if recommended_action == "customer_reengagement":
            if not isinstance(transaction, dict):
                transaction.recovery_status = "customer_contacted"
                if db:
                    db.commit()

            return {
                "payment_id": payment_id,
                "action": "customer_reengagement",
                "status": "executed",
                "message": f"Simulated customer re-engagement notification dispatched for '{payment_id}'.",
                "recovered_amount": 0,
            }

        # Action 4: Subscription Mandate Recovery
        if recommended_action == "subscription_recovery":
            if not isinstance(transaction, dict):
                transaction.status = "captured"
                transaction.recovery_status = "recovered"
                if db:
                    db.commit()

            return {
                "payment_id": payment_id,
                "action": "subscription_recovery",
                "status": "executed",
                "message": f"Simulated subscription mandate recovery executed successfully for '{payment_id}'.",
                "recovered_amount": amount,
            }

        # Action 5: Human Review Escalation
        if recommended_action == "human_review":
            if not isinstance(transaction, dict):
                transaction.recovery_status = "human_review_required"
                if db:
                    db.commit()

            return {
                "payment_id": payment_id,
                "action": "human_review",
                "status": "human_review",
                "message": f"Transaction '{payment_id}' escalated and queued for merchant human review.",
                "recovered_amount": 0,
            }

        # Fallback for unrecognized actions
        return {
            "payment_id": payment_id,
            "action": recommended_action,
            "status": "blocked",
            "message": f"Unrecognized recovery action '{recommended_action}'. Execution blocked.",
            "recovered_amount": 0,
        }
