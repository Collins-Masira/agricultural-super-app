# app/auth/jwt.py

from datetime import datetime, timedelta, timezone

import jwt
from flask import current_app


def encode_token(user_id):
    """
    Issue a signed access token for the given user id.

    Payload is intentionally minimal: `sub` (subject) is the only claim
    the app actually trusts. `iat`/`exp` are standard JWT claims used by
    the underlying library for expiry enforcement -- we don't embed role
    or other mutable user state in the token itself, because a token
    issued before a role change would otherwise keep granting the old
    permissions until it expires.
    """
    now = datetime.now(timezone.utc)
    expires_in = current_app.config["JWT_ACCESS_TOKEN_EXPIRES_SECONDS"]
    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + timedelta(seconds=expires_in),
    }
    return jwt.encode(
        payload,
        current_app.config["JWT_SECRET_KEY"],
        algorithm=current_app.config["JWT_ALGORITHM"],
    )


def decode_token(token):
    """
    Verify and decode a token. Raises jwt.ExpiredSignatureError or
    jwt.InvalidTokenError (both subclasses of jwt.PyJWTError) on failure
    -- callers (the jwt_required decorator) are responsible for
    translating those into an ApiError with an appropriate HTTP status.
    """
    return jwt.decode(
        token,
        current_app.config["JWT_SECRET_KEY"],
        algorithms=[current_app.config["JWT_ALGORITHM"]],
    )
