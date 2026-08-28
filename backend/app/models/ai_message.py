# app/models/ai_message.py

from datetime import datetime
from app.extensions import db

AI_MESSAGE_ROLES = ("user", "assistant", "system")


class AIMessage(db.Model):
    """
    A single turn within an AIConversation. `role` follows the same
    vocabulary the AI provider APIs use (see app/services/ai_providers.py)
    so a row can be handed to a provider almost as-is: {"role", "content"}.
    """

    __tablename__ = "ai_messages"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    conversation_id = db.Column(
        db.Integer,
        db.ForeignKey(
            "ai_conversations.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    role = db.Column(
        db.String(20),
        nullable=False
    )

    content = db.Column(
        db.Text,
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    conversation = db.relationship(
        "AIConversation",
        back_populates="messages"
    )

    __table_args__ = (
        db.CheckConstraint(
            f"role IN {AI_MESSAGE_ROLES}",
            name="ck_ai_messages_role"
        ),
    )
