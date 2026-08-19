# app/models/community_member.py

from datetime import datetime
from app.extensions import db


class CommunityMember(db.Model):
    __tablename__ = "community_members"

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

    joined_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    user = db.relationship(
        "User",
        back_populates="community_memberships"
    )

    community = db.relationship(
        "Community",
        back_populates="members"
    )

    __table_args__ = (
        db.UniqueConstraint(
            "user_id",
            "community_id",
            name="unique_community_member"
        ),
    )