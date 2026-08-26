# app/routes/auth_routes.py

from flask import Blueprint, jsonify, request

from app.auth.decorators import get_current_user, jwt_required
from app.auth.jwt import encode_token
from app.errors import ValidationAPIError
from app.schemas import user_schema
from app.services import auth_service
from app.validators import password_requirement_failures

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


@auth_bp.post("/forgot-password")
def forgot_password():
    payload = request.get_json(silent=True) or {}
    email = payload.get("email")
    if not email:
        raise ValidationAPIError("email is required.")

    auth_service.request_password_reset(email)

    # Deliberately identical whether or not the email is registered --
    # see auth_service.request_password_reset for why.
    return jsonify(
        {"message": "If an account exists for that email, a reset link has been sent."}
    ), 200


@auth_bp.post("/reset-password")
def reset_password():
    payload = request.get_json(silent=True) or {}
    token = payload.get("token")
    new_password = payload.get("password")

    if not token or not new_password:
        raise ValidationAPIError("token and password are required.")

    failures = password_requirement_failures(new_password)
    if failures:
        raise ValidationAPIError("Password does not meet the required strength.", payload={"password": failures})

    auth_service.reset_password(token, new_password)
    return jsonify({"message": "Password has been reset. You can now log in."}), 200


@auth_bp.put("/change-password")
@jwt_required
def change_password():
    """
    Auth required -- changes the caller's own password. Distinct from
    reset-password (which proves identity via a mailed token instead of
    a session): this proves identity via the CURRENT password, which is
    why it's the only auth endpoint that needs both the old and new
    values.
    """
    payload = request.get_json(silent=True) or {}
    current_password = payload.get("current_password")
    new_password = payload.get("new_password")

    if not current_password or not new_password:
        raise ValidationAPIError("current_password and new_password are required.")

    failures = password_requirement_failures(new_password)
    if failures:
        raise ValidationAPIError("Password does not meet the required strength.", payload={"password": failures})

    auth_service.change_password(get_current_user(), current_password, new_password)
    return jsonify({"message": "Password changed."}), 200
