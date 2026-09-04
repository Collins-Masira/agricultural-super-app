# app/models/community_follow.py

from app.extensions import utcnow
from app.extensions import db


class CommunityFollow(db.Model):
    __tablename__ = "community_follows"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    community_id = db.Column(
        db.Integer,
        db.ForeignKey("communities.id", ondelete="CASCADE"),
        nullable=False
    )

    followed_at = db.Column(
        db.DateTime,
        default=utcnow
    )

    follower = db.relationship(
        "User",
        back_populates="community_follows"
    )

    community = db.relationship(
        "Community",
        back_populates="follows"
    )

    __table_args__ = (
        db.UniqueConstraint(
            "user_id",
            "community_id",
            name="unique_community_follow"
        ),
    )