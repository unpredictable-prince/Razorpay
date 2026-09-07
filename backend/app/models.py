from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Integer, String
from app.database import Base


class Transaction(Base):
    """SQLAlchemy model representing a payment transaction in RecoverAI."""

    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    payment_id = Column(String, unique=True, index=True, nullable=False)
    customer_id = Column(String, index=True, nullable=False)
    customer_name = Column(String, nullable=True)
    customer_email = Column(String, nullable=True)
    customer_phone = Column(String, nullable=True)
    order_id = Column(String, index=True, nullable=True)
    amount = Column(Integer, nullable=False)
    currency = Column(String, nullable=False, default="INR")
    status = Column(String, nullable=False)
    failure_reason = Column(String, nullable=True)
    retry_count = Column(Integer, default=0, nullable=False)
    recovery_status = Column(String, default="pending", nullable=False)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )


class Notification(Base):
    """SQLAlchemy model representing a notification event in RecoverAI."""

    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient_type = Column(String, default="merchant", nullable=False)  # merchant or customer
    recipient_id = Column(String, index=True, nullable=True)
    payment_id = Column(String, index=True, nullable=True)
    order_id = Column(String, index=True, nullable=True)
    notification_type = Column(String, nullable=False)  # payment_failed, recovery_executed, human_review_required, etc.
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    severity = Column(String, default="info", nullable=False)  # info, success, warning, error
    is_read = Column(Integer, default=0, nullable=False)  # 0 or 1
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
