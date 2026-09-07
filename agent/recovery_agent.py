import os
import sys
from typing import Any, Dict

# Ensure backend directory is in sys.path for app imports
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from typing import Any, Dict, Optional
from agent.llm_service import LLMService
from app.services.recovery_analyzer import analyze_transaction_recovery


class RecoveryAgent:
    """
    AI Revenue Recovery Agent foundation.

    Evaluates failed transactions and generates structured recovery recommendations.
    Defaults to the deterministic Recovery Analyzer service, but can optionally integrate
    an LLMService for generative reasoning and analysis.
    """

    def __init__(self, use_llm: bool = False, llm_service: Optional[LLMService] = None):
        self.use_llm = use_llm
        self.llm_service = llm_service

    def evaluate(self, transaction: Any) -> Dict[str, Any]:
        """
        Evaluates a transaction and returns an agent recovery recommendation.

        :param transaction: SQLAlchemy Transaction model, Pydantic schema, or dict object.
        :return: Dict containing:
                 - payment_id (str)
                 - decision (str)
                 - reason (str)
                 - recommended_action (str)
                 - confidence (float)
                 - requires_human_review (bool)
        """
        # Convert input transaction object to dictionary format if needed
        if isinstance(transaction, dict):
            tx_dict = transaction
        else:
            tx_dict = {
                "payment_id": getattr(transaction, "payment_id", ""),
                "status": getattr(transaction, "status", ""),
                "failure_reason": getattr(transaction, "failure_reason", None),
                "retry_count": getattr(transaction, "retry_count", 0),
                "amount": getattr(transaction, "amount", 0),
                "currency": getattr(transaction, "currency", "INR"),
            }

        # Option A: Generative LLM Analysis Path
        if self.use_llm:
            service = self.llm_service or LLMService()
            llm_result = service.analyze_transaction(tx_dict)
            return {
                "payment_id": tx_dict.get("payment_id", ""),
                "decision": llm_result["decision"],
                "reason": llm_result["reason"],
                "recommended_action": llm_result["recommended_action"],
                "confidence": float(llm_result["confidence"]),
                "requires_human_review": bool(llm_result["requires_human_review"]),
            }

        # Option B: Rule-Based Analyzer Path (Default)
        analysis = analyze_transaction_recovery(transaction)

        rec_action = analysis["recommended_action"]
        risk_level = analysis["risk_level"]
        recoverable = analysis["potentially_recoverable"]

        requires_human = rec_action == "human_review" or risk_level == "high"

        if rec_action == "none" or not analysis["is_failed"]:
            decision = "no_action"
            confidence = 1.0
        elif recoverable:
            decision = "attempt_recovery"
            confidence = 0.95
        elif rec_action == "customer_reengagement":
            decision = "reengage_customer"
            confidence = 0.90
        elif requires_human:
            decision = "escalate_to_human"
            confidence = 0.85
        else:
            decision = "no_action"
            confidence = 0.80

        return {
            "payment_id": analysis["payment_id"],
            "decision": decision,
            "reason": analysis["reason"],
            "recommended_action": rec_action,
            "confidence": confidence,
            "requires_human_review": requires_human,
        }

