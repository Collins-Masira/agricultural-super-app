# app/models/community.py

from datetime import datetime
from app.extensions import db


class Community(db.Model):
    __tablename__ = "communities"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    name = db.Column(
        db.String(150),
        unique=True,
        nullable=False
    )

    description = db.Column(
        db.Text
    )

    image_url = db.Column(
        db.Text
    )

    created_by = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    creator = db.relationship(
        "User",
        back_populates="created_communities"
    )

    members = db.relationship(
        "CommunityMember",
        back_populates="community",
        cascade="all, delete-orphan"
    )

    follows = db.relationship(
        "CommunityFollow",
        back_populates="community",
        cascade="all, delete-orphan"
    )

    conversations = db.relationship(
        "Conversation",
        foreign_keys="Conversation.community_id",
        back_populates="community"
    )