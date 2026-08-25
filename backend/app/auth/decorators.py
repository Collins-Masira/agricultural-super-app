# app/auth/decorators.py

from functools import wraps

import jwt as pyjwt
from flask import g, request

from app.auth.jwt import decode_token
from app.errors import UnauthorizedError
from app.extensions import db
from app.models import User


def jwt_required(view_func):
    """
    Require a valid `Authorization: Bearer <token>` header. On success,
    the authenticated User instance is attached to `flask.g.current_user`
    for the duration of the request; retrieve it with get_current_user().

    Deliberately re-checks `user.is_active` on every request rather than
    trusting the token alone -- a token issued before an account was
    deactivated must not keep working until it expires.
    """

    @wraps(view_func)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            raise UnauthorizedError("Missing or malformed Authorization header.")

        token = auth_header.split(" ", 1)[1].strip()

        try:
            payload = decode_token(token)
        except pyjwt.ExpiredSignatureError:
            raise UnauthorizedError("Token has expired.")
        except pyjwt.InvalidTokenError:
            raise UnauthorizedError("Invalid token.")

        try:
            user_id = int(payload["sub"])
        except (KeyError, TypeError, ValueError):
            raise UnauthorizedError("Invalid token payload.")

        user = db.session.get(User, user_id)
        if user is None or not user.is_active:
            raise UnauthorizedError("User not found or inactive.")

        g.current_user = user
        return view_func(*args, **kwargs)

    return wrapper


def get_current_user():
    """
    Return the authenticated User for the current request. Only valid
    inside a view wrapped with @jwt_required -- returns None otherwise
    rather than raising, since some routes call this optionally.
    """
    return g.get("current_user")
