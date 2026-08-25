# app/services/user_service.py

from app.errors import ConflictError, NotFoundError, ValidationAPIError
from app.extensions import db
from app.models import User, UserFollow


def get_user_or_404(user_id):
    user = db.session.get(User, user_id)
    if user is None:
        raise NotFoundError(f"User {user_id} not found.")
    return user


def upsert_own_profile(current_user, data):
    """
    Create the caller's Profile on first write, or update it on every
    write after. profiles.user_id is unique + not-null in the DBML, so a
    User has at most one Profile -- this is the only place that
    invariant is enforced at the application layer (the DB UNIQUE
    constraint enforces it as the source of truth).
    """
    profile = current_user.profile
    if profile is None:
        from app.models import Profile

        profile = Profile(user_id=current_user.id)
        db.session.add(profile)

    for key, value in data.items():
        setattr(profile, key, value)

    db.session.commit()
    return profile


def follow_user(current_user, target_user_id):
    if current_user.id == target_user_id:
        raise ValidationAPIError("You cannot follow yourself.")

    get_user_or_404(target_user_id)  # 404 before 409: unknown target beats "already following"

    existing = (
        db.session.query(UserFollow)
        .filter_by(follower_id=current_user.id, following_id=target_user_id)
        .first()
    )
    if existing:
        raise ConflictError("You already follow this user.")

    follow = UserFollow(follower_id=current_user.id, following_id=target_user_id)
    db.session.add(follow)
    db.session.commit()
    return follow


def unfollow_user(current_user, target_user_id):
    follow = (
        db.session.query(UserFollow)
        .filter_by(follower_id=current_user.id, following_id=target_user_id)
        .first()
    )
    if follow is None:
        raise NotFoundError("You do not follow this user.")
    db.session.delete(follow)
    db.session.commit()
