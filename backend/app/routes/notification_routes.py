# app/routes/notification_routes.py

from flask import Blueprint, jsonify, request

from app.auth.decorators import get_current_user, jwt_required
from app.schemas import notification_schema, notifications_schema
from app.services import notification_service

notifications_bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")


@notifications_bp.get("")
@jwt_required
def list_notifications():
    """
    List the current user's notifications, newest first.
    ---
    tags:
      - Notifications
    security:
      - BearerAuth: []
    parameters:
      - in: query
        name: page
        type: integer
        default: 1
      - in: query
        name: per_page
        type: integer
        default: 20
        description: Capped at 100.
    responses:
      200:
        description: A page of notifications.
        schema:
          type: array
          items:
            $ref: '#/definitions/Notification'
    """
    page = request.args.get("page", default=1, type=int)
    per_page = request.args.get("per_page", default=20, type=int)
    notifications = notification_service.list_notifications(get_current_user(), page=page, per_page=per_page)
    return jsonify(notifications_schema.dump(notifications)), 200


@notifications_bp.get("/unread-count")
@jwt_required
def unread_count():
    """
    Count of the current user's unread notifications, for a nav badge.
    ---
    tags:
      - Notifications
    security:
      - BearerAuth: []
    responses:
      200:
        description: The unread count.
        schema:
          type: object
          properties:
            count:
              type: integer
    """
    count = notification_service.count_unread(get_current_user())
    return jsonify({"count": count}), 200


@notifications_bp.patch("/<int:notification_id>/read")
@jwt_required
def mark_read(notification_id):
    """
    Mark a single notification as read. Recipient only.
    ---
    tags:
      - Notifications
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: notification_id
        type: integer
        required: true
    responses:
      200:
        description: Notification marked read.
        schema:
          $ref: '#/definitions/Notification'
      403:
        description: Not the recipient of this notification.
        schema:
          $ref: '#/definitions/Error'
      404:
        description: Notification not found.
        schema:
          $ref: '#/definitions/Error'
    """
    notification = notification_service.mark_read(get_current_user(), notification_id)
    return jsonify(notification_schema.dump(notification)), 200


@notifications_bp.patch("/read-all")
@jwt_required
def mark_all_read():
    """
    Mark all of the current user's notifications as read.
    ---
    tags:
      - Notifications
    security:
      - BearerAuth: []
    responses:
      204:
        description: All notifications marked read.
    """
    notification_service.mark_all_read(get_current_user())
    return "", 204
