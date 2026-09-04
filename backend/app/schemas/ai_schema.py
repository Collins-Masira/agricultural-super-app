# app/schemas/ai_schema.py

from marshmallow import EXCLUDE, fields

from app.extensions import ma


class AIMessageSchema(ma.Schema):
    """
    A single turn in an AIConversation. Entirely server-controlled on
    output -- clients never submit a full message object, only a
    `content` string (see app/routes/ai_routes.py), so every field here
    is dump_only.
    """

    class Meta:
        unknown = EXCLUDE

    id = fields.Integer(dump_only=True)
    conversation_id = fields.Integer(dump_only=True)
    role = fields.String(dump_only=True)
    content = fields.String(dump_only=True)
    created_at = fields.DateTime(dump_only=True)


class AIConversationSchema(ma.Schema):
    """
    Summary shape for the conversation list/sidebar -- deliberately
    excludes `messages` so listing a user's conversations doesn't pull
    (and serialize) every message in every one of them. See
    AIConversationDetailSchema for the single-conversation shape that
    does include messages.
    """

    class Meta:
        unknown = EXCLUDE

    id = fields.Integer(dump_only=True)
    title = fields.String(dump_only=True, allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class AIConversationDetailSchema(AIConversationSchema):
    """Full conversation, including its messages in chronological order."""

    messages = fields.Nested(
        AIMessageSchema,
        many=True,
        dump_only=True,
    )
