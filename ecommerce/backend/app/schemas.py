from datetime import datetime
from typing import Any, List, Optional
from pydantic import BaseModel, ConfigDict


class ProductResponse(BaseModel):
    id: int
    name: str
    description: str
    price: int
    image: str
    category: str
    stock: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CartItemSchema(BaseModel):
    product_id: int
    name: str
    price: int
    quantity: int
    image: str


class CreateOrderRequest(BaseModel):
    customer_name: str
    customer_email: str
    customer_phone: str
    shipping_address: str
    items: List[CartItemSchema]


class OrderResponse(BaseModel):
    id: int
    order_id: str
    customer_id: str
    customer_name: str
    customer_email: str
    customer_phone: str
    items: List[Any]
    total_amount: int
    order_status: str
    payment_status: str
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    shipping_address: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CreateRazorpayOrderRequest(BaseModel):
    order_id: str


class CreateRazorpayOrderResponse(BaseModel):
    razorpay_order_id: str
    razorpay_key_id: str
    amount: int
    currency: str
    order_id: str


class VerifyPaymentRequest(BaseModel):
    order_id: str
    razorpay_payment_id: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    razorpay_signature: Optional[str] = None
    status: str  # "success" or "failed"
    error_reason: Optional[str] = None
