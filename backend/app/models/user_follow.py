# app/models/user_follow.py

from app.extensions import utcnow
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
        default=utcnow,
        nullable=False
    )

    follower = db.relationship(
        "User",
        foreign_keys=[follower_id],
        back_populates="following"
    )

    following = db.relationship(
        "User",
        foreign_keys=[following_id],
        back_populates="followers"
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