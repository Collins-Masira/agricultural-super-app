# app/models/conversation.py

from app.extensions import utcnow
from app.extensions import db


class Conversation(db.Model):
    __tablename__ = "conversations"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    community_id = db.Column(
        db.Integer,
        db.ForeignKey("communities.id", ondelete="CASCADE"),
        nullable=True
    )

    created_by = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=utcnow,
        nullable=False
    )

    updated_at = db.Column(
        db.DateTime,
        default=utcnow,
        onupdate=utcnow,
        nullable=False
    )

    community = db.relationship(
        "Community",
        back_populates="conversations"
    )

    creator = db.relationship(
        "User",
        back_populates="conversations_created"
    )

    participants = db.relationship(
        "ConversationParticipant",
        back_populates="conversation",
        cascade="all, delete-orphan"
    )

    messages = db.relationship(
        "Message",
        back_populates="conversation",
        cascade="all, delete-orphan"
    )