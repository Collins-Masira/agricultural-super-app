# app/schemas/post_schema.py

from marshmallow import EXCLUDE, fields, validate

from app.extensions import ma


class PostImageSchema(ma.Schema):
    """
    A single image attached to a Post. Nested (many=True) inside
    PostSchema for both read and create/update flows -- id, post_id, and
    created_at are dump_only and are therefore ignored automatically if
    present on load.
    """

    class Meta:
        # Silently drop dump_only fields (id, *_id, created_at,
        # updated_at, ...) and any other unrecognized keys instead
        # of rejecting the whole payload with 'Unknown field'.
        # This matters because clients routinely round-trip a full
        # GET response back into a PUT/PATCH body.
        unknown = EXCLUDE

    id = fields.Integer(dump_only=True)
    post_id = fields.Integer(dump_only=True)
    image_url = fields.String(required=True)
    created_at = fields.DateTime(dump_only=True)


class PostSchema(ma.Schema):
    """
    Represents a Post, with its author, images, and comments.

    `comments` is included for read convenience (e.g. a single-post
    detail view) and excludes the redundant post_id on each nested
    comment. Comments are still created/updated via their own resource,
    not written back through this schema.
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

    title = fields.String(
        required=True,
        validate=validate.Length(min=1, max=255),
    )
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

    images = fields.Nested(PostImageSchema, many=True)

    comments = fields.Nested(
        "CommentSchema",
        many=True,
        dump_only=True,
        exclude=("post_id",),
    )

    like_count = fields.Method("get_like_count", dump_only=True)
    liked_by_me = fields.Method("get_liked_by_me", dump_only=True)

    def get_like_count(self, post):
        return len(post.likes)

    def get_liked_by_me(self, post):
        """
        True only when the schema was dumped with a `current_user_id` in
        its context (see post_routes.py) -- routes that don't know the
        caller's identity (no valid token) omit the context key entirely,
        which this defaults to False rather than raising.
        """
        current_user_id = self.context.get("current_user_id")
        if current_user_id is None:
            return False
        return any(like.user_id == current_user_id for like in post.likes)
