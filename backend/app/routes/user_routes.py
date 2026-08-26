# app/routes/user_routes.py

from flask import Blueprint, jsonify, request

from app.auth.decorators import get_current_user, jwt_required, optional_jwt
from app.schemas import PostSchema, profile_schema, user_public_schema, users_public_schema
from app.services import post_service, user_service

users_bp = Blueprint("users", __name__, url_prefix="/api/users")


@users_bp.get("")
def list_users():
    """
    Public user directory. `?role=expert` backs the Experts page;
    `?search=` matches username/first/last name. `?page=`, `?per_page=`
    follow the same pagination convention as posts/communities.
    """
    role = request.args.get("role")
    search = request.args.get("search")
    page = request.args.get("page", default=1, type=int)
    per_page = request.args.get("per_page", default=20, type=int)
    users = user_service.list_users(role=role, search=search, page=page, per_page=per_page)
    return jsonify(users_public_schema.dump(users)), 200


@users_bp.get("/me/following")
@jwt_required
def my_following():
    """The set of user ids the caller currently follows."""
    following_ids = user_service.list_following_ids(get_current_user())
    return jsonify({"following_ids": following_ids}), 200


@users_bp.get("/<int:user_id>")
def get_user(user_id):
    """Public profile view -- no auth required, no private fields exposed."""
    user = user_service.get_user_or_404(user_id)
    return jsonify(user_public_schema.dump(user)), 200


@users_bp.get("/<int:user_id>/posts")
@optional_jwt
def get_user_posts(user_id):
    user_service.get_user_or_404(user_id)
    page = request.args.get("page", default=1, type=int)
    per_page = request.args.get("per_page", default=20, type=int)
    posts = post_service.list_posts_by_user(user_id, page=page, per_page=per_page)
    viewer = get_current_user()
    schema = PostSchema(many=True)
    schema.context = {"current_user_id": viewer.id if viewer else None}
    return jsonify(schema.dump(posts)), 200


@users_bp.get("/<int:user_id>/followers/count")
def get_followers_count(user_id):
    count = user_service.count_followers(user_id)
    return jsonify({"count": count}), 200


@users_bp.put("/me/profile")
@jwt_required
def update_my_profile():
    data = profile_schema.load(request.get_json(silent=True) or {}, partial=True)
    profile = user_service.upsert_own_profile(get_current_user(), data)
    return jsonify(profile_schema.dump(profile)), 200


@users_bp.post("/<int:user_id>/follow")
@jwt_required
def follow(user_id):
    user_service.follow_user(get_current_user(), user_id)
    return jsonify({"message": "Now following user.", "user_id": user_id}), 201


@users_bp.delete("/<int:user_id>/follow")
@jwt_required
def unfollow(user_id):
    user_service.unfollow_user(get_current_user(), user_id)
    return "", 204
