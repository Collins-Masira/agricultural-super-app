# app/models/password_reset_token.py

from app.extensions import utcnow
from app.extensions import db


class PasswordResetToken(db.Model):
    """
    A single-use, expiring password reset token. Only the SHA-256 hash of
    the raw token is stored -- like a password, the raw value must never
    be recoverable from the database, only verifiable against it (see
    app/services/auth_service.py for why this mirrors password hashing).
    """

    __tablename__ = "password_reset_tokens"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    token_hash = db.Column(db.String(64), unique=True, nullable=False)

    expires_at = db.Column(db.DateTime, nullable=False)

    used_at = db.Column(db.DateTime, nullable=True)

    created_at = db.Column(db.DateTime, default=utcnow, nullable=False)

    user = db.relationship("User")
