# app/models/user_follow.py

from datetime import datetime
from app.extensions import db


class UserFollow(db.Model):
    __tablename__ = "user_follows"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    follower_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    following_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    __table_args__ = (
        db.UniqueConstraint(
            "follower_id",
            "following_id",
            name="unique_user_follow"
        ),

        db.CheckConstraint(
            "follower_id <> following_id",
            name="prevent_self_follow"
        ),
    )