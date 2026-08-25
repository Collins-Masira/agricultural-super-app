# app/routes/user_routes.py

from flask import Blueprint, jsonify, request

from app.auth.decorators import get_current_user, jwt_required
from app.schemas import profile_schema, user_public_schema
from app.services import user_service

users_bp = Blueprint("users", __name__, url_prefix="/api/users")


@users_bp.get("/<int:user_id>")
def get_user(user_id):
    """Public profile view -- no auth required, no private fields exposed."""
    user = user_service.get_user_or_404(user_id)
    return jsonify(user_public_schema.dump(user)), 200


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
