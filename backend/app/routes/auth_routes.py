# app/routes/auth_routes.py

from flask import Blueprint, jsonify, request

from app.auth.decorators import get_current_user, jwt_required
from app.auth.jwt import encode_token
from app.errors import ValidationAPIError
from app.schemas import user_schema
from app.services import auth_service

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.post("/register")
def register():
    data = user_schema.load(request.get_json(silent=True) or {})
    user = auth_service.register_user(data)
    token = encode_token(user.id)
    return jsonify({"token": token, "user": user_schema.dump(user)}), 201


@auth_bp.post("/login")
def login():
    payload = request.get_json(silent=True) or {}
    identifier = payload.get("username") or payload.get("email")
    password = payload.get("password")

    if not identifier or not password:
        raise ValidationAPIError("username or email, and password, are required.")

    user = auth_service.authenticate_user(identifier, password)
    token = encode_token(user.id)
    return jsonify({"token": token, "user": user_schema.dump(user)}), 200


@auth_bp.get("/me")
@jwt_required
def me():
    return jsonify(user_schema.dump(get_current_user())), 200
