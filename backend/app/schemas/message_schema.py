# app/schemas/message_schema.py

from marshmallow import EXCLUDE, fields, validate

from app.extensions import ma


class ConversationParticipantSchema(ma.Schema):
    """
    A single participant row linking a User to a Conversation. Nested
    (many=True) inside ConversationSchema; no dedicated public schema
    file for the join table itself.
    """

    class Meta:
        # Silently drop dump_only fields (id, *_id, created_at,
        # updated_at, ...) and any other unrecognized keys instead
        # of rejecting the whole payload with 'Unknown field'.
        # This matters because clients routinely round-trip a full
        # GET response back into a PUT/PATCH body.
        unknown = EXCLUDE

    id = fields.Integer(dump_only=True)
    conversation_id = fields.Integer(dump_only=True)
    user_id = fields.Integer(dump_only=True)
    joined_at = fields.DateTime(dump_only=True)

    participant = fields.Nested(
        "UserPublicSchema",
        dump_only=True,
        attribute="user",
    )


class MessageSchema(ma.Schema):
    """
    Represents a single Message within a Conversation.

    conversation_id and sender_id are server-controlled (route + session,
    respectively). `is_read` is intentionally NOT dump_only -- the
    recipient marks a message as read via an update to this field.
    """

    class Meta:
        # Silently drop dump_only fields (id, *_id, created_at,
        # updated_at, ...) and any other unrecognized keys instead
        # of rejecting the whole payload with 'Unknown field'.
        # This matters because clients routinely round-trip a full
        # GET response back into a PUT/PATCH body.
        unknown = EXCLUDE

    id = fields.Integer(dump_only=True)
    conversation_id = fields.Integer(dump_only=True)
    sender_id = fields.Integer(dump_only=True)

    content = fields.String(
        required=True,
        validate=validate.Length(min=1),
    )
    is_read = fields.Boolean()

    created_at = fields.DateTime(dump_only=True)

    sender = fields.Nested("UserPublicSchema", dump_only=True)


class ConversationSchema(ma.Schema):
    """
    Represents a Conversation, with its participants and messages.

    There is no dedicated conversations table entry in the schema file
    list, so this lives alongside MessageSchema, which it composes.
    """

    class Meta:
        # Silently drop dump_only fields (id, *_id, created_at,
        # updated_at, ...) and any other unrecognized keys instead
        # of rejecting the whole payload with 'Unknown field'.
        # This matters because clients routinely round-trip a full
        # GET response back into a PUT/PATCH body.
        unknown = EXCLUDE

    id = fields.Integer(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    participants = fields.Nested(
        ConversationParticipantSchema,
        many=True,
        dump_only=True,
    )
    messages = fields.Nested(
        MessageSchema,
        many=True,
        dump_only=True,
    )
