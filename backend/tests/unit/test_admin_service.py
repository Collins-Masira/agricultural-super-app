# tests/unit/test_admin_service.py

import pytest

from app.errors import ForbiddenError, NotFoundError, ValidationAPIError
from app.services import admin_service, post_service


class TestGetStats:
    def test_counts_are_accurate(self, create_user):
        create_user(username="amina")
        create_user(username="brian")
        create_user(username="carol", role="expert", is_active=False)

        stats = admin_service.get_stats(ai_provider="ollama", ai_model="llama3.2:1b", ai_configured=True)

        assert stats["users"]["total"] == 3
        assert stats["users"]["active"] == 2
        assert stats["users"]["inactive"] == 1
        assert stats["users"]["by_role"]["expert"] == 1

    def test_recent_users_ordered_newest_first(self, create_user):
        first = create_user(username="first")
        second = create_user(username="second")

        stats = admin_service.get_stats(ai_provider="ollama", ai_model="x", ai_configured=True)
        recent_usernames = [u.username for u in stats["recent_users"]]
        assert recent_usernames[0] == "second"
        assert recent_usernames[1] == "first"

    def test_posts_count_reflects_real_posts(self, create_user):
        amina = create_user(username="amina")
        post_service.create_post(amina, {"title": "T", "content": "C"})

        stats = admin_service.get_stats(ai_provider="ollama", ai_model="x", ai_configured=True)
        assert stats["posts"]["total"] == 1

    def test_zero_state_does_not_fabricate_data(self):
        stats = admin_service.get_stats(ai_provider="ollama", ai_model="x", ai_configured=True)
        assert stats["users"]["total"] == 0
        assert stats["posts"]["total"] == 0
        assert stats["recent_users"] == []
        assert stats["recent_posts"] == []


class TestListUsers:
    def test_returns_total_count_for_pagination(self, create_user):
        for i in range(5):
            create_user(username=f"user{i}")

        result = admin_service.list_users(page=1, per_page=2)
        assert result["total"] == 5
        assert len(result["items"]) == 2

    def test_search_matches_email(self, create_user):
        create_user(username="amina", email="amina@farms.example.com")
        create_user(username="brian", email="brian@other.example.com")

        result = admin_service.list_users(search="farms")
        assert [u.username for u in result["items"]] == ["amina"]

    def test_filters_by_status(self, create_user):
        create_user(username="active_one", is_active=True)
        create_user(username="inactive_one", is_active=False)

        active_only = admin_service.list_users(status="active")
        assert [u.username for u in active_only["items"]] == ["active_one"]

        inactive_only = admin_service.list_users(status="inactive")
        assert [u.username for u in inactive_only["items"]] == ["inactive_one"]


class TestUpdateUser:
    def test_admin_can_deactivate_another_user(self, create_user):
        admin = create_user(username="admin1", role="admin")
        target = create_user(username="amina")

        updated = admin_service.update_user(admin, target.id, is_active=False)
        assert updated.is_active is False

    def test_admin_can_change_role(self, create_user):
        admin = create_user(username="admin1", role="admin")
        target = create_user(username="amina", role="farmer")

        updated = admin_service.update_user(admin, target.id, role="expert")
        assert updated.role == "expert"

    def test_invalid_role_raises_validation_error(self, create_user):
        admin = create_user(username="admin1", role="admin")
        target = create_user(username="amina")

        with pytest.raises(ValidationAPIError):
            admin_service.update_user(admin, target.id, role="superuser")

    def test_admin_cannot_modify_own_account(self, create_user):
        admin = create_user(username="admin1", role="admin")

        with pytest.raises(ForbiddenError):
            admin_service.update_user(admin, admin.id, is_active=False)

    def test_unknown_target_raises_not_found(self, create_user):
        admin = create_user(username="admin1", role="admin")

        with pytest.raises(NotFoundError):
            admin_service.update_user(admin, 999999, is_active=False)
