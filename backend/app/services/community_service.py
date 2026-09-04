from app.errors import ConflictError, ForbiddenError, NotFoundError, ValidationAPIError
from app.extensions import db
from app.models import Community, CommunityMember

MAX_PAGE_SIZE = 100


def _assert_creator(current_user, community):
    if current_user.id != community.created_by and current_user.role != "admin":
        raise ForbiddenError("You do not have permission to modify this community.")


def get_membership(user_id, community_id):
    return (
        db.session.query(CommunityMember)
        .filter_by(user_id=user_id, community_id=community_id)
        .first()
    )


def is_admin_member(user, community):
    if user.role == "admin":
        return True
    membership = get_membership(user.id, community.id)
    return membership is not None and membership.role == "admin"


def _assert_community_admin(current_user, community):
    if not is_admin_member(current_user, community):
        raise ForbiddenError("You do not have permission to manage this community.")


def can_post_in_community(user, community):
    membership = get_membership(user.id, community.id)
    if membership is None:
        return False
    if is_admin_member(user, community):
        return True
    if community.posting_permission == "admins_only":
        return False
    if community.posting_permission == "experts_only":
        return user.role == "expert"
    return True


def can_comment_in_community(user, community):
    if not community.comments_enabled:
        return False
    membership = get_membership(user.id, community.id)
    if membership is None:
        return False
    if is_admin_member(user, community):
        return True
    if community.messaging_permission == "admins_only":
        return False
    if community.messaging_permission == "experts_only":
        return user.role == "expert"
    return True


def get_community_or_404(community_id):
    community = db.session.get(Community, community_id)
    if community is None:
        raise NotFoundError(f"Community {community_id} not found.")
    return community


def _annotate_follow_status(communities, current_user):
    """Set is_following on each community for the given user."""
    if current_user is None:
        for c in communities:
            c.is_following = False
        return
    if not communities:
        return
    community_ids = [c.id for c in communities]
    followed_ids = {
        row.community_id
        for row in db.session.query(CommunityFollow.community_id).filter(
            CommunityFollow.user_id == current_user.id,
            CommunityFollow.community_id.in_(community_ids),
        ).all()
    }
    for c in communities:
        c.is_following = c.id in followed_ids


def list_communities(page=1, per_page=20, current_user=None):
    per_page = min(per_page, MAX_PAGE_SIZE)
    communities = (
        db.session.query(Community)
        .order_by(Community.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    _annotate_follow_status(communities, current_user)
    return communities


def create_community(current_user, data):
    community = Community(created_by=current_user.id, **data)
    db.session.add(community)
    db.session.flush()

    db.session.add(
        CommunityMember(user_id=current_user.id, community_id=community.id, role="admin")
    )
    db.session.commit()
    return community


def update_community(current_user, community_id, data):
    community = get_community_or_404(community_id)
    _assert_community_admin(current_user, community)

    for permission_field in ("posting_permission", "messaging_permission"):
        value = data.get(permission_field)
        if value is not None and value not in COMMUNITY_PERMISSION_LEVELS:
            raise ValidationAPIError(
                f"{permission_field} must be one of: {', '.join(COMMUNITY_PERMISSION_LEVELS)}."
            )

    for key, value in data.items():
        setattr(community, key, value)
    db.session.commit()
    return community


def delete_community(current_user, community_id):
    community = get_community_or_404(community_id)
    _assert_creator(current_user, community)
    db.session.delete(community)
    db.session.commit()


def join_community(current_user, community_id):
    community = get_community_or_404(community_id)

    existing = get_membership(current_user.id, community.id)
    if existing:
        raise ConflictError("You are already a member of this community.")

    membership = CommunityMember(user_id=current_user.id, community_id=community.id)
    db.session.add(membership)
    db.session.commit()
    return membership


def leave_community(current_user, community_id):
    community = get_community_or_404(community_id)

    if community.created_by == current_user.id:
        raise ForbiddenError(
            "The creator cannot leave their own community. Delete it instead."
        )

    membership = get_membership(current_user.id, community_id)
    if membership is None:
        raise NotFoundError("You are not a member of this community.")

    db.session.delete(membership)
    db.session.commit()
