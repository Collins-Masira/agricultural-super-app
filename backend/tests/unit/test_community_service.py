# tests/unit/test_community_service.py

import pytest

from app.errors import ConflictError, ForbiddenError, NotFoundError
from app.services import community_service


class TestCreateCommunity:
    def test_creator_is_automatically_a_member(self, create_user):
        amina = create_user(username="amina")
        community = community_service.create_community(amina, {"name": "Maize Farmers"})

        assert community.created_by == amina.id
        member_ids = {m.user_id for m in community.members}
        assert amina.id in member_ids

    def test_duplicate_name_raises_integrity_error_at_db_level(self, create_user):
        # communities.name is UNIQUE at the DB level -- this isn't
        # pre-checked in the service the way username/email are in
        # auth_service, so it's the raw IntegrityError that should
        # surface here (the global error handler is what turns this into
        # a clean 409 at the HTTP layer -- see test_error_handling.py).
        from sqlalchemy.exc import IntegrityError

        amina = create_user(username="amina")
        brian = create_user(username="brian")
        community_service.create_community(amina, {"name": "Maize Farmers"})

        with pytest.raises(IntegrityError):
            community_service.create_community(brian, {"name": "Maize Farmers"})


class TestUpdateCommunity:
    def test_creator_can_update(self, create_user):
        amina = create_user(username="amina")
        community = community_service.create_community(amina, {"name": "Maize Farmers"})

        updated = community_service.update_community(amina, community.id, {"description": "Updated"})
        assert updated.description == "Updated"

    def test_non_creator_cannot_update(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        community = community_service.create_community(amina, {"name": "Maize Farmers"})

        with pytest.raises(ForbiddenError):
            community_service.update_community(brian, community.id, {"description": "Hijacked"})

    def test_admin_can_update_others_communities(self, create_user):
        amina = create_user(username="amina")
        admin = create_user(username="root", role="admin")
        community = community_service.create_community(amina, {"name": "Maize Farmers"})

        updated = community_service.update_community(admin, community.id, {"description": "Moderated"})
        assert updated.description == "Moderated"


class TestDeleteCommunity:
    def test_non_creator_cannot_delete(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        community = community_service.create_community(amina, {"name": "Maize Farmers"})

        with pytest.raises(ForbiddenError):
            community_service.delete_community(brian, community.id)

    def test_creator_can_delete(self, create_user):
        amina = create_user(username="amina")
        community = community_service.create_community(amina, {"name": "Maize Farmers"})

        community_service.delete_community(amina, community.id)

        with pytest.raises(NotFoundError):
            community_service.get_community_or_404(community.id)


class TestMembership:
    def test_another_user_can_join(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        community = community_service.create_community(amina, {"name": "Maize Farmers"})

        community_service.join_community(brian, community.id)  # should not raise

    def test_joining_twice_raises_conflict(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        community = community_service.create_community(amina, {"name": "Maize Farmers"})
        community_service.join_community(brian, community.id)

        with pytest.raises(ConflictError):
            community_service.join_community(brian, community.id)

    def test_creator_cannot_leave_own_community(self, create_user):
        amina = create_user(username="amina")
        community = community_service.create_community(amina, {"name": "Maize Farmers"})

        with pytest.raises(ForbiddenError):
            community_service.leave_community(amina, community.id)

    def test_member_can_leave(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        community = community_service.create_community(amina, {"name": "Maize Farmers"})
        community_service.join_community(brian, community.id)

        community_service.leave_community(brian, community.id)  # should not raise

    def test_non_member_leaving_raises_not_found(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        community = community_service.create_community(amina, {"name": "Maize Farmers"})

        with pytest.raises(NotFoundError):
            community_service.leave_community(brian, community.id)
