
from marshmallow import EXCLUDE, fields, validate

from app.extensions import ma


class UserPublicSchema(ma.Schema):
    """
    Lightweight, publicly-safe representation of a User.

    Used for nesting inside other schemas (posts, comments, community
    memberships, conversation participants, messages) so that author/
    identity information can be embedded without exposing account-level
    fields (email, role management, timestamps) or re-triggering a full
    nested serialization graph.
    """

    class Meta:
        
        unknown = EXCLUDE

    id = fields.Integer(dump_only=True)
    username = fields.String(dump_only=True)
    role = fields.String(dump_only=True)
    profile = fields.Nested(
        "ProfileSchema",
        only=("first_name", "last_name", "profile_image_url"),
        dump_only=True,
    )


class UserSchema(ma.Schema):
    """
    Full representation of a User, used for the authenticated user's own
    account view/update and for registration payloads.
    """

    class Meta:
        unknown = EXCLUDE

    id = fields.Integer(dump_only=True)

    username = fields.String(
        required=True,
        validate=validate.Length(min=3, max=50),
    )

    email = fields.Email(
        required=True,
        validate=validate.Length(max=255),
    )

    password_hash = fields.String(
        required=True,
        load_only=True,
        validate=validate.Length(min=8),
    )

    role = fields.String(
        validate=validate.Length(max=30),
        dump_default="farmer",
        load_default="farmer",
    )

    # Account activation/suspension is a moderation concern, not
    # self-service -- clients cannot flip this via a normal profile update.
    is_active = fields.Boolean(dump_only=True)

    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    profile = fields.Nested(
        "ProfileSchema",
        exclude=("user_id",),
        dump_only=True,
    )
