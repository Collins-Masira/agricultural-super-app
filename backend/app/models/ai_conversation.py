# app/models/ai_conversation.py

from datetime import datetime
from app.extensions import db


class AIConversation(db.Model):
    """
    A conversation thread between one User and the AI Farming Assistant
    (see app/services/ai_service.py). Deliberately separate from
    Conversation/Message (app/models/conversation.py, message.py), which
    model human-to-human community messaging and have incompatible
    semantics (required participants, sender_id, is_read) -- reusing
    those here would mean either abusing them or bending their meaning
    for an unrelated feature.
    """

    __tablename__ = "ai_conversations"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    # Nullable: set once the first user message arrives (auto-derived
    # from its content) rather than requiring the caller to name the
    # conversation up front. See ai_service.create_conversation.
    title = db.Column(
        db.String(255),
        nullable=True
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

    user = db.relationship(
        "User",
        back_populates="ai_conversations"
    )

    messages = db.relationship(
        "AIMessage",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="AIMessage.created_at"
    )
