# app/models/message.py

from app.extensions import utcnow
from app.extensions import db


class Message(db.Model):
    __tablename__ = "messages"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    conversation_id = db.Column(
        db.Integer,
        db.ForeignKey(
            "conversations.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    sender_id = db.Column(
        db.Integer,
        db.ForeignKey(
            "users.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    content = db.Column(
        db.Text,
        nullable=False
    )

    is_read = db.Column(
        db.Boolean,
        default=False
    )

    created_at = db.Column(
        db.DateTime,
        default=utcnow,
        nullable=False
    )

    conversation = db.relationship(
        "Conversation",
        back_populates="messages"
    )

    sender = db.relationship(
        "User",
        back_populates="sent_messages"
    )