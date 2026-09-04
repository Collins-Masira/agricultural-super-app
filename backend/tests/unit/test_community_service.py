import pytest

from app.errors import ConflictError, ForbiddenError, NotFoundError, ValidationAPIError
from app.services import community_service


class TestCreateCommunity:
    def test_creator_is_automatically_a_member(self, create_user):
        amina = create_user(username="amina")
        community = community_service.create_community(amina, {"name": "Maize Farmers"})

        assert community.created_by == amina.id
        member_ids = {m.user_id for m in community.members}
        assert amina.id in member_ids
        creator_membership = next(m for m in community.members if m.user_id == amina.id)
        assert creator_membership.role == "admin"

    def test_duplicate_name_raises_integrity_error_at_db_level(self, create_user):
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

        community_service.join_community(brian, community.id)

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

        community_service.leave_community(brian, community.id)

    def test_non_member_leaving_raises_not_found(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        community = community_service.create_community(amina, {"name": "Maize Farmers"})

        with pytest.raises(NotFoundError):
            community_service.leave_community(brian, community.id)


class TestCommunitySettings:
    def test_admin_can_change_posting_permission(self, create_user):
        amina = create_user(username="amina")
        community = community_service.create_community(amina, {"name": "Maize Farmers"})

        updated = community_service.update_community(amina, community.id, {"posting_permission": "experts_only"})
        assert updated.posting_permission == "experts_only"

    def test_admin_can_change_messaging_permission(self, create_user):
        amina = create_user(username="amina")
        community = community_service.create_community(amina, {"name": "Maize Farmers"})

        updated = community_service.update_community(amina, community.id, {"messaging_permission": "admins_only"})
        assert updated.messaging_permission == "admins_only"

    def test_admin_can_close_comments(self, create_user):
        amina = create_user(username="amina")
        community = community_service.create_community(amina, {"name": "Maize Farmers"})

        updated = community_service.update_community(amina, community.id, {"comments_enabled": False})
        assert updated.comments_enabled is False

    def test_admin_can_reopen_comments(self, create_user):
        amina = create_user(username="amina")
        community = community_service.create_community(amina, {"name": "Maize Farmers"})
        community_service.update_community(amina, community.id, {"comments_enabled": False})

        updated = community_service.update_community(amina, community.id, {"comments_enabled": True})
        assert updated.comments_enabled is True

    def test_non_admin_member_cannot_change_settings(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        community = community_service.create_community(amina, {"name": "Maize Farmers"})
        community_service.join_community(brian, community.id)

        with pytest.raises(ForbiddenError):
            community_service.update_community(brian, community.id, {"posting_permission": "admins_only"})

    def test_promoted_admin_can_change_settings(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        community = community_service.create_community(amina, {"name": "Maize Farmers"})
        community_service.join_community(brian, community.id)
        community_service.set_member_role(amina, community.id, brian.id, "admin")

        updated = community_service.update_community(brian, community.id, {"comments_enabled": False})
        assert updated.comments_enabled is False

    def test_defaults_are_permissive(self, create_user):
        amina = create_user(username="amina")
        community = community_service.create_community(amina, {"name": "Maize Farmers"})

        assert community.posting_permission == "everyone"
        assert community.messaging_permission == "everyone"
        assert community.comments_enabled is True


class TestPostingPermissionEnforcement:
    def test_everyone_allows_any_member(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        community = community_service.create_community(amina, {"name": "Maize Farmers"})
        community_service.join_community(brian, community.id)

        assert community_service.can_post_in_community(brian, community) is True

    def test_experts_only_blocks_ordinary_members(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        community = community_service.create_community(amina, {"name": "Maize Farmers"})
        community_service.join_community(brian, community.id)
        community_service.update_community(amina, community.id, {"posting_permission": "experts_only"})

        assert community_service.can_post_in_community(brian, community) is False

    def test_experts_only_allows_experts(self, create_user):
        amina = create_user(username="amina")
        expert = create_user(username="drjane", role="expert")
        community = community_service.create_community(amina, {"name": "Maize Farmers"})
        community_service.join_community(expert, community.id)
        community_service.update_community(amina, community.id, {"posting_permission": "experts_only"})

        assert community_service.can_post_in_community(expert, community) is True

    def test_admins_only_blocks_experts(self, create_user):
        amina = create_user(username="amina")
        expert = create_user(username="drjane", role="expert")
        community = community_service.create_community(amina, {"name": "Maize Farmers"})
        community_service.join_community(expert, community.id)
        community_service.update_community(amina, community.id, {"posting_permission": "admins_only"})

        assert community_service.can_post_in_community(expert, community) is False

    def test_admins_only_allows_admins(self, create_user):
        amina = create_user(username="amina")
        community = community_service.create_community(amina, {"name": "Maize Farmers"})
        community_service.update_community(amina, community.id, {"posting_permission": "admins_only"})

        assert community_service.can_post_in_community(amina, community) is True

    def test_non_member_cannot_post_regardless_of_permission(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        community = community_service.create_community(amina, {"name": "Maize Farmers"})

        assert community_service.can_post_in_community(brian, community) is False


class TestCommentingPermissionEnforcement:
    def test_comments_disabled_blocks_everyone_including_admins(self, create_user):
        amina = create_user(username="amina")
        community = community_service.create_community(amina, {"name": "Maize Farmers"})
        community_service.update_community(amina, community.id, {"comments_enabled": False})

        assert community_service.can_comment_in_community(amina, community) is False

    def test_experts_only_messaging_blocks_ordinary_members(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        community = community_service.create_community(amina, {"name": "Maize Farmers"})
        community_service.join_community(brian, community.id)
        community_service.update_community(amina, community.id, {"messaging_permission": "experts_only"})

        assert community_service.can_comment_in_community(brian, community) is False

    def test_experts_only_messaging_allows_experts(self, create_user):
        amina = create_user(username="amina")
        expert = create_user(username="drjane", role="expert")
        community = community_service.create_community(amina, {"name": "Maize Farmers"})
        community_service.join_community(expert, community.id)
        community_service.update_community(amina, community.id, {"messaging_permission": "experts_only"})

        assert community_service.can_comment_in_community(expert, community) is True


class TestMemberManagement:
    def test_admin_can_promote_a_member(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        community = community_service.create_community(amina, {"name": "Maize Farmers"})
        community_service.join_community(brian, community.id)

        membership = community_service.set_member_role(amina, community.id, brian.id, "admin")
        assert membership.role == "admin"

    def test_admin_can_demote_another_admin(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        community = community_service.create_community(amina, {"name": "Maize Farmers"})
        community_service.join_community(brian, community.id)
        community_service.set_member_role(amina, community.id, brian.id, "admin")

        membership = community_service.set_member_role(brian, community.id, brian.id, "member")
        assert membership.role == "member"

    def test_non_admin_cannot_change_roles(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        eve = create_user(username="eve")
        community = community_service.create_community(amina, {"name": "Maize Farmers"})
        community_service.join_community(brian, community.id)
        community_service.join_community(eve, community.id)

        with pytest.raises(ForbiddenError):
            community_service.set_member_role(brian, community.id, eve.id, "admin")

    def test_creators_role_cannot_be_changed(self, create_user):
        amina = create_user(username="amina")
        community = community_service.create_community(amina, {"name": "Maize Farmers"})

        with pytest.raises(ForbiddenError):
            community_service.set_member_role(amina, community.id, amina.id, "member")

    def test_invalid_role_raises_validation_error(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        community = community_service.create_community(amina, {"name": "Maize Farmers"})
        community_service.join_community(brian, community.id)

        with pytest.raises(ValidationAPIError):
            community_service.set_member_role(amina, community.id, brian.id, "owner")

    def test_admin_can_remove_a_member(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        community = community_service.create_community(amina, {"name": "Maize Farmers"})
        community_service.join_community(brian, community.id)

        community_service.remove_member(amina, community.id, brian.id)
        assert community_service.get_membership(brian.id, community.id) is None

    def test_non_admin_cannot_remove_a_member(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        eve = create_user(username="eve")
        community = community_service.create_community(amina, {"name": "Maize Farmers"})
        community_service.join_community(brian, community.id)
        community_service.join_community(eve, community.id)

        with pytest.raises(ForbiddenError):
            community_service.remove_member(brian, community.id, eve.id)

    def test_creator_cannot_be_removed(self, create_user):
        amina = create_user(username="amina")
        community = community_service.create_community(amina, {"name": "Maize Farmers"})

        with pytest.raises(ForbiddenError):
            community_service.remove_member(amina, community.id, amina.id)
