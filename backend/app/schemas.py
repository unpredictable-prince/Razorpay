from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class TransactionResponse(BaseModel):
    """Pydantic schema for serializing transaction response data."""

    id: int
    payment_id: str
    customer_id: str
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    order_id: Optional[str] = None
    amount: int
    currency: str
    status: str
    failure_reason: Optional[str] = None
    retry_count: int
    recovery_status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TransactionStatsResponse(BaseModel):
    """Pydantic schema for dashboard analytics and metrics summary."""

    total_transactions: int
    failed_payments: int
    captured_payments: int
    failed_revenue: int  # in paise
    recovered_revenue: int  # in paise
    recovery_rate: float  # percentage
    pending_recovery: int
    human_review_required: int

    model_config = ConfigDict(from_attributes=True)


class NotificationResponse(BaseModel):
    """Pydantic schema for serializing notification data."""

    id: int
    recipient_type: str
    recipient_id: Optional[str] = None
    payment_id: Optional[str] = None
    order_id: Optional[str] = None
    notification_type: str
    title: str
    message: str
    severity: str
    is_read: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UnreadCountResponse(BaseModel):
    """Pydantic schema for unread notification count."""

    unread_count: int
