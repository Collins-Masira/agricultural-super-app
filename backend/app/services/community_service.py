# app/services/community_service.py

from app.errors import ConflictError, ForbiddenError, NotFoundError
from app.extensions import db
from app.models import Community, CommunityFollow, CommunityMember

MAX_PAGE_SIZE = 100


def _assert_creator(current_user, community):
    if current_user.id != community.created_by and current_user.role != "admin":
        raise ForbiddenError("You do not have permission to modify this community.")


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
    db.session.flush()  # assigns community.id before the membership row

    # The creator is automatically the community's first member -- a
    # community with zero members (not even its own creator) would be a
    # confusing default for both the UI and the data model.
    db.session.add(
        CommunityMember(user_id=current_user.id, community_id=community.id)
    )
    db.session.commit()
    return community


def update_community(current_user, community_id, data):
    community = get_community_or_404(community_id)
    _assert_creator(current_user, community)
    for key, value in data.items():
        setattr(community, key, value)
    db.session.commit()
    return community


def delete_community(current_user, community_id):
    community = get_community_or_404(community_id)
    _assert_creator(current_user, community)
    db.session.delete(community)  # cascades to CommunityMember rows
    db.session.commit()


def join_community(current_user, community_id):
    community = get_community_or_404(community_id)

    existing = (
        db.session.query(CommunityMember)
        .filter_by(user_id=current_user.id, community_id=community.id)
        .first()
    )
    if existing:
        raise ConflictError("You are already a member of this community.")

    membership = CommunityMember(user_id=current_user.id, community_id=community.id)
    db.session.add(membership)
    db.session.commit()
    return membership


def leave_community(current_user, community_id):
    community = get_community_or_404(community_id)

    if community.created_by == current_user.id:
        # Leaving would orphan the community (no creator left to manage
        # it) without actually deleting it -- force an explicit delete
        # instead of a confusing implicit state.
        raise ForbiddenError(
            "The creator cannot leave their own community. Delete it instead."
        )

    membership = (
        db.session.query(CommunityMember)
        .filter_by(user_id=current_user.id, community_id=community_id)
        .first()
    )
    if membership is None:
        raise NotFoundError("You are not a member of this community.")

    db.session.delete(membership)
    db.session.commit()


def follow_community(current_user, community_id):
    community = get_community_or_404(community_id)

    existing = (
        db.session.query(CommunityFollow)
        .filter_by(user_id=current_user.id, community_id=community.id)
        .first()
    )
    if existing:
        raise ConflictError("You are already following this community.")

    follow = CommunityFollow(user_id=current_user.id, community_id=community.id)
    db.session.add(follow)
    db.session.commit()
    return follow


def unfollow_community(current_user, community_id):
    community = get_community_or_404(community_id)

    follow = (
        db.session.query(CommunityFollow)
        .filter_by(user_id=current_user.id, community_id=community_id)
        .first()
    )
    if follow is None:
        raise NotFoundError("You are not following this community.")

    db.session.delete(follow)
    db.session.commit()
