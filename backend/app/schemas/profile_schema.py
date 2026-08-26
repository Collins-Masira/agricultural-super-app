from marshmallow import EXCLUDE, fields, validate

from app.extensions import ma


class ProfileSchema(ma.Schema):
    """
    Represents a User's profile (1:1 with users.id via profiles.user_id).
    """

    class Meta:
        unknown = EXCLUDE

    id = fields.Integer(dump_only=True)
    user_id = fields.Integer(dump_only=True)

    first_name = fields.String(
        allow_none=True,
        validate=validate.Length(max=100),
    )
    last_name = fields.String(
        allow_none=True,
        validate=validate.Length(max=100),
    )
    bio = fields.String(allow_none=True)
    location = fields.String(
        allow_none=True,
        validate=validate.Length(max=255),
    )
    profile_image_url = fields.String(allow_none=True)
    phone_number = fields.String(
        allow_none=True,
        validate=validate.Length(max=30),
    )

    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
