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
    viewer = get_current_user()
    schema = PostSchema(many=many)
    schema.context = {"current_user_id": viewer.id if viewer else None}
    return schema.dump(posts)


posts_bp = Blueprint("posts", __name__, url_prefix="/api/posts")
comments_bp = Blueprint("comments", __name__, url_prefix="/api/comments")


@posts_bp.get("")
@optional_jwt
def list_posts():
    """
    List general-feed posts, newest first.
    ---
    tags:
      - Posts
    parameters:
      - in: query
        name: page
        type: integer
        default: 1
      - in: query
        name: per_page
        type: integer
        default: 20
        description: Capped at 100.
    responses:
      200:
        description: A page of posts.
        schema:
          type: array
          items:
            $ref: '#/definitions/Post'
    """
    page = request.args.get("page", default=1, type=int)
    per_page = request.args.get("per_page", default=20, type=int)
    posts = post_service.list_posts(page=page, per_page=per_page)
    return jsonify(_dump_posts_for_viewer(posts, many=True)), 200


@posts_bp.post("")
@jwt_required
def create_post():
    """
    Create a post, optionally attached to a community.
    ---
    tags:
      - Posts
    security:
      - BearerAuth: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [title, content]
          properties:
            title:
              type: string
              maxLength: 255
            content:
              type: string
            community_id:
              type: integer
              x-nullable: true
            is_announcement:
              type: boolean
              default: false
              description: Requires community_id and community-admin membership.
            images:
              type: array
              items:
                type: object
                properties:
                  image_url:
                    type: string
    responses:
      201:
        description: Post created.
        schema:
          $ref: '#/definitions/Post'
      403:
        description: Not permitted to post (or post an announcement) in this community.
        schema:
          $ref: '#/definitions/Error'
      404:
        description: community_id does not exist.
        schema:
          $ref: '#/definitions/Error'
      422:
        description: Validation failed.
        schema:
          $ref: '#/definitions/Error'
    """
    data = post_schema.load(request.get_json(silent=True) or {})
    post = post_service.create_post(get_current_user(), data)
    return jsonify(_dump_posts_for_viewer(post, many=False)), 201


@posts_bp.get("/saved")
@jwt_required
def list_saved_posts():
    """
    List the current user's saved posts, most recently saved first.
    ---
    tags:
      - Posts
    security:
      - BearerAuth: []
    parameters:
      - in: query
        name: page
        type: integer
        default: 1
      - in: query
        name: per_page
        type: integer
        default: 20
    responses:
      200:
        description: A page of saved posts.
        schema:
          type: array
          items:
            $ref: '#/definitions/Post'
    """
    page = request.args.get("page", default=1, type=int)
    per_page = request.args.get("per_page", default=20, type=int)
    posts = post_service.list_saved_posts(get_current_user(), page=page, per_page=per_page)
    return jsonify(_dump_posts_for_viewer(posts, many=True)), 200


@posts_bp.get("/<int:post_id>")
@optional_jwt
def get_post(post_id):
    """
    Get a single post by id.
    ---
    tags:
      - Posts
    parameters:
      - in: path
        name: post_id
        type: integer
        required: true
    responses:
      200:
        description: The post.
        schema:
          $ref: '#/definitions/Post'
      404:
        description: Post not found.
        schema:
          $ref: '#/definitions/Error'
    """
    post = post_service.get_post_or_404(post_id)
    return jsonify(_dump_posts_for_viewer(post, many=False)), 200


@posts_bp.put("/<int:post_id>")
@jwt_required
def update_post(post_id):
    """
    Update a post. Owner (or a global admin) only.
    ---
    tags:
      - Posts
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: post_id
        type: integer
        required: true
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            title:
              type: string
              maxLength: 255
            content:
              type: string
    responses:
      200:
        description: Post updated.
        schema:
          $ref: '#/definitions/Post'
      403:
        description: Not the post owner.
        schema:
          $ref: '#/definitions/Error'
      404:
        description: Post not found.
        schema:
          $ref: '#/definitions/Error'
    """
    data = post_schema.load(request.get_json(silent=True) or {}, partial=True)
    post = post_service.update_post(get_current_user(), post_id, data)
    return jsonify(_dump_posts_for_viewer(post, many=False)), 200


@posts_bp.delete("/<int:post_id>")
@jwt_required
def delete_post(post_id):
    """
    Delete a post.

    Allowed for the post's author, a global admin (role=admin), or a
    community admin deleting a post that belongs to that community.
    Deleting a repost only removes the repost -- the original post is
    unaffected. Deleting an original post also removes its reposts,
    comments, reactions, and saves.
    ---
    tags:
      - Posts
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: post_id
        type: integer
        required: true
    responses:
      204:
        description: Post deleted.
      401:
        description: Missing or invalid token.
        schema:
          $ref: '#/definitions/Error'
      403:
        description: Not the post owner and not an authorized community admin.
        schema:
          $ref: '#/definitions/Error'
      404:
        description: Post not found.
        schema:
          $ref: '#/definitions/Error'
    """
    post_service.delete_post(get_current_user(), post_id)
    return "", 204


@posts_bp.post("/<int:post_id>/images")
@jwt_required
def add_image(post_id):
    """
    Attach an image to a post. Owner (or a global admin) only.
    ---
    tags:
      - Posts
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: post_id
        type: integer
        required: true
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [image_url]
          properties:
            image_url:
              type: string
    responses:
      201:
        description: Image attached.
        schema:
          $ref: '#/definitions/PostImage'
      403:
        description: Not the post owner.
        schema:
          $ref: '#/definitions/Error'
      404:
        description: Post not found.
        schema:
          $ref: '#/definitions/Error'
      422:
        description: image_url is required.
        schema:
          $ref: '#/definitions/Error'
    """
    payload = request.get_json(silent=True) or {}
    image_url = payload.get("image_url")
    if not image_url:
        raise ValidationAPIError("image_url is required.")
    image = post_service.add_post_image(get_current_user(), post_id, image_url)
    return jsonify(post_image_schema.dump(image)), 201


@posts_bp.delete("/<int:post_id>/images/<int:image_id>")
@jwt_required
def delete_image(post_id, image_id):
    """
    Remove an image from a post. Owner (or a global admin) only.
    ---
    tags:
      - Posts
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: post_id
        type: integer
        required: true
      - in: path
        name: image_id
        type: integer
        required: true
    responses:
      204:
        description: Image removed.
      403:
        description: Not the post owner.
        schema:
          $ref: '#/definitions/Error'
      404:
        description: Post or image not found.
        schema:
          $ref: '#/definitions/Error'
    """
    post_service.delete_post_image(get_current_user(), post_id, image_id)
    return "", 204


@posts_bp.get("/<int:post_id>/comments")
def list_comments(post_id):
    """
    List a post's comments, oldest first.
    ---
    tags:
      - Comments
    parameters:
      - in: path
        name: post_id
        type: integer
        required: true
    responses:
      200:
        description: The post's comments.
        schema:
          type: array
          items:
            $ref: '#/definitions/Comment'
      404:
        description: Post not found.
        schema:
          $ref: '#/definitions/Error'
    """
    comments = post_service.list_comments(post_id)
    return jsonify(comments_schema.dump(comments)), 200


@posts_bp.post("/<int:post_id>/comments")
@jwt_required
def add_comment(post_id):
    """
    Add a comment to a post.
    ---
    tags:
      - Comments
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: post_id
        type: integer
        required: true
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [content]
          properties:
            content:
              type: string
    responses:
      201:
        description: Comment created.
        schema:
          $ref: '#/definitions/Comment'
      403:
        description: >
          Comments are closed by the community admin, or not permitted
          for this viewer.
        schema:
          $ref: '#/definitions/Error'
      404:
        description: Post not found.
        schema:
          $ref: '#/definitions/Error'
      422:
        description: content is required.
        schema:
          $ref: '#/definitions/Error'
    """
    payload = request.get_json(silent=True) or {}
    content = payload.get("content")
    if not content:
        raise ValidationAPIError("content is required.")
    comment = post_service.add_comment(get_current_user(), post_id, content)
    return jsonify(comment_schema.dump(comment)), 201


@comments_bp.put("/<int:comment_id>")
@jwt_required
def update_comment(comment_id):
    """
    Update a comment. Author only.
    ---
    tags:
      - Comments
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: comment_id
        type: integer
        required: true
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [content]
          properties:
            content:
              type: string
    responses:
      200:
        description: Comment updated.
        schema:
          $ref: '#/definitions/Comment'
      403:
        description: Not the comment's author.
        schema:
          $ref: '#/definitions/Error'
      404:
        description: Comment not found.
        schema:
          $ref: '#/definitions/Error'
    """
    payload = request.get_json(silent=True) or {}
    content = payload.get("content")
    if not content:
        raise ValidationAPIError("content is required.")
    comment = post_service.update_comment(get_current_user(), comment_id, content)
    return jsonify(comment_schema.dump(comment)), 200


@comments_bp.delete("/<int:comment_id>")
@jwt_required
def delete_comment(comment_id):
    """
    Delete a comment. Author only.
    ---
    tags:
      - Comments
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: comment_id
        type: integer
        required: true
    responses:
      204:
        description: Comment deleted.
      403:
        description: Not the comment's author.
        schema:
          $ref: '#/definitions/Error'
      404:
        description: Comment not found.
        schema:
          $ref: '#/definitions/Error'
    """
    post_service.delete_comment(get_current_user(), comment_id)
    return "", 204


@posts_bp.post("/<int:post_id>/like")
@jwt_required
def like_post(post_id):
    """
    Like a post (shorthand for a "like"-type reaction).
    ---
    tags:
      - Reactions
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: post_id
        type: integer
        required: true
    responses:
      201:
        description: Post liked.
        schema:
          type: object
          properties:
            message:
              type: string
      404:
        description: Post not found.
        schema:
          $ref: '#/definitions/Error'
      409:
        description: Already liked this post.
        schema:
          $ref: '#/definitions/Error'
    """
    post_service.like_post(get_current_user(), post_id)
    return jsonify({"message": "Post liked."}), 201


@posts_bp.delete("/<int:post_id>/like")
@jwt_required
def unlike_post(post_id):
    """
    Remove the current user's like from a post.
    ---
    tags:
      - Reactions
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: post_id
        type: integer
        required: true
    responses:
      204:
        description: Like removed.
      404:
        description: Post was not liked by this user.
        schema:
          $ref: '#/definitions/Error'
    """
    post_service.unlike_post(get_current_user(), post_id)
    return "", 204


@posts_bp.post("/<int:post_id>/reactions")
@jwt_required
def add_reaction(post_id):
    """
    Set (or replace) the current user's reaction on a post.
    ---
    tags:
      - Reactions
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: post_id
        type: integer
        required: true
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [reaction_type]
          properties:
            reaction_type:
              type: string
              enum: [like, love, funny, wow, sad, fire]
    responses:
      201:
        description: Reaction set.
        schema:
          type: object
          properties:
            reaction_type:
              type: string
      404:
        description: Post not found.
        schema:
          $ref: '#/definitions/Error'
      422:
        description: reaction_type is required or invalid.
        schema:
          $ref: '#/definitions/Error'
    """
    payload = request.get_json(silent=True) or {}
    reaction_type = payload.get("reaction_type")
    if not reaction_type:
        raise ValidationAPIError("reaction_type is required.")
    reaction = post_service.set_reaction(get_current_user(), post_id, reaction_type)
    return jsonify({"reaction_type": reaction.reaction_type}), 201


@posts_bp.delete("/<int:post_id>/reactions")
@jwt_required
def remove_reaction(post_id):
    """
    Remove the current user's reaction from a post.
    ---
    tags:
      - Reactions
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: post_id
        type: integer
        required: true
    responses:
      204:
        description: Reaction removed.
      404:
        description: This user has not reacted to the post.
        schema:
          $ref: '#/definitions/Error'
    """
    post_service.remove_reaction(get_current_user(), post_id)
    return "", 204


@posts_bp.post("/<int:post_id>/save")
@jwt_required
def save_post(post_id):
    """
    Save a post for later.
    ---
    tags:
      - Posts
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: post_id
        type: integer
        required: true
    responses:
      201:
        description: Post saved.
        schema:
          type: object
          properties:
            message:
              type: string
      404:
        description: Post not found.
        schema:
          $ref: '#/definitions/Error'
      409:
        description: Already saved this post.
        schema:
          $ref: '#/definitions/Error'
    """
    post_service.save_post(get_current_user(), post_id)
    return jsonify({"message": "Post saved."}), 201


@posts_bp.delete("/<int:post_id>/save")
@jwt_required
def unsave_post(post_id):
    """
    Remove a post from the current user's saved posts.
    ---
    tags:
      - Posts
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: post_id
        type: integer
        required: true
    responses:
      204:
        description: Post unsaved.
      404:
        description: Post was not saved by this user.
        schema:
          $ref: '#/definitions/Error'
    """
    post_service.unsave_post(get_current_user(), post_id)
    return "", 204


@posts_bp.post("/<int:post_id>/repost")
@jwt_required
def repost_post(post_id):
    """
    Repost a post. Reposting a repost attributes to its root original.
    ---
    tags:
      - Posts
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: post_id
        type: integer
        required: true
      - in: body
        name: body
        schema:
          type: object
          properties:
            content:
              type: string
              description: Optional commentary added on top of the reposted content.
    responses:
      201:
        description: Repost created.
        schema:
          $ref: '#/definitions/Post'
      404:
        description: Post not found.
        schema:
          $ref: '#/definitions/Error'
      409:
        description: This post's root original was already reposted by this user.
        schema:
          $ref: '#/definitions/Error'
    """
    payload = request.get_json(silent=True) or {}
    content = payload.get("content")
    repost = post_service.repost_post(get_current_user(), post_id, content)
    return jsonify(_dump_posts_for_viewer(repost, many=False)), 201


@posts_bp.delete("/<int:post_id>/repost")
@jwt_required
def unrepost_post(post_id):
    """
    Remove the current user's repost of a post (does not delete the original).
    ---
    tags:
      - Posts
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: post_id
        type: integer
        required: true
    responses:
      204:
        description: Repost removed.
      404:
        description: This user has not reposted this post.
        schema:
          $ref: '#/definitions/Error'
    """
    post_service.unrepost_post(get_current_user(), post_id)
    return "", 204
