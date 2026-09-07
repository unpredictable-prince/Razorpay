import os
import sys
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

# Ensure backend directory is in sys.path
routes_dir = os.path.dirname(os.path.abspath(__file__))
app_dir = os.path.dirname(routes_dir)
backend_dir = os.path.dirname(app_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database import get_db
from app.models import Notification
from app.schemas import NotificationResponse, UnreadCountResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=List[NotificationResponse])
def get_notifications(
    recipient_type: str = "merchant",
    notification_type: Optional[str] = None,
    severity: Optional[str] = None,
    is_read: Optional[int] = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    """
    Retrieves notifications for merchants or customers with optional filtering.
    """
    query = db.query(Notification).filter(Notification.recipient_type == recipient_type)

    if notification_type:
        query = query.filter(Notification.notification_type == notification_type)
    if severity:
        query = query.filter(Notification.severity == severity)
    if is_read is not None:
        query = query.filter(Notification.is_read == is_read)

    notifications = query.order_by(Notification.created_at.desc()).offset(offset).limit(limit).all()
    return notifications


@router.get("/unread-count", response_model=UnreadCountResponse)
def get_unread_count(
    recipient_type: str = "merchant",
    db: Session = Depends(get_db),
):
    """
    Returns the total unread notification count.
    """
    count = (
        db.query(Notification)
        .filter(Notification.recipient_type == recipient_type, Notification.is_read == 0)
        .count()
    )
    return {"unread_count": count}


@router.post("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
):
    """
    Marks a single notification as read.
    """
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification with ID '{notification_id}' not found.",
        )
    notif.is_read = 1
    db.commit()
    db.refresh(notif)
    return notif


@router.post("/read-all")
def mark_all_notifications_as_read(
    recipient_type: str = "merchant",
    db: Session = Depends(get_db),
):
    """
    Marks all unread notifications for a recipient type as read.
    """
    db.query(Notification).filter(
        Notification.recipient_type == recipient_type,
        Notification.is_read == 0,
    ).update({Notification.is_read: 1}, synchronize_session=False)
    db.commit()
    return {"status": "ok", "message": "All unread notifications marked as read."}
