import hashlib
import hmac
import json
import os
import sys
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

# Ensure project root and backend directory are in sys.path for app and agent module imports
routes_dir = os.path.dirname(os.path.abspath(__file__))
app_dir = os.path.dirname(routes_dir)
backend_dir = os.path.dirname(app_dir)
project_root = os.path.dirname(backend_dir)

for path in (project_root, backend_dir):
    if path not in sys.path:
        sys.path.insert(0, path)


from app.database import get_db
from app.models import Notification, Transaction
from app.services.recovery_analyzer import analyze_transaction_recovery
from app.services.recovery_service import RecoveryService
from agent.policy_engine import PolicyEngine
from agent.recovery_agent import RecoveryAgent


router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


def verify_razorpay_webhook_signature(raw_body: bytes, signature: str, secret: str) -> bool:
    """
    Verifies the HMAC SHA256 signature of a Razorpay webhook payload using the RAW request body.

    :param raw_body: Raw request body bytes
    :param signature: Signature value from X-Razorpay-Signature header
    :param secret: Configured webhook secret key
    :return: True if signature is valid, False otherwise
    """
    if not signature or not secret or not raw_body:
        return False
    expected = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


@router.post("/razorpay")
async def handle_razorpay_webhook(
    request: Request,
    x_razorpay_signature: Optional[str] = Header(None, alias="X-Razorpay-Signature"),
    db: Session = Depends(get_db),
):
    """
    Ingests and validates Razorpay webhook events.
    Verifies signature using RAW payload body before parsing JSON.
    Routes failed payments into the RecoverAI analysis & policy execution pipeline.
    """
    secret = os.environ.get("RAZORPAY_WEBHOOK_SECRET")

    # Reject missing signature or unconfigured webhook secret
    if not x_razorpay_signature or not secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing X-Razorpay-Signature header or RAZORPAY_WEBHOOK_SECRET configuration.",
        )

    raw_body = await request.body()

    # Reject invalid HMAC signature
    if not verify_razorpay_webhook_signature(raw_body, x_razorpay_signature, secret):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook signature verification failed.",
        )

    # Parse JSON payload only after successful signature validation
    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Malformed JSON payload: {err}",
        )

    event_type = payload.get("event")
    supported_events = {"payment.failed", "payment.captured", "payment.authorized"}

    # Handle unsupported events gracefully without crashing
    if event_type not in supported_events:
        return {
            "status": "ignored",
            "event": event_type,
            "message": f"Event '{event_type}' is unsupported and ignored.",
        }

    # Extract payment entity dictionary safely
    payment_entity = (
        payload.get("payload", {})
        .get("payment", {})
        .get("entity")
    )

    if not payment_entity or not isinstance(payment_entity, dict) or "id" not in payment_entity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook payload: missing payment entity or payment ID.",
        )

    payment_id = payment_entity.get("id")
    amount = payment_entity.get("amount", 0)
    currency = payment_entity.get("currency", "INR")

    # --------------------------------------------------------------------------
    # EVENT: payment.failed
    # --------------------------------------------------------------------------
    if event_type == "payment.failed":
        failure_reason = (
            payment_entity.get("error_reason")
            or payment_entity.get("error_code")
            or "unknown_failure"
        )
        notes = payment_entity.get("notes") or {}
        customer_id = (
            payment_entity.get("customer_id")
            or notes.get("customer_id")
            or payment_entity.get("contact")
            or payment_entity.get("email")
            or "cust_webhook"
        )
        customer_name = notes.get("customer_name")
        customer_email = notes.get("customer_email") or payment_entity.get("email")
        customer_phone = notes.get("customer_phone") or payment_entity.get("contact")
        order_id = notes.get("order_id") or payment_entity.get("order_id")

        # Idempotency check: query database for existing transaction
        existing_tx = db.query(Transaction).filter(Transaction.payment_id == payment_id).first()

        if existing_tx:
            # If transaction is already captured or recovery has been completed/blocked, handle idempotently
            if existing_tx.status == "captured" or existing_tx.recovery_status in ["executed", "recovered", "completed", "blocked", "human_review"]:
                return {
                    "status": "accepted",
                    "event": event_type,
                    "payment_id": payment_id,
                    "idempotent": True,
                    "message": "Payment failure event already processed or completed.",
                }
            # Otherwise update existing pending transaction record
            transaction = existing_tx
            transaction.amount = amount
            transaction.currency = currency
            transaction.failure_reason = failure_reason
            if customer_name: transaction.customer_name = customer_name
            if customer_email: transaction.customer_email = customer_email
            if customer_phone: transaction.customer_phone = customer_phone
            if order_id: transaction.order_id = order_id
            db.commit()
            db.refresh(transaction)
        else:
            # Create new transaction record
            transaction = Transaction(
                payment_id=payment_id,
                customer_id=customer_id,
                customer_name=customer_name,
                customer_email=customer_email,
                customer_phone=customer_phone,
                order_id=order_id,
                amount=amount,
                currency=currency,
                status="failed",
                failure_reason=failure_reason,
                retry_count=0,
                recovery_status="pending",
            )
            db.add(transaction)
            db.commit()
            db.refresh(transaction)

        # Send through RecoverAI Pipeline: Analyzer -> Agent -> Policy Engine -> Recovery Service
        analyzer_output = analyze_transaction_recovery(transaction)

        agent = RecoveryAgent(use_llm=False)
        agent_recommendation = agent.evaluate(transaction)

        engine = PolicyEngine()
        policy_decision = engine.evaluate(transaction, agent_recommendation)

        rec_service = RecoveryService()
        recommended_action = agent_recommendation.get("recommended_action", "retry_payment")
        execution_result = rec_service.execute_recovery_action(transaction, policy_decision, recommended_action)

        # Persist recovery execution status
        transaction.recovery_status = execution_result.get("status", "pending")
        db.commit()
        db.refresh(transaction)

        # Auto-create Merchant Notification & Clean Customer Notification
        decision_val = policy_decision.get("decision")
        display_name = customer_name or customer_id
        if decision_val == "approved":
            notif_title = f"Automatic Recovery Executed: {display_name}" if customer_name else "Automatic Recovery Executed"
            notif_type = "recovery_executed"
            notif_severity = "success"
            notif_msg = f"{display_name}'s payment '{payment_id}' failed ({failure_reason}). Automated recovery executed successfully."
        elif decision_val == "human_review":
            notif_title = f"Human Review Required: {display_name}" if customer_name else "Human Review Required"
            notif_type = "human_review_required"
            notif_severity = "warning"
            notif_msg = f"{display_name}'s payment '{payment_id}' failed ({failure_reason}). Policy engine routed to human review queue."
        else:
            notif_title = f"Payment Failed: {display_name}" if customer_name else "Failed Payment Detected"
            notif_type = "payment_failed"
            notif_severity = "error"
            notif_msg = f"{display_name}'s payment '{payment_id}' failed ({failure_reason}). Non-recoverable failure."

        merchant_notif = Notification(
            recipient_type="merchant",
            payment_id=payment_id,
            order_id=order_id,
            notification_type=notif_type,
            title=notif_title,
            message=notif_msg,
            severity=notif_severity,
            is_read=0,
        )
        db.add(merchant_notif)

        customer_notif = Notification(
            recipient_type="customer",
            recipient_id=customer_id,
            payment_id=payment_id,
            order_id=order_id,
            notification_type="payment_failed",
            title="Payment Attempt Failed",
            message="Your payment could not be completed because of a temporary issue. Please try again.",
            severity="warning",
            is_read=0,
        )
        db.add(customer_notif)
        db.commit()

        return {
            "status": "accepted",
            "event": event_type,
            "payment_id": payment_id,
            "pipeline_executed": True,
            "analysis": analyzer_output,
            "recommendation": agent_recommendation,
            "policy_decision": policy_decision,
            "execution_result": execution_result,
        }

    # --------------------------------------------------------------------------
    # EVENT: payment.captured
    # --------------------------------------------------------------------------
    elif event_type == "payment.captured":
        notes = payment_entity.get("notes") or {}
        customer_id = (
            payment_entity.get("customer_id")
            or notes.get("customer_id")
            or payment_entity.get("contact")
            or payment_entity.get("email")
            or "cust_webhook"
        )
        customer_name = notes.get("customer_name")
        customer_email = notes.get("customer_email") or payment_entity.get("email")
        customer_phone = notes.get("customer_phone") or payment_entity.get("contact")
        order_id = notes.get("order_id") or payment_entity.get("order_id")

        existing_tx = db.query(Transaction).filter(Transaction.payment_id == payment_id).first()
        if existing_tx:
            existing_tx.status = "captured"
            existing_tx.recovery_status = "recovered"
            if customer_name: existing_tx.customer_name = customer_name
            if customer_email: existing_tx.customer_email = customer_email
            if customer_phone: existing_tx.customer_phone = customer_phone
            if order_id: existing_tx.order_id = order_id
            db.commit()
        else:
            transaction = Transaction(
                payment_id=payment_id,
                customer_id=customer_id,
                customer_name=customer_name,
                customer_email=customer_email,
                customer_phone=customer_phone,
                order_id=order_id,
                amount=amount,
                currency=currency,
                status="captured",
                failure_reason=None,
                retry_count=0,
                recovery_status="not_required",
            )
            db.add(transaction)
            db.commit()

        # Create Merchant & Customer Notifications
        display_name = customer_name or customer_id
        merchant_notif = Notification(
            recipient_type="merchant",
            payment_id=payment_id,
            order_id=order_id,
            notification_type="payment_captured",
            title=f"Payment Captured: {display_name}" if customer_name else "Payment Captured",
            message=f"{display_name}'s payment '{payment_id}' captured successfully.",
            severity="success",
            is_read=0,
        )
        customer_notif = Notification(
            recipient_type="customer",
            recipient_id=customer_id,
            payment_id=payment_id,
            order_id=order_id,
            notification_type="payment_success",
            title="Payment Successful!",
            message="Your payment was completed successfully.",
            severity="success",
            is_read=0,
        )
        db.add(merchant_notif)
        db.add(customer_notif)
        db.commit()

        return {
            "status": "accepted",
            "event": event_type,
            "payment_id": payment_id,
            "updated_status": "captured",
            "message": "Payment captured successfully; recovery halted.",
        }

    # --------------------------------------------------------------------------
    # EVENT: payment.authorized
    # --------------------------------------------------------------------------
    elif event_type == "payment.authorized":
        notes = payment_entity.get("notes") or {}
        customer_id = (
            payment_entity.get("customer_id")
            or notes.get("customer_id")
            or payment_entity.get("contact")
            or payment_entity.get("email")
            or "cust_webhook"
        )
        customer_name = notes.get("customer_name")
        customer_email = notes.get("customer_email") or payment_entity.get("email")
        customer_phone = notes.get("customer_phone") or payment_entity.get("contact")
        order_id = notes.get("order_id") or payment_entity.get("order_id")

        existing_tx = db.query(Transaction).filter(Transaction.payment_id == payment_id).first()
        if existing_tx:
            existing_tx.status = "authorized"
            if customer_name: existing_tx.customer_name = customer_name
            if customer_email: existing_tx.customer_email = customer_email
            if customer_phone: existing_tx.customer_phone = customer_phone
            if order_id: existing_tx.order_id = order_id
            db.commit()
        else:
            transaction = Transaction(
                payment_id=payment_id,
                customer_id=customer_id,
                customer_name=customer_name,
                customer_email=customer_email,
                customer_phone=customer_phone,
                order_id=order_id,
                amount=amount,
                currency=currency,
                status="authorized",
                failure_reason=None,
                retry_count=0,
                recovery_status="pending",
            )
            db.add(transaction)
            db.commit()

        display_name = customer_name or customer_id
        merchant_notif = Notification(
            recipient_type="merchant",
            payment_id=payment_id,
            order_id=order_id,
            notification_type="payment_authorized",
            title=f"Payment Authorized: {display_name}" if customer_name else "Payment Authorized",
            message=f"{display_name}'s payment '{payment_id}' authorized by bank.",
            severity="info",
            is_read=0,
        )
        db.add(merchant_notif)
        db.commit()

        return {
            "status": "accepted",
            "event": event_type,
            "payment_id": payment_id,
            "updated_status": "authorized",
            "message": "Payment authorized; awaiting capture.",
        }
