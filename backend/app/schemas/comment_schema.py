# app/schemas/comment_schema.py

from marshmallow import EXCLUDE, fields, validate

from app.extensions import ma


class CommentSchema(ma.Schema):
    """
    Represents a Comment on a Post.

    user_id and post_id are both server-controlled: the author comes
    from the authenticated session, the post comes from the route
    (e.g. POST /posts/<post_id>/comments), never from the request body.
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
    post_id = fields.Integer(dump_only=True)

    content = fields.String(
        required=True,
        validate=validate.Length(min=1),
    )

    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    author = fields.Nested(
        "UserPublicSchema",
        dump_only=True,
        attribute="user",
    )
