# app/routes/post_routes.py

from flask import Blueprint, jsonify, request

from app.auth.decorators import get_current_user, jwt_required, optional_jwt
from app.errors import ValidationAPIError
from app.schemas import (
    PostSchema,
    comment_schema,
    comments_schema,
    post_image_schema,
    post_schema,
    posts_schema,
)
from app.services import post_service


def _dump_posts_for_viewer(posts, many):
    """
    Dump post(s) with a schema `context` carrying the caller's id, so
    `liked_by_me` can be computed (see PostSchema.get_liked_by_me). A
    fresh Schema instance is used per request -- rather than mutating the
    shared post_schema/posts_schema singletons -- since `context` is
    request-specific and those singletons are module-level, shared across
    concurrent requests. marshmallow 4 no longer accepts `context` as a
    constructor kwarg, so it's set as a post-init attribute instead.
    """
    viewer = get_current_user()
    schema = PostSchema(many=many)
    schema.context = {"current_user_id": viewer.id if viewer else None}
    return schema.dump(posts)

posts_bp = Blueprint("posts", __name__, url_prefix="/api/posts")
comments_bp = Blueprint("comments", __name__, url_prefix="/api/comments")


# --- Posts ---------------------------------------------------------------

@posts_bp.get("")
@optional_jwt
def list_posts():
    page = request.args.get("page", default=1, type=int)
    per_page = request.args.get("per_page", default=20, type=int)
    posts = post_service.list_posts(page=page, per_page=per_page)
    return jsonify(_dump_posts_for_viewer(posts, many=True)), 200


@posts_bp.post("")
@jwt_required
def create_post():
    data = post_schema.load(request.get_json(silent=True) or {})
    post = post_service.create_post(get_current_user(), data)
    return jsonify(_dump_posts_for_viewer(post, many=False)), 201


@posts_bp.get("/<int:post_id>")
@optional_jwt
def get_post(post_id):
    post = post_service.get_post_or_404(post_id)
    return jsonify(_dump_posts_for_viewer(post, many=False)), 200


@posts_bp.put("/<int:post_id>")
@jwt_required
def update_post(post_id):
    data = post_schema.load(request.get_json(silent=True) or {}, partial=True)
    post = post_service.update_post(get_current_user(), post_id, data)
    return jsonify(_dump_posts_for_viewer(post, many=False)), 200


@posts_bp.delete("/<int:post_id>")
@jwt_required
def delete_post(post_id):
    post_service.delete_post(get_current_user(), post_id)
    return "", 204



@posts_bp.post("/<int:post_id>/images")
@jwt_required
def add_image(post_id):
    payload = request.get_json(silent=True) or {}
    image_url = payload.get("image_url")
    if not image_url:
        raise ValidationAPIError("image_url is required.")
    image = post_service.add_post_image(get_current_user(), post_id, image_url)
    return jsonify(post_image_schema.dump(image)), 201


@posts_bp.delete("/<int:post_id>/images/<int:image_id>")
@jwt_required
def delete_image(post_id, image_id):
    post_service.delete_post_image(get_current_user(), post_id, image_id)
    return "", 204



@posts_bp.get("/<int:post_id>/comments")
def list_comments(post_id):
    comments = post_service.list_comments(post_id)
    return jsonify(comments_schema.dump(comments)), 200


@posts_bp.post("/<int:post_id>/comments")
@jwt_required
def add_comment(post_id):
    payload = request.get_json(silent=True) or {}
    content = payload.get("content")
    if not content:
        raise ValidationAPIError("content is required.")
    comment = post_service.add_comment(get_current_user(), post_id, content)
    return jsonify(comment_schema.dump(comment)), 201



@comments_bp.put("/<int:comment_id>")
@jwt_required
def update_comment(comment_id):
    payload = request.get_json(silent=True) or {}
    content = payload.get("content")
    if not content:
        raise ValidationAPIError("content is required.")
    comment = post_service.update_comment(get_current_user(), comment_id, content)
    return jsonify(comment_schema.dump(comment)), 200


@comments_bp.delete("/<int:comment_id>")
@jwt_required
def delete_comment(comment_id):
    post_service.delete_comment(get_current_user(), comment_id)
    return "", 204



@posts_bp.post("/<int:post_id>/like")
@jwt_required
def like_post(post_id):
    post_service.like_post(get_current_user(), post_id)
    return jsonify({"message": "Post liked."}), 201


@posts_bp.delete("/<int:post_id>/like")
@jwt_required
def unlike_post(post_id):
    post_service.unlike_post(get_current_user(), post_id)
    return "", 204
