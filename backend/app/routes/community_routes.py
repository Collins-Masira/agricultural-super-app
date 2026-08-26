# app/routes/community_routes.py

from flask import Blueprint, jsonify, request

from app.auth.decorators import get_current_user, jwt_required, optional_jwt
from app.schemas import communities_schema, community_schema
from app.services import community_service

communities_bp = Blueprint("communities", __name__, url_prefix="/api/communities")


@communities_bp.get("")
@optional_jwt
def list_communities():
    page = request.args.get("page", default=1, type=int)
    per_page = request.args.get("per_page", default=20, type=int)
    communities = community_service.list_communities(
        page=page, per_page=per_page, current_user=get_current_user()
    )
    return jsonify(communities_schema.dump(communities)), 200


@communities_bp.post("")
@jwt_required
def create_community():
    data = community_schema.load(request.get_json(silent=True) or {})
    community = community_service.create_community(get_current_user(), data)
    return jsonify(community_schema.dump(community)), 201


@communities_bp.get("/<int:community_id>")
@optional_jwt
def get_community(community_id):
    community = community_service.get_community_or_404(community_id)
    community_service._annotate_follow_status([community], get_current_user())
    return jsonify(community_schema.dump(community)), 200


@communities_bp.put("/<int:community_id>")
@jwt_required
def update_community(community_id):
    data = community_schema.load(request.get_json(silent=True) or {}, partial=True)
    community = community_service.update_community(get_current_user(), community_id, data)
    return jsonify(community_schema.dump(community)), 200


@communities_bp.delete("/<int:community_id>")
@jwt_required
def delete_community(community_id):
    community_service.delete_community(get_current_user(), community_id)
    return "", 204


@communities_bp.post("/<int:community_id>/members")
@jwt_required
def join_community(community_id):
    community_service.join_community(get_current_user(), community_id)
    return jsonify({"message": "Joined community."}), 201


@communities_bp.delete("/<int:community_id>/members")
@jwt_required
def leave_community(community_id):
    community_service.leave_community(get_current_user(), community_id)
    return "", 204


@communities_bp.post("/<int:community_id>/follow")
@jwt_required
def follow_community(community_id):
    community_service.follow_community(get_current_user(), community_id)
    return jsonify({"isFollowing": True}), 201


@communities_bp.delete("/<int:community_id>/follow")
@jwt_required
def unfollow_community(community_id):
    community_service.unfollow_community(get_current_user(), community_id)
    return jsonify({"isFollowing": False}), 200
