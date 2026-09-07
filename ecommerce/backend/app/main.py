from contextlib import asynccontextmanager
import json
import os
import sys
import uuid
import hashlib
import hmac
import requests
import razorpay
import uvicorn
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

# Ensure project root and ecommerce backend directory are in sys.path
app_dir = os.path.dirname(os.path.abspath(__file__))
ecommerce_backend_dir = os.path.dirname(app_dir)
project_root = os.path.dirname(os.path.dirname(ecommerce_backend_dir))

for path in (project_root, ecommerce_backend_dir):
    if path not in sys.path:
        sys.path.insert(0, path)

# Auto-load .env from project root
env_path = os.path.join(project_root, ".env")
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8-sig") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip("'\""))

from app.database import get_db, init_ecommerce_db
from app.models import Customer, Order, Product
from app.schemas import (
    CreateOrderRequest,
    CreateRazorpayOrderRequest,
    CreateRazorpayOrderResponse,
    OrderResponse,
    ProductResponse,
    VerifyPaymentRequest,
)
from app.seed_products import seed_products


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB and seed products on startup
    init_ecommerce_db()
    seed_products()
    yield


app = FastAPI(
    title="Aura Store E-Commerce Backend",
    description="Customer-facing e-commerce API integrated with Razorpay Test Mode",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    """Root endpoint for Aura Store E-Commerce API."""
    return {
        "status": "ok",
        "service": "Aura Store E-Commerce Backend API",
        "version": "0.1.0",
        "docs_url": "http://127.0.0.1:8001/docs",
        "health_check": "http://127.0.0.1:8001/health",
        "store_frontend": "http://localhost:5174",
    }


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Aura Store E-Commerce API"}


@app.get("/api/config")
def get_public_config():
    """Returns safe public credentials (Razorpay Key ID) for customer Checkout popup."""
    key_id = os.environ.get("RAZORPAY_KEY_ID", "rzp_test_mockkey")
    return {"razorpay_key_id": key_id}


@app.get("/api/products", response_model=list[ProductResponse])
def get_products(category: str = None, db: Session = Depends(get_db)):
    query = db.query(Product)
    if category and category.lower() != "all":
        query = query.filter(Product.category.ilike(category))
    return query.all()


@app.get("/api/products/{product_id}", response_model=ProductResponse)
def get_product_by_id(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@app.post("/api/orders", response_model=OrderResponse)
def create_order(req: CreateOrderRequest, db: Session = Depends(get_db)):
    if not req.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # Generate customer ID if customer doesn't exist
    customer = (
        db.query(Customer).filter(Customer.email == req.customer_email).first()
    )
    if not customer:
        cust_id = f"cust_{uuid.uuid4().hex[:8]}"
        customer = Customer(
            customer_id=cust_id,
            name=req.customer_name,
            email=req.customer_email,
            phone=req.customer_phone,
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)

    # Calculate total amount in paise
    total_amount = sum(item.price * item.quantity for item in req.items)
    items_json = json.dumps([item.model_dump() for item in req.items])
    order_id = f"ord_aura_{uuid.uuid4().hex[:8]}"

    new_order = Order(
        order_id=order_id,
        customer_id=customer.customer_id,
        customer_name=req.customer_name,
        customer_email=req.customer_email,
        customer_phone=req.customer_phone,
        items_json=items_json,
        total_amount=total_amount,
        order_status="created",
        payment_status="pending",
        shipping_address=req.shipping_address,
    )

    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    # Format return response
    res_dict = {
        "id": new_order.id,
        "order_id": new_order.order_id,
        "customer_id": new_order.customer_id,
        "customer_name": new_order.customer_name,
        "customer_email": new_order.customer_email,
        "customer_phone": new_order.customer_phone,
        "items": json.loads(new_order.items_json),
        "total_amount": new_order.total_amount,
        "order_status": new_order.order_status,
        "payment_status": new_order.payment_status,
        "razorpay_order_id": new_order.razorpay_order_id,
        "razorpay_payment_id": new_order.razorpay_payment_id,
        "shipping_address": new_order.shipping_address,
        "created_at": new_order.created_at,
    }
    return res_dict


@app.post(
    "/api/payments/create-razorpay-order", response_model=CreateRazorpayOrderResponse
)
def create_razorpay_order(
    req: CreateRazorpayOrderRequest, db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.order_id == req.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    key_id = os.environ.get("RAZORPAY_KEY_ID")
    key_secret = os.environ.get("RAZORPAY_KEY_SECRET")

    # If Razorpay keys are available, create real Razorpay Order
    if key_id and key_secret:
        try:
            client = razorpay.Client(auth=(key_id, key_secret))
            rzp_order = client.order.create(
                {
                    "amount": order.total_amount,
                    "currency": "INR",
                    "receipt": order.order_id,
                    "notes": {
                        "order_id": order.order_id,
                        "customer_id": order.customer_id,
                        "customer_name": order.customer_name,
                        "customer_email": order.customer_email,
                        "customer_phone": order.customer_phone,
                    },
                }
            )
            rzp_order_id = rzp_order.get("id")
            order.razorpay_order_id = rzp_order_id
            db.commit()

            return {
                "razorpay_order_id": rzp_order_id,
                "razorpay_key_id": key_id,
                "amount": order.total_amount,
                "currency": "INR",
                "order_id": order.order_id,
            }
        except Exception as err:
            raise HTTPException(
                status_code=500, detail=f"Failed to create Razorpay Order: {err}"
            )
    else:
        # Fallback mock order ID for offline dev testing
        mock_rzp_id = f"order_mock_{uuid.uuid4().hex[:8]}"
        order.razorpay_order_id = mock_rzp_id
        db.commit()
        return {
            "razorpay_order_id": mock_rzp_id,
            "razorpay_key_id": key_id or "rzp_test_mockkey",
            "amount": order.total_amount,
            "currency": "INR",
            "order_id": order.order_id,
        }


def forward_event_to_recoverai(order: Order, status: str, payment_id: str, error_reason: str = None):
    """Relays payment event to RecoverAI backend webhook endpoint on port 8000 with HMAC signature."""
    try:
        secret = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "recoverai_test_webhook_secret")
        event_name = "payment.captured" if status == "success" else "payment.failed"
        payload = {
            "event": event_name,
            "payload": {
                "payment": {
                    "entity": {
                        "id": payment_id or f"pay_{status}_{order.order_id}",
                        "amount": order.total_amount,
                        "currency": "INR",
                        "status": "captured" if status == "success" else "failed",
                        "error_reason": error_reason if status != "success" else None,
                        "email": order.customer_email,
                        "contact": order.customer_phone,
                        "notes": {
                            "order_id": order.order_id,
                            "customer_id": order.customer_id,
                            "customer_name": order.customer_name,
                            "customer_email": order.customer_email,
                            "customer_phone": order.customer_phone,
                        }
                    }
                }
            }
        }
        raw_body = json.dumps(payload).encode("utf-8")
        sig = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()

        requests.post(
            "http://localhost:8000/webhooks/razorpay",
            data=raw_body,
            headers={"Content-Type": "application/json", "X-Razorpay-Signature": sig},
            timeout=3
        )
    except Exception as err:
        print(f"Notice: Could not relay payment event to RecoverAI: {err}")


@app.post("/api/payments/verify")
def verify_payment(req: VerifyPaymentRequest, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.order_id == req.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    pay_id = req.razorpay_payment_id or f"pay_{req.status}_{order.order_id}"

    if req.status == "success":
        order.payment_status = "paid"
        order.order_status = "processing"
        order.razorpay_payment_id = pay_id
        db.commit()

        # Forward event to RecoverAI backend
        forward_event_to_recoverai(order, "success", pay_id)

        return {
            "status": "success",
            "message": "Payment verified and recorded successfully",
            "order_id": order.order_id,
        }
    else:
        order.payment_status = "failed"
        order.order_status = "payment_failed"
        order.razorpay_payment_id = pay_id
        db.commit()

        # Forward event to RecoverAI backend
        forward_event_to_recoverai(order, "failed", pay_id, req.error_reason or "bank_server_down")

        return {
            "status": "failed",
            "message": "Payment failed",
            "order_id": order.order_id,
            "error_reason": req.error_reason or "Payment attempted but failed",
        }


@app.get("/api/orders", response_model=list[OrderResponse])
def get_customer_orders(email: str = None, db: Session = Depends(get_db)):
    query = db.query(Order)
    if email:
        query = query.filter(Order.customer_email == email)
    orders = query.order_by(Order.created_at.desc()).all()

    res = []
    for o in orders:
        res.append(
            {
                "id": o.id,
                "order_id": o.order_id,
                "customer_id": o.customer_id,
                "customer_name": o.customer_name,
                "customer_email": o.customer_email,
                "customer_phone": o.customer_phone,
                "items": json.loads(o.items_json),
                "total_amount": o.total_amount,
                "order_status": o.order_status,
                "payment_status": o.payment_status,
                "razorpay_order_id": o.razorpay_order_id,
                "razorpay_payment_id": o.razorpay_payment_id,
                "shipping_address": o.shipping_address,
                "created_at": o.created_at,
            }
        )
    return res


@app.get("/api/orders/{order_id}", response_model=OrderResponse)
def get_order_by_id(order_id: str, db: Session = Depends(get_db)):
    o = db.query(Order).filter(Order.order_id == order_id).first()
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")

    return {
        "id": o.id,
        "order_id": o.order_id,
        "customer_id": o.customer_id,
        "customer_name": o.customer_name,
        "customer_email": o.customer_email,
        "customer_phone": o.customer_phone,
        "items": json.loads(o.items_json),
        "total_amount": o.total_amount,
        "order_status": o.order_status,
        "payment_status": o.payment_status,
        "razorpay_order_id": o.razorpay_order_id,
        "razorpay_payment_id": o.razorpay_payment_id,
        "shipping_address": o.shipping_address,
        "created_at": o.created_at,
    }


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8001, reload=True)
