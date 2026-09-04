# app/models/story.py

from datetime import datetime
from app.extensions import db


class Story(db.Model):
    """
    A 24-hour-lived photo update, distinct from Post -- see
    app/services/story_service.py for the expiration rule
    (`expires_at > now`) that every read path enforces. `created_at` and
    `expires_at` are both set explicitly by the service at creation time
    (never trusted from the client, never left to independent column
    defaults) so they always derive from the same instant.
    """

    __tablename__ = "stories"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    image_url = db.Column(
        db.Text,
        nullable=False
    )

    caption = db.Column(
        db.String(120),
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    expires_at = db.Column(
        db.DateTime,
        nullable=False
    )

    user = db.relationship(
        "User",
        back_populates="stories"
    )

    __table_args__ = (
        db.Index(
            "ix_stories_user_id",
            "user_id"
        ),
        db.Index(
            "ix_stories_expires_at",
            "expires_at"
        ),
    )
