# app/auth/decorators.py

from functools import wraps

import jwt as pyjwt
from flask import g, request

from app.auth.jwt import decode_token
from app.errors import ForbiddenError, InvalidTokenError
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

    Every failure here raises InvalidTokenError (not the more general
    UnauthorizedError) specifically because these all mean "your session
    itself is dead" -- the frontend's global 401 handler (http.js) uses
    that distinction to force a logout only for these, not for ordinary
    wrong-password-style 401s on an otherwise-valid session (e.g. login,
    change-password) that a still-authenticated request could also
    surface. See app/errors.py's InvalidTokenError docstring.
    """

    @wraps(view_func)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            raise InvalidTokenError("Missing or malformed Authorization header.")

        token = auth_header.split(" ", 1)[1].strip()

        try:
            payload = decode_token(token)
        except pyjwt.ExpiredSignatureError:
            raise InvalidTokenError("Token has expired.")
        except pyjwt.InvalidTokenError:
            raise InvalidTokenError("Invalid token.")

        try:
            user_id = int(payload["sub"])
        except (KeyError, TypeError, ValueError):
            raise InvalidTokenError("Invalid token payload.")

        user = db.session.get(User, user_id)
        if user is None or not user.is_active:
            raise InvalidTokenError("User not found or inactive.")

        g.current_user = user
        return view_func(*args, **kwargs)

    return wrapper


def admin_required(view_func):
    """
    Require a valid token AND role == "admin". Composed on top of
    jwt_required (not a copy of it) so authentication and authorization
    can never drift out of sync -- every admin route gets the exact same
    token/expiry/deactivation checks as every other authenticated route,
    plus this one extra role check.

    This is the ONLY place admin access is enforced. The frontend also
    hides admin UI from non-admins for a good user experience, but that
    is a UX nicety, not a security boundary -- this decorator is.
    """

    @wraps(view_func)
    @jwt_required
    def wrapper(*args, **kwargs):
        if get_current_user().role != "admin":
            raise ForbiddenError("Admin privileges are required for this action.")
        return view_func(*args, **kwargs)

    return wrapper


def get_current_user():
    """
    Return the authenticated User for the current request. Only valid
    inside a view wrapped with @jwt_required -- returns None otherwise
    rather than raising, since some routes call this optionally.
    """
    return g.get("current_user")


def optional_jwt(view_func):
    """
    Like @jwt_required, but never raises: a missing, malformed, expired,
    or invalid token simply leaves flask.g.current_user unset (None).

    For public read endpoints (list/get posts) that still want to
    personalize the response -- e.g. `liked_by_me` -- when the caller
    happens to be authenticated, without making auth mandatory to view
    the resource at all.
    """

    @wraps(view_func)
    def wrapper(*args, **kwargs):
        # Explicitly reset first, rather than only setting it when a
        # valid token is found -- `g` lives on the application context,
        # not strictly a fresh one per request (e.g. Flask reuses an
        # already-active app context if one is already on the stack), so
        # a prior authenticated request's g.current_user must never be
        # allowed to silently leak into this one.
        g.current_user = None

        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1].strip()
            try:
                payload = decode_token(token)
                user = db.session.get(User, int(payload["sub"]))
                if user is not None and user.is_active:
                    g.current_user = user
            except (pyjwt.PyJWTError, KeyError, TypeError, ValueError):
                pass  # Treated as anonymous -- this endpoint doesn't require auth.

        return view_func(*args, **kwargs)

    return wrapper
