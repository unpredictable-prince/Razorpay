import hashlib
import hmac
import json
import os
import sys
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

# Ensure backend directory is in sys.path
routes_dir = os.path.dirname(os.path.abspath(__file__))
app_dir = os.path.dirname(routes_dir)
backend_dir = os.path.dirname(app_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database import get_db
from app.models import Notification, Transaction
from app.routes.webhooks import handle_razorpay_webhook
from fastapi import Request

router = APIRouter(prefix="/demo", tags=["Demo Mode"])


class DemoSimulateRequest(BaseModel):
    scenario: str  # "bank_server_down", "card_expired", "authentication_failed", "customer_cancelled", "captured", "authorized"
    customer_name: Optional[str] = "Sam"
    customer_email: Optional[str] = "sam@gmail.com"
    customer_phone: Optional[str] = "9876543210"
    amount: Optional[int] = 299900  # in paise


@router.post("/simulate")
async def simulate_demo_event(req: DemoSimulateRequest, db: Session = Depends(get_db)):
    """
    Simulates a controlled test payment scenario through the actual RecoverAI backend pipeline
    (Webhooks ➔ Analyzer ➔ AI Agent ➔ Policy Engine ➔ Recovery Service ➔ Database ➔ Notifications).
    Does NOT bypass backend pipeline logic.
    """
    secret = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "whsec_test_secret_12345")
    payment_id = f"pay_demo_{req.scenario[:4]}_{os.urandom(4).hex()}"
    order_id = f"ord_demo_{os.urandom(4).hex()}"
    customer_id = f"cust_{req.customer_name.lower()[:3]}_01"

    if req.scenario in ["bank_server_down", "card_expired", "authentication_failed", "customer_cancelled"]:
        event_type = "payment.failed"
        payload = {
            "event": event_type,
            "payload": {
                "payment": {
                    "entity": {
                        "id": payment_id,
                        "amount": req.amount,
                        "currency": "INR",
                        "status": "failed",
                        "error_reason": req.scenario,
                        "contact": req.customer_phone,
                        "email": req.customer_email,
                        "notes": {
                            "order_id": order_id,
                            "customer_id": customer_id,
                            "customer_name": req.customer_name,
                            "customer_email": req.customer_email,
                            "customer_phone": req.customer_phone,
                            "demo_flag": True,
                        },
                    }
                }
            },
        }
    elif req.scenario == "captured":
        event_type = "payment.captured"
        payload = {
            "event": event_type,
            "payload": {
                "payment": {
                    "entity": {
                        "id": payment_id,
                        "amount": req.amount,
                        "currency": "INR",
                        "status": "captured",
                        "contact": req.customer_phone,
                        "email": req.customer_email,
                        "notes": {
                            "order_id": order_id,
                            "customer_id": customer_id,
                            "customer_name": req.customer_name,
                            "customer_email": req.customer_email,
                            "customer_phone": req.customer_phone,
                            "demo_flag": True,
                        },
                    }
                }
            },
        }
    else:  # authorized
        event_type = "payment.authorized"
        payload = {
            "event": event_type,
            "payload": {
                "payment": {
                    "entity": {
                        "id": payment_id,
                        "amount": req.amount,
                        "currency": "INR",
                        "status": "authorized",
                        "contact": req.customer_phone,
                        "email": req.customer_email,
                        "notes": {
                            "order_id": order_id,
                            "customer_id": customer_id,
                            "customer_name": req.customer_name,
                            "customer_email": req.customer_email,
                            "customer_phone": req.customer_phone,
                            "demo_flag": True,
                        },
                    }
                }
            },
        }

    raw_body = json.dumps(payload).encode("utf-8")
    signature = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()

    # Create dummy Request object for handle_razorpay_webhook
    class DummyRequest:
        def __init__(self, body_bytes: bytes, sig: str):
            self._body = body_bytes
            self.headers = {"X-Razorpay-Signature": sig}

        async def body(self):
            return self._body

    dummy_req = DummyRequest(raw_body, signature)
    result = await handle_razorpay_webhook(request=dummy_req, x_razorpay_signature=signature, db=db)
    return {
        "status": "ok",
        "demo_scenario": req.scenario,
        "payment_id": payment_id,
        "customer_name": req.customer_name,
        "webhook_result": result,
    }


@router.post("/reset")
def reset_demo_data(db: Session = Depends(get_db)):
    """
    Safely resets demo test records from transactions and notifications tables.
    Does NOT affect database schemas, app configs, or test fixtures.
    """
    db.query(Transaction).filter(Transaction.payment_id.like("pay_demo_%")).delete(synchronize_session=False)
    db.query(Notification).filter(Notification.payment_id.like("pay_demo_%")).delete(synchronize_session=False)
    db.commit()
    return {"status": "ok", "message": "Demo environment reset successfully."}
