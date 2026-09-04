
"""
Shared password policy, used everywhere a password is ever set:
registration, password reset, password change. Deliberately a single
source of truth -- see docs/project/requirements.md NFR-1.1 ("Passwords
are stored using a strong, modern hashing algorithm") and the project's
broader security posture -- rather than duplicating the rule set at each
call site, which is how policies quietly drift out of sync.

Two entry points:
  - password_requirement_failures(password) -> list[str], for callers
    that want to build their own error response (routes).
  - marshmallow_password_validator(password), a thin adapter that raises
    marshmallow.ValidationError for use as a Schema field's `validate`.
"""

import re

from marshmallow import ValidationError

PASSWORD_MIN_LENGTH = 8

_REQUIREMENTS = [
    ("length", f"At least {PASSWORD_MIN_LENGTH} characters.", lambda pw: len(pw) >= PASSWORD_MIN_LENGTH),
    ("uppercase", "One uppercase letter.", lambda pw: re.search(r"[A-Z]", pw) is not None),
    ("lowercase", "One lowercase letter.", lambda pw: re.search(r"[a-z]", pw) is not None),
    ("number", "One number.", lambda pw: re.search(r"\d", pw) is not None),
    (
        "special",
        "One special character (e.g. ! @ # $ % ^ & *).",
        lambda pw: re.search(r"[^A-Za-z0-9]", pw) is not None,
    ),
]


def password_requirement_failures(password):
    """
    Returns a list of human-readable messages for every unmet
    requirement (empty list means the password is strong enough). Kept
    as *all* failures, not just the first, so a UI (or an API client)
    can show the caller everything that's still missing in one pass
    instead of a frustrating one-error-at-a-time loop.
    """
    password = password or ""
    return [message for _key, message, check in _REQUIREMENTS if not check(password)]


def marshmallow_password_validator(password):
    failures = password_requirement_failures(password)
    if failures:
        raise ValidationError(failures)
