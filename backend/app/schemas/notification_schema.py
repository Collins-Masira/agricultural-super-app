# app/schemas/notification_schema.py

from marshmallow import EXCLUDE, fields

from app.extensions import ma


class NotificationSchema(ma.Schema):
    """
    Represents a Notification. Fully server-generated -- there is no
    load path, only dump. `post_title` is a convenience field so the
    frontend can render "commented on your post 'X'" without a second
    request per notification.
    """

    class Meta:
        unknown = EXCLUDE

    id = fields.Integer(dump_only=True)
    type = fields.String(dump_only=True)
    is_read = fields.Boolean(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    post_id = fields.Integer(dump_only=True, allow_none=True)
    comment_id = fields.Integer(dump_only=True, allow_none=True)

    actor = fields.Nested(
        "UserPublicSchema",
        dump_only=True,
    )

    post_title = fields.Method("get_post_title", dump_only=True)

    def get_post_title(self, notification):
        return notification.post.title if notification.post else None
