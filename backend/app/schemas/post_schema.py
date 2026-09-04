from marshmallow import EXCLUDE, fields, validate

from app.extensions import ma


class PostImageSchema(ma.Schema):
    class Meta:
        unknown = EXCLUDE

    id = fields.Integer(dump_only=True)
    post_id = fields.Integer(dump_only=True)
    image_url = fields.String(required=True)
    created_at = fields.DateTime(dump_only=True)


class PostSchema(ma.Schema):
    class Meta:
        unknown = EXCLUDE

    id = fields.Integer(dump_only=True)
    user_id = fields.Integer(dump_only=True)
    community_id = fields.Integer(allow_none=True, load_default=None)
    original_post_id = fields.Integer(dump_only=True, allow_none=True)
    is_announcement = fields.Boolean(load_default=False)

    title = fields.String(
        required=True,
        validate=validate.Length(min=1, max=255),
    )
    content = fields.String(
        required=True,
        validate=validate.Length(min=1),
    )

    video_url = fields.String(allow_none=True, load_default=None)
    view_count = fields.Integer(dump_only=True)

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

    original_post = fields.Nested(
        "PostSchema",
        dump_only=True,
        only=("id", "title", "content", "author", "created_at", "images", "is_announcement", "video_url"),
    )

    like_count = fields.Method("get_like_count", dump_only=True)
    liked_by_me = fields.Method("get_liked_by_me", dump_only=True)
    reaction_counts = fields.Method("get_reaction_counts", dump_only=True)
    my_reaction = fields.Method("get_my_reaction", dump_only=True)
    save_count = fields.Method("get_save_count", dump_only=True)
    saved_by_me = fields.Method("get_saved_by_me", dump_only=True)
    repost_count = fields.Method("get_repost_count", dump_only=True)
    reposted_by_me = fields.Method("get_reposted_by_me", dump_only=True)
    comments_open = fields.Method("get_comments_open", dump_only=True)

    def _root_original(self, post):
        return post.original_post or post

    def get_like_count(self, post):
        return len(post.likes)

    def get_liked_by_me(self, post):
        current_user_id = self.context.get("current_user_id")
        if current_user_id is None:
            return False
        return any(like.user_id == current_user_id for like in post.likes)

    def get_reaction_counts(self, post):
        counts = {}
        for like in post.likes:
            counts[like.reaction_type] = counts.get(like.reaction_type, 0) + 1
        return counts

    def get_my_reaction(self, post):
        current_user_id = self.context.get("current_user_id")
        if current_user_id is None:
            return None
        return next(
            (like.reaction_type for like in post.likes if like.user_id == current_user_id),
            None,
        )

    def get_save_count(self, post):
        return len(post.saves)

    def get_saved_by_me(self, post):
        current_user_id = self.context.get("current_user_id")
        if current_user_id is None:
            return False
        return any(save.user_id == current_user_id for save in post.saves)

    def get_repost_count(self, post):
        return len(self._root_original(post).reposts)

    def get_reposted_by_me(self, post):
        current_user_id = self.context.get("current_user_id")
        if current_user_id is None:
            return False
        root = self._root_original(post)
        return any(repost.user_id == current_user_id for repost in root.reposts)

    def get_comments_open(self, post):
        if post.community_id is None:
            return True
        community = post.community
        return community is not None and community.comments_enabled
