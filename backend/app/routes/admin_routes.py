# app/routes/admin_routes.py

from flask import Blueprint, current_app, jsonify, request

from app.auth.decorators import admin_required, get_current_user
from app.errors import ValidationAPIError
from app.schemas import PostSchema, user_schema, users_schema
from app.services import admin_service

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@admin_bp.get("/stats")
@admin_required
def get_stats():
    """
    Dashboard stats: counts, AI provider status, and recent activity.
    ---
    tags:
      - Admin
    security:
      - BearerAuth: []
    responses:
      200:
        description: Aggregate stats.
        schema:
          type: object
          properties:
            users:
              type: integer
            posts:
              type: integer
            comments:
              type: integer
            communities:
              type: integer
            conversations:
              type: integer
            messages:
              type: integer
            ai:
              type: object
            recent_users:
              type: array
              items:
                $ref: '#/definitions/User'
            recent_posts:
              type: array
              items:
                $ref: '#/definitions/Post'
      403:
        description: Not an admin.
        schema:
          $ref: '#/definitions/Error'
    """
    ai_configured = (
        bool(current_app.config.get("ANTHROPIC_API_KEY"))
        if current_app.config.get("AI_PROVIDER", "ollama") == "anthropic"
        else True  # Ollama needs no key -- "configured" just means it's the selected provider.
    )
    stats = admin_service.get_stats(
        ai_provider=current_app.config.get("AI_PROVIDER", "ollama"),
        ai_model=current_app.config.get("AI_MODEL"),
        ai_configured=ai_configured,
    )

    # A fresh PostSchema instance with an explicit (empty) context --
    # PostSchema's like_count/liked_by_me Method fields read
    # self.context, which the shared posts_schema singleton never has
    # set (see post_routes.py's _dump_posts_for_viewer for the same
    # pattern/reasoning). "Liked by me" doesn't mean anything for an
    # admin's recent-activity feed, so the viewer id is left unset.
    recent_posts_schema = PostSchema(many=True)
    recent_posts_schema.context = {"current_user_id": None}

    return jsonify(
        {
            "users": stats["users"],
            "posts": stats["posts"],
            "comments": stats["comments"],
            "communities": stats["communities"],
            "conversations": stats["conversations"],
            "messages": stats["messages"],
            "ai": stats["ai"],
            "recent_users": users_schema.dump(stats["recent_users"]),
            "recent_posts": recent_posts_schema.dump(stats["recent_posts"]),
        }
    ), 200


@admin_bp.get("/users")
@admin_required
def list_users():
    """
    List/search users for moderation.
    ---
    tags:
      - Admin
    security:
      - BearerAuth: []
    parameters:
      - in: query
        name: search
        type: string
      - in: query
        name: role
        type: string
      - in: query
        name: status
        type: string
        enum: [active, inactive]
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
        description: A page of users.
        schema:
          type: object
          properties:
            items:
              type: array
              items:
                $ref: '#/definitions/User'
            page:
              type: integer
            per_page:
              type: integer
            total:
              type: integer
      403:
        description: Not an admin.
        schema:
          $ref: '#/definitions/Error'
    """
    search = request.args.get("search")
    role = request.args.get("role")
    status = request.args.get("status")
    page = request.args.get("page", default=1, type=int)
    per_page = request.args.get("per_page", default=20, type=int)

    result = admin_service.list_users(search=search, role=role, status=status, page=page, per_page=per_page)
    return jsonify(
        {
            "items": users_schema.dump(result["items"]),
            "page": result["page"],
            "per_page": result["per_page"],
            "total": result["total"],
        }
    ), 200


@admin_bp.get("/users/<int:user_id>")
@admin_required
def get_user(user_id):
    """
    Get a single user's full account details.
    ---
    tags:
      - Admin
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: user_id
        type: integer
        required: true
    responses:
      200:
        description: The user.
        schema:
          $ref: '#/definitions/User'
      403:
        description: Not an admin.
        schema:
          $ref: '#/definitions/Error'
      404:
        description: User not found.
        schema:
          $ref: '#/definitions/Error'
    """
    user = admin_service.get_user_or_404(user_id)
    return jsonify(user_schema.dump(user)), 200


@admin_bp.patch("/users/<int:user_id>")
@admin_required
def update_user(user_id):
    """
    Activate/deactivate a user, or change their role.
    ---
    tags:
      - Admin
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: user_id
        type: integer
        required: true
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            is_active:
              type: boolean
            role:
              type: string
    responses:
      200:
        description: User updated.
        schema:
          $ref: '#/definitions/User'
      403:
        description: Not an admin.
        schema:
          $ref: '#/definitions/Error'
      404:
        description: User not found.
        schema:
          $ref: '#/definitions/Error'
      422:
        description: Provide at least one of is_active, role, with the correct type.
        schema:
          $ref: '#/definitions/Error'
    """
    payload = request.get_json(silent=True) or {}
    if "is_active" not in payload and "role" not in payload:
        raise ValidationAPIError("Provide at least one of: is_active, role.")

    is_active = payload.get("is_active")
    if is_active is not None and not isinstance(is_active, bool):
        raise ValidationAPIError("is_active must be a boolean.")

    role = payload.get("role")
    if role is not None and not isinstance(role, str):
        raise ValidationAPIError("role must be a string.")

    user = admin_service.update_user(get_current_user(), user_id, is_active=is_active, role=role)
    return jsonify(user_schema.dump(user)), 200
