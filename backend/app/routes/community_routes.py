from flask import Blueprint, jsonify, request

from app.auth.decorators import get_current_user, jwt_required, optional_jwt
from app.errors import ValidationAPIError
from app.schemas import CommunitySchema, PostSchema, community_schema
from app.services import community_service, post_service

communities_bp = Blueprint("communities", __name__, url_prefix="/api/communities")


def _dump_posts_for_viewer(posts):
    viewer = get_current_user()
    schema = PostSchema(many=True)
    schema.context = {"current_user_id": viewer.id if viewer else None}
    return schema.dump(posts)


def _dump_community_for_viewer(community, many=False):
    viewer = get_current_user()
    schema = CommunitySchema(many=many)
    schema.context = {"current_user_id": viewer.id if viewer else None}
    return schema.dump(community)


@communities_bp.get("")
@optional_jwt
def list_communities():
    """
    List communities, newest first.
    ---
    tags:
      - Communities
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
        description: A page of communities.
        schema:
          type: array
          items:
            $ref: '#/definitions/Community'
    """
    page = request.args.get("page", default=1, type=int)
    per_page = request.args.get("per_page", default=20, type=int)
    communities = community_service.list_communities(page=page, per_page=per_page)
    return jsonify(_dump_community_for_viewer(communities, many=True)), 200


@communities_bp.post("")
@jwt_required
def create_community():
    """
    Create a community. The creator becomes its first admin member.
    ---
    tags:
      - Communities
    security:
      - BearerAuth: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [name]
          properties:
            name:
              type: string
              maxLength: 150
            description:
              type: string
              x-nullable: true
            image_url:
              type: string
              x-nullable: true
            posting_permission:
              type: string
              enum: [everyone, experts_only, admins_only]
            messaging_permission:
              type: string
              enum: [everyone, experts_only, admins_only]
            comments_enabled:
              type: boolean
    responses:
      201:
        description: Community created.
        schema:
          $ref: '#/definitions/Community'
      409:
        description: A community with this name already exists.
        schema:
          $ref: '#/definitions/Error'
      422:
        description: Validation failed.
        schema:
          $ref: '#/definitions/Error'
    """
    data = community_schema.load(request.get_json(silent=True) or {})
    community = community_service.create_community(get_current_user(), data)
    return jsonify(_dump_community_for_viewer(community)), 201


@communities_bp.get("/<int:community_id>")
@optional_jwt
def get_community(community_id):
    """
    Get a single community by id.
    ---
    tags:
      - Communities
    parameters:
      - in: path
        name: community_id
        type: integer
        required: true
    responses:
      200:
        description: The community.
        schema:
          $ref: '#/definitions/Community'
      404:
        description: Community not found.
        schema:
          $ref: '#/definitions/Error'
    """
    community = community_service.get_community_or_404(community_id)
    return jsonify(_dump_community_for_viewer(community)), 200


@communities_bp.put("/<int:community_id>")
@jwt_required
def update_community(community_id):
    """
    Update a community's settings. Community admin only.
    ---
    tags:
      - Communities
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: community_id
        type: integer
        required: true
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            name:
              type: string
              maxLength: 150
            description:
              type: string
              x-nullable: true
            image_url:
              type: string
              x-nullable: true
            posting_permission:
              type: string
              enum: [everyone, experts_only, admins_only]
            messaging_permission:
              type: string
              enum: [everyone, experts_only, admins_only]
            comments_enabled:
              type: boolean
    responses:
      200:
        description: Community updated.
        schema:
          $ref: '#/definitions/Community'
      403:
        description: Not a community admin.
        schema:
          $ref: '#/definitions/Error'
      404:
        description: Community not found.
        schema:
          $ref: '#/definitions/Error'
    """
    data = community_schema.load(request.get_json(silent=True) or {}, partial=True)
    community = community_service.update_community(get_current_user(), community_id, data)
    return jsonify(_dump_community_for_viewer(community)), 200


@communities_bp.delete("/<int:community_id>")
@jwt_required
def delete_community(community_id):
    """
    Delete a community. Creator (or a global admin) only.
    ---
    tags:
      - Communities
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: community_id
        type: integer
        required: true
    responses:
      204:
        description: Community deleted.
      403:
        description: Not the community's creator.
        schema:
          $ref: '#/definitions/Error'
      404:
        description: Community not found.
        schema:
          $ref: '#/definitions/Error'
    """
    community_service.delete_community(get_current_user(), community_id)
    return "", 204


@communities_bp.post("/<int:community_id>/members")
@jwt_required
def join_community(community_id):
    """
    Join a community as a member.
    ---
    tags:
      - Communities
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: community_id
        type: integer
        required: true
    responses:
      201:
        description: Joined.
        schema:
          type: object
          properties:
            message:
              type: string
      404:
        description: Community not found.
        schema:
          $ref: '#/definitions/Error'
      409:
        description: Already a member.
        schema:
          $ref: '#/definitions/Error'
    """
    community_service.join_community(get_current_user(), community_id)
    return jsonify({"message": "Joined community."}), 201


@communities_bp.delete("/<int:community_id>/members")
@jwt_required
def leave_community(community_id):
    """
    Leave a community. The creator cannot leave their own community.
    ---
    tags:
      - Communities
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: community_id
        type: integer
        required: true
    responses:
      204:
        description: Left the community.
      403:
        description: The creator cannot leave their own community.
        schema:
          $ref: '#/definitions/Error'
      404:
        description: Not a member of this community.
        schema:
          $ref: '#/definitions/Error'
    """
    community_service.leave_community(get_current_user(), community_id)
    return "", 204


@communities_bp.post("/<int:community_id>/follow")
@jwt_required
def follow_community(community_id):
    """
    Follow a community.
    ---
    tags:
      - Communities
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: community_id
        type: integer
        required: true
    responses:
      201:
        description: Following.
        schema:
          type: object
          properties:
            isFollowing:
              type: boolean
      404:
        description: Community not found.
        schema:
          $ref: '#/definitions/Error'
      409:
        description: Already following this community.
        schema:
          $ref: '#/definitions/Error'
    """
    community_service.follow_community(get_current_user(), community_id)
    return jsonify({"isFollowing": True}), 201


@communities_bp.delete("/<int:community_id>/follow")
@jwt_required
def unfollow_community(community_id):
    """
    Unfollow a community.
    ---
    tags:
      - Communities
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: community_id
        type: integer
        required: true
    responses:
      200:
        description: No longer following.
        schema:
          type: object
          properties:
            isFollowing:
              type: boolean
      404:
        description: Community not found or not being followed.
        schema:
          $ref: '#/definitions/Error'
    """
    community_service.unfollow_community(get_current_user(), community_id)
    return jsonify({"isFollowing": False}), 200


@communities_bp.patch("/<int:community_id>/members/<int:user_id>")
@jwt_required
def update_member_role(community_id, user_id):
    """
    Promote/demote a community member. Community admin only.
    ---
    tags:
      - Communities
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: community_id
        type: integer
        required: true
      - in: path
        name: user_id
        type: integer
        required: true
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [role]
          properties:
            role:
              type: string
              enum: [member, admin]
    responses:
      200:
        description: Role updated.
        schema:
          type: object
          properties:
            message:
              type: string
      403:
        description: Not a community admin, or target is the community's creator.
        schema:
          $ref: '#/definitions/Error'
      404:
        description: Community not found, or target is not a member.
        schema:
          $ref: '#/definitions/Error'
      422:
        description: role is required or invalid.
        schema:
          $ref: '#/definitions/Error'
    """
    payload = request.get_json(silent=True) or {}
    role = payload.get("role")
    if not role:
        raise ValidationAPIError("role is required.")
    community_service.set_member_role(get_current_user(), community_id, user_id, role)
    return jsonify({"message": "Member role updated."}), 200


@communities_bp.delete("/<int:community_id>/members/<int:user_id>")
@jwt_required
def remove_member(community_id, user_id):
    """
    Remove a member from a community. Community admin only.
    ---
    tags:
      - Communities
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: community_id
        type: integer
        required: true
      - in: path
        name: user_id
        type: integer
        required: true
    responses:
      204:
        description: Member removed.
      403:
        description: Not a community admin, or target is the community's creator.
        schema:
          $ref: '#/definitions/Error'
      404:
        description: Community not found, or target is not a member.
        schema:
          $ref: '#/definitions/Error'
    """
    community_service.remove_member(get_current_user(), community_id, user_id)
    return "", 204


@communities_bp.get("/<int:community_id>/posts")
@optional_jwt
def list_community_posts(community_id):
    """
    List a community's posts, newest first.
    ---
    tags:
      - Communities
    parameters:
      - in: path
        name: community_id
        type: integer
        required: true
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
        description: A page of the community's posts.
        schema:
          type: array
          items:
            $ref: '#/definitions/Post'
      404:
        description: Community not found.
        schema:
          $ref: '#/definitions/Error'
    """
    community_service.get_community_or_404(community_id)
    page = request.args.get("page", default=1, type=int)
    per_page = request.args.get("per_page", default=20, type=int)
    posts = post_service.list_posts(page=page, per_page=per_page, community_id=community_id)
    return jsonify(_dump_posts_for_viewer(posts)), 200
