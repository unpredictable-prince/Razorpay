import os
import sys
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

# Ensure backend directory is in sys.path for app module imports
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database import SessionLocal
from app.models import Transaction


def get_transaction(payment_id: str, db: Optional[Session] = None) -> Dict[str, Any]:
    """
    Retrieves a single transaction by its unique payment_id.

    :param payment_id: Unique Razorpay/RecoverAI payment identifier
    :param db: Optional SQLAlchemy Session instance (creates a new session if None)
    :return: Structured dictionary containing transaction details or found=False error dict
    """
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

    try:
        tx = db.query(Transaction).filter(Transaction.payment_id == payment_id).first()
        if not tx:
            return {
                "found": False,
                "error": f"Transaction with payment_id '{payment_id}' not found.",
            }

        return {
            "found": True,
            "payment_id": tx.payment_id,
            "customer_id": tx.customer_id,
            "amount": tx.amount,
            "currency": tx.currency,
            "status": tx.status,
            "failure_reason": tx.failure_reason,
            "retry_count": tx.retry_count,
            "recovery_status": tx.recovery_status,
            "created_at": tx.created_at.isoformat() if tx.created_at else None,
        }
    finally:
        if should_close:
            db.close()


def get_customer_history(customer_id: str, db: Optional[Session] = None) -> List[Dict[str, Any]]:
    """
    Retrieves all transaction records belonging to a specific customer, ordered by creation time (newest first).

    :param customer_id: Customer identifier
    :param db: Optional SQLAlchemy Session instance (creates a new session if None)
    :return: List of transaction detail dictionaries
    """
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

    try:
        transactions = (
            db.query(Transaction)
            .filter(Transaction.customer_id == customer_id)
            .order_by(Transaction.created_at.desc())
            .all()
        )

        history = []
        for tx in transactions:
            history.append({
                "payment_id": tx.payment_id,
                "customer_id": tx.customer_id,
                "amount": tx.amount,
                "currency": tx.currency,
                "status": tx.status,
                "failure_reason": tx.failure_reason,
                "retry_count": tx.retry_count,
                "recovery_status": tx.recovery_status,
                "created_at": tx.created_at.isoformat() if tx.created_at else None,
            })
        return history
    finally:
        if should_close:
            db.close()


def get_customer_summary(customer_id: str, db: Optional[Session] = None) -> Dict[str, Any]:
    """
    Calculates summary metrics for a customer based on their transaction history.

    :param customer_id: Customer identifier
    :param db: Optional SQLAlchemy Session instance (creates a new session if None)
    :return: Dictionary containing:
             - customer_id
             - total_transactions
             - successful_transactions
             - failed_transactions
             - total_successful_amount
             - latest_transaction_status
    """
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

    try:
        transactions = (
            db.query(Transaction)
            .filter(Transaction.customer_id == customer_id)
            .order_by(Transaction.created_at.desc())
            .all()
        )

        total_transactions = len(transactions)
        successful_transactions = sum(1 for tx in transactions if tx.status == "captured")
        failed_transactions = sum(1 for tx in transactions if tx.status == "failed")
        total_successful_amount = sum(tx.amount for tx in transactions if tx.status == "captured")
        latest_status = transactions[0].status if transactions else None

        return {
            "customer_id": customer_id,
            "total_transactions": total_transactions,
            "successful_transactions": successful_transactions,
            "failed_transactions": failed_transactions,
            "total_successful_amount": total_successful_amount,
            "latest_transaction_status": latest_status,
        }
    finally:
        if should_close:
            db.close()
