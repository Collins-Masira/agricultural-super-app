# app/services/auth_service.py

from app.errors import ConflictError, UnauthorizedError
from app.extensions import db
from app.models import User


def register_user(data):
    """
    Create a new User from validated schema output.

    `data` is the dict returned by UserSchema.load(): plaintext password
    under the key "password_hash" (see user_schema.py for why), plus
    username/email/role. We pre-check uniqueness for a clean 409 with a
    specific message; the DB-level UNIQUE constraint remains the actual
    source of truth against races (see app/errors.py's IntegrityError
    handler).
    """
    plaintext_password = data.pop("password_hash")

    if db.session.query(User).filter_by(username=data["username"]).first():
        raise ConflictError("Username is already taken.")
    if db.session.query(User).filter_by(email=data["email"]).first():
        raise ConflictError("Email is already registered.")

    user = User(
        username=data["username"],
        email=data["email"],
        role=data.get("role", "farmer"),
    )
    user.set_password(plaintext_password)

    db.session.add(user)
    db.session.commit()
    return user


def authenticate_user(identifier, password):
    """
    Verify credentials for login. `identifier` may be a username or an
    email -- accepting either is a small UX kindness with no security
    cost, since both are already unique, indexed columns.

    Deliberately returns the same error message for "no such user" and
    "wrong password" -- distinguishing them lets an attacker enumerate
    valid usernames/emails.
    """
    user = (
        db.session.query(User)
        .filter((User.username == identifier) | (User.email == identifier))
        .first()
    )
    if user is None or not user.check_password(password):
        raise UnauthorizedError("Invalid username/email or password.")
    if not user.is_active:
        raise UnauthorizedError("This account has been deactivated.")
    return user
