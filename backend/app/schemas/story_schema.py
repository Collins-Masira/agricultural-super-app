# app/schemas/story_schema.py

from marshmallow import EXCLUDE, fields, validate

from app.extensions import ma


class StorySchema(ma.Schema):
    class Meta:
        unknown = EXCLUDE

    id = fields.Integer(dump_only=True)
    user_id = fields.Integer(dump_only=True)

    image_url = fields.String(
        required=True,
        validate=validate.Length(min=1),
    )
    caption = fields.String(
        allow_none=True,
        load_default=None,
        validate=validate.Length(max=120),
    )

    created_at = fields.DateTime(dump_only=True)
    expires_at = fields.DateTime(dump_only=True)

    author = fields.Nested(
        "UserPublicSchema",
        dump_only=True,
        attribute="user",
    )
