# app/services/notification_service.py

"""
Notifications are created as a side effect of other actions (liking,
commenting, following) -- see the create_notification() calls in
post_service and user_service. This module only owns the Notification
resource itself: creating a row, and reading/updating it back for the
recipient. It deliberately never raises on a "bad" notify call (e.g.
notifying yourself) -- creating a notification is never the primary
action of a request, so it must never be the reason a like/comment/
follow fails.
"""

from app.errors import ForbiddenError, NotFoundError
from app.extensions import db
from app.models import Notification

MAX_PAGE_SIZE = 100


def create_notification(recipient_id, actor_id, type, post_id=None, comment_id=None):
    """
    No-ops (returns None) when the recipient is the actor -- liking,
    commenting on, or following yourself should never generate a
    notification to yourself.
    """
    if recipient_id == actor_id:
        return None

    notification = Notification(
        recipient_id=recipient_id,
        actor_id=actor_id,
        type=type,
        post_id=post_id,
        comment_id=comment_id,
    )
    db.session.add(notification)
    db.session.commit()
    return notification


def list_notifications(current_user, page=1, per_page=20):
    per_page = min(per_page, MAX_PAGE_SIZE)
    return (
        db.session.query(Notification)
        .filter_by(recipient_id=current_user.id)
        .order_by(Notification.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )


def count_unread(current_user):
    return (
        db.session.query(Notification)
        .filter_by(recipient_id=current_user.id, is_read=False)
        .count()
    )


def _get_notification_or_404(notification_id):
    notification = db.session.get(Notification, notification_id)
    if notification is None:
        raise NotFoundError(f"Notification {notification_id} not found.")
    return notification


def mark_read(current_user, notification_id):
    notification = _get_notification_or_404(notification_id)
    if notification.recipient_id != current_user.id:
        raise ForbiddenError("You do not have permission to modify this notification.")
    notification.is_read = True
    db.session.commit()
    return notification


def mark_all_read(current_user):
    (
        db.session.query(Notification)
        .filter_by(recipient_id=current_user.id, is_read=False)
        .update({"is_read": True})
    )
    db.session.commit()
