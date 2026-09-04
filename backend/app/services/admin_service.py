# app/services/admin_service.py

"""
Backend logic for the admin dashboard. Deliberately reuses the existing
models/services rather than introducing parallel ones -- e.g. post,
comment, and community moderation go through post_service /
community_service's existing owner-or-admin checks (see
_assert_owner()/_assert_creator() in those modules), not a duplicated
"admin can do anything" bypass here. This module only adds what doesn't
already exist: aggregate stats, user search/listing, and account
status/role management.
"""

from app.errors import ForbiddenError, NotFoundError, ValidationAPIError
from app.extensions import db
from app.models import (
    Comment,
    Community,
    Conversation,
    Message,
    Post,
    Profile,
    Report,
    User,
)

MAX_PAGE_SIZE = 100
ASSIGNABLE_ROLES = {"farmer", "expert", "admin"}
RECENT_ITEMS_LIMIT = 5


def get_stats(ai_provider, ai_model, ai_configured):
    """
    Every count below is a real, current query against the database --
    nothing here is estimated or hardcoded. "Active users" specifically
    means `is_active=True` (account not deactivated); the schema has no
    "last seen" timestamp to define recency-based activity from, so that
    honest distinction is made explicit rather than implying something
    the data doesn't support.
    """
    total_users = db.session.query(User).count()
    active_users = db.session.query(User).filter_by(is_active=True).count()
    role_counts = {
        role: db.session.query(User).filter_by(role=role).count()
        for role in ASSIGNABLE_ROLES
    }

    recent_users = (
        db.session.query(User).order_by(User.created_at.desc()).limit(RECENT_ITEMS_LIMIT).all()
    )
    recent_posts = (
        db.session.query(Post).order_by(Post.created_at.desc()).limit(RECENT_ITEMS_LIMIT).all()
    )

    return {
        "users": {
            "total": total_users,
            "active": active_users,
            "inactive": total_users - active_users,
            "by_role": role_counts,
        },
        "posts": {"total": db.session.query(Post).count()},
        "comments": {"total": db.session.query(Comment).count()},
        "communities": {"total": db.session.query(Community).count()},
        "conversations": {"total": db.session.query(Conversation).count()},
        "messages": {"total": db.session.query(Message).count()},
        "reports": {
            "total": db.session.query(Report).count(),
            "pending": db.session.query(Report).filter_by(status="pending").count(),
        },
        "recent_users": recent_users,
        "recent_posts": recent_posts,
        "ai": {"provider": ai_provider, "model": ai_model, "configured": ai_configured},
    }


def list_users(search=None, role=None, status=None, page=1, per_page=20):
    """
    Unlike the public user directory (user_service.list_users), this
    returns a total count alongside the page -- an admin management table
    needs real pagination controls, not just "did I get a full page back".
    """
    per_page = min(per_page, MAX_PAGE_SIZE)
    query = db.session.query(User)

    if role:
        query = query.filter(User.role == role)
    if status == "active":
        query = query.filter(User.is_active.is_(True))
    elif status == "inactive":
        query = query.filter(User.is_active.is_(False))
    if search:
        pattern = f"%{search}%"
        query = query.outerjoin(Profile, Profile.user_id == User.id).filter(
            db.or_(
                User.username.ilike(pattern),
                User.email.ilike(pattern),
                Profile.first_name.ilike(pattern),
                Profile.last_name.ilike(pattern),
            )
        )

    total = query.count()
    items = (
        query.order_by(User.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    return {"items": items, "page": page, "per_page": per_page, "total": total}


def get_user_or_404(user_id):
    user = db.session.get(User, user_id)
    if user is None:
        raise NotFoundError(f"User {user_id} not found.")
    return user


def update_user(admin, user_id, is_active=None, role=None):
    """
    Admin-only account management: activate/deactivate, change role.

    Deliberately blocks an admin from modifying their OWN account through
    this endpoint (role or active status) -- self-demotion or
    self-deactivation here would be a single API call away from an admin
    locking themselves out with no recovery path except direct DB access,
    exactly the kind of destructive-by-accident action the brief calls
    out as needing extra care.
    """
    if user_id == admin.id:
        raise ForbiddenError("Admins cannot change their own role or account status here.")

    user = get_user_or_404(user_id)

    if role is not None:
        if role not in ASSIGNABLE_ROLES:
            raise ValidationAPIError(f"role must be one of {sorted(ASSIGNABLE_ROLES)}.")
        user.role = role

    if is_active is not None:
        user.is_active = is_active

    db.session.commit()
    return user
