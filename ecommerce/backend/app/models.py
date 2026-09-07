from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Integer, String, Text
from app.database import Base


class Product(Base):
    """Product catalog item in Aura Store."""

    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    price = Column(Integer, nullable=False)  # in paise (e.g. 149900 = ₹1,499)
    image = Column(String, nullable=False)
    category = Column(String, nullable=False)
    stock = Column(Integer, default=50, nullable=False)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )


class Customer(Base):
    """Customer profile record."""

    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )


class Order(Base):
    """Customer E-commerce Order record."""

    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String, unique=True, index=True, nullable=False)
    customer_id = Column(String, index=True, nullable=False)
    customer_name = Column(String, nullable=False)
    customer_email = Column(String, nullable=False)
    customer_phone = Column(String, nullable=False)
    items_json = Column(Text, nullable=False)  # JSON string of cart items
    total_amount = Column(Integer, nullable=False)  # in paise
    order_status = Column(String, default="created", nullable=False)  # created, processing, completed, cancelled
    payment_status = Column(String, default="pending", nullable=False)  # pending, paid, failed
    razorpay_order_id = Column(String, index=True, nullable=True)
    razorpay_payment_id = Column(String, index=True, nullable=True)
    shipping_address = Column(Text, nullable=False)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )


class CustomerNotification(Base):
    """Clean customer-facing notification for Aura Store customers."""

    __tablename__ = "customer_notifications"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String, index=True, nullable=False)
    order_id = Column(String, index=True, nullable=True)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    type = Column(String, nullable=False)  # payment_failed, payment_success, retry_available, order_updated
    is_read = Column(Integer, default=0, nullable=False)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
