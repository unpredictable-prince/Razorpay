from typing import List
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Transaction
from app.schemas import TransactionResponse, TransactionStatsResponse

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.get("/", response_model=List[TransactionResponse])
def get_all_transactions(db: Session = Depends(get_db)):
    """Retrieve all transaction records from the database."""
    transactions = db.query(Transaction).all()
    return transactions


@router.get("/failed", response_model=List[TransactionResponse])
def get_failed_transactions(db: Session = Depends(get_db)):
    """Retrieve only transactions with status 'failed'."""
    failed_transactions = (
        db.query(Transaction).filter(Transaction.status == "failed").all()
    )
    return failed_transactions


@router.get("/stats", response_model=TransactionStatsResponse)
def get_transaction_stats(db: Session = Depends(get_db)):
    """Calculate and return real-time summary statistics for the merchant dashboard."""
    all_transactions = db.query(Transaction).all()

    total_transactions = len(all_transactions)
    failed_payments = sum(1 for t in all_transactions if t.status == "failed" or t.failure_reason is not None)
    captured_payments = sum(1 for t in all_transactions if t.status == "captured")

    failed_revenue = sum(t.amount for t in all_transactions if t.status == "failed" or t.failure_reason is not None)
    recovered_revenue = sum(
        t.amount
        for t in all_transactions
        if t.recovery_status in ("executed", "recovered")
        or (t.status == "captured" and t.retry_count > 0)
    )

    pending_recovery = sum(
        1 for t in all_transactions if t.recovery_status == "pending"
    )
    human_review_required = sum(
        1 for t in all_transactions if t.recovery_status in ("human_review", "human_review_required", "review", "action_required")
    )

    recovery_rate = (
        round((recovered_revenue / failed_revenue) * 100, 2)
        if failed_revenue > 0
        else 0.0
    )

    return TransactionStatsResponse(
        total_transactions=total_transactions,
        failed_payments=failed_payments,
        captured_payments=captured_payments,
        failed_revenue=failed_revenue,
        recovered_revenue=recovered_revenue,
        recovery_rate=recovery_rate,
        pending_recovery=pending_recovery,
        human_review_required=human_review_required,
    )


@router.get("/customer/{customer_id}")
def get_customer_journey(customer_id: str, db: Session = Depends(get_db)):
    """
    Retrieves complete customer profile, payment history, failed attempts,
    recovered revenue, and chronological journey timeline for a customer.
    """
    txs = (
        db.query(Transaction)
        .filter(
            (Transaction.customer_id == customer_id)
            | (Transaction.customer_name == customer_id)
        )
        .order_by(Transaction.created_at.asc())
        .all()
    )

    if not txs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer '{customer_id}' not found.",
        )

    customer_name = txs[0].customer_name or customer_id
    customer_email = txs[0].customer_email or "N/A"
    customer_phone = txs[0].customer_phone or "N/A"

    total_orders = len(txs)
    failed_attempts = sum(1 for t in txs if t.status == "failed")
    captured_orders = sum(1 for t in txs if t.status == "captured")
    total_spent = sum(t.amount for t in txs if t.status == "captured")
    recovered_revenue = sum(
        t.amount for t in txs if t.recovery_status in ("executed", "recovered")
    )

    timeline = []
    for t in txs:
        timeline.append({
            "event": "order_created",
            "title": f"Order Placed ({t.order_id or 'Order'})",
            "timestamp": t.created_at,
            "details": f"Amount: ₹{t.amount / 100:,.2f}",
            "payment_id": t.payment_id,
        })
        if t.status == "failed":
            timeline.append({
                "event": "payment_failed",
                "title": f"Payment Attempt Failed ({t.payment_id})",
                "timestamp": t.created_at,
                "details": f"Failure Reason: {t.failure_reason or 'unknown'}",
                "payment_id": t.payment_id,
            })
            if t.recovery_status in ("executed", "recovered"):
                timeline.append({
                    "event": "recovery_executed",
                    "title": f"RecoverAI Automated Retry Succeeded",
                    "timestamp": t.created_at,
                    "details": f"Payment Recovered: ₹{t.amount / 100:,.2f}",
                    "payment_id": t.payment_id,
                })
            elif t.recovery_status == "human_review":
                timeline.append({
                    "event": "human_review",
                    "title": f"Routed to Human Review Queue",
                    "timestamp": t.created_at,
                    "details": f"Policy Guard: Manual authorization required.",
                    "payment_id": t.payment_id,
                })
        elif t.status == "captured":
            timeline.append({
                "event": "payment_captured",
                "title": f"Payment Captured Successfully",
                "timestamp": t.created_at,
                "details": f"Amount: ₹{t.amount / 100:,.2f}",
                "payment_id": t.payment_id,
            })

    return {
        "customer_id": customer_id,
        "customer_name": customer_name,
        "customer_email": customer_email,
        "customer_phone": customer_phone,
        "total_orders": total_orders,
        "failed_attempts": failed_attempts,
        "captured_orders": captured_orders,
        "total_spent": total_spent,
        "recovered_revenue": recovered_revenue,
        "transactions": [
            {
                "id": t.id,
                "payment_id": t.payment_id,
                "order_id": t.order_id,
                "amount": t.amount,
                "status": t.status,
                "failure_reason": t.failure_reason,
                "retry_count": t.retry_count,
                "recovery_status": t.recovery_status,
                "created_at": t.created_at,
            }
            for t in txs
        ],
        "timeline": timeline,
    }


@router.get("/{payment_id}", response_model=TransactionResponse)
def get_transaction_by_payment_id(payment_id: str, db: Session = Depends(get_db)):
    """Retrieve a single transaction by its unique payment_id."""
    transaction = (
        db.query(Transaction).filter(Transaction.payment_id == payment_id).first()
    )
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with payment_id '{payment_id}' not found",
        )
    return transaction


@router.delete("/{payment_id}")
def delete_transaction(payment_id: str, db: Session = Depends(get_db)):
    """Delete a specific transaction record from the merchant database."""
    transaction = (
        db.query(Transaction).filter(Transaction.payment_id == payment_id).first()
    )
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with payment_id '{payment_id}' not found",
        )
    db.delete(transaction)
    db.commit()
    return {"status": "success", "message": f"Transaction '{payment_id}' deleted successfully"}


@router.delete("/customer/{customer_id}")
def delete_customer_data(customer_id: str, db: Session = Depends(get_db)):
    """Delete all transaction records associated with a specific customer."""
    txs = (
        db.query(Transaction)
        .filter(
            (Transaction.customer_id == customer_id)
            | (Transaction.customer_name == customer_id)
        )
        .all()
    )
    if not txs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No transaction records found for customer '{customer_id}'",
        )
    count = len(txs)
    for t in txs:
        db.delete(t)
    db.commit()
    return {"status": "success", "message": f"Deleted {count} records for customer '{customer_id}'"}

