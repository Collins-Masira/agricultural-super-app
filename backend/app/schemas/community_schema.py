# app/schemas/community_schema.py

from marshmallow import EXCLUDE, fields, validate

from app.extensions import ma


class CommunityMemberSchema(ma.Schema):
    """
    A single membership row linking a User to a Community. Nested
    (many=True) inside CommunitySchema to list members without exposing
    a dedicated public schema/endpoint for the join table itself.
    """

    class Meta:
        # Silently drop dump_only fields (id, *_id, created_at,
        # updated_at, ...) and any other unrecognized keys instead
        # of rejecting the whole payload with 'Unknown field'.
        # This matters because clients routinely round-trip a full
        # GET response back into a PUT/PATCH body.
        unknown = EXCLUDE

    id = fields.Integer(dump_only=True)
    user_id = fields.Integer(dump_only=True)
    community_id = fields.Integer(dump_only=True)
    joined_at = fields.DateTime(dump_only=True)

    member = fields.Nested(
        "UserPublicSchema",
        dump_only=True,
        attribute="user",
    )


class CommunitySchema(ma.Schema):
    """
    Represents a Community, its creator, and its members.
    """

    class Meta:
        # Silently drop dump_only fields (id, *_id, created_at,
        # updated_at, ...) and any other unrecognized keys instead
        # of rejecting the whole payload with 'Unknown field'.
        # This matters because clients routinely round-trip a full
        # GET response back into a PUT/PATCH body.
        unknown = EXCLUDE

    id = fields.Integer(dump_only=True)

    name = fields.String(
        required=True,
        validate=validate.Length(min=1, max=150),
    )
    description = fields.String(allow_none=True)
    image_url = fields.String(allow_none=True)

    # Set from the authenticated user on creation, never client-supplied.
    created_by = fields.Integer(dump_only=True)

    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    creator = fields.Nested("UserPublicSchema", dump_only=True)

    members = fields.Nested(
        CommunityMemberSchema,
        many=True,
        dump_only=True,
    )
