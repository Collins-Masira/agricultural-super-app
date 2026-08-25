# tests/unit/test_user_service.py

import pytest

from app.errors import ConflictError, NotFoundError, ValidationAPIError
from app.services import user_service


class TestGetUserOr404:
    def test_returns_existing_user(self, create_user):
        created = create_user(username="amina")
        found = user_service.get_user_or_404(created.id)
        assert found.id == created.id

    def test_raises_not_found_for_missing_user(self):
        with pytest.raises(NotFoundError):
            user_service.get_user_or_404(999999)


class TestUpsertOwnProfile:
    def test_creates_profile_when_none_exists(self, create_user):
        user = create_user(username="amina")
        assert user.profile is None

        profile = user_service.upsert_own_profile(user, {"first_name": "Amina", "bio": "Maize farmer"})

        assert profile.user_id == user.id
        assert profile.first_name == "Amina"
        assert profile.bio == "Maize farmer"

    def test_updates_existing_profile_in_place(self, create_user):
        user = create_user(username="amina")
        first = user_service.upsert_own_profile(user, {"first_name": "Amina"})
        second = user_service.upsert_own_profile(user, {"first_name": "Updated"})

        # Same row updated, not a second profile created -- profiles.user_id
        # is unique, so a second insert would raise IntegrityError if this
        # were broken.
        assert first.id == second.id
        assert second.first_name == "Updated"


class TestFollowUser:
    def test_creates_follow_relationship(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")

        follow = user_service.follow_user(amina, brian.id)

        assert follow.follower_id == amina.id
        assert follow.following_id == brian.id

    def test_cannot_follow_self(self, create_user):
        amina = create_user(username="amina")
        with pytest.raises(ValidationAPIError):
            user_service.follow_user(amina, amina.id)

    def test_cannot_follow_same_user_twice(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        user_service.follow_user(amina, brian.id)

        with pytest.raises(ConflictError):
            user_service.follow_user(amina, brian.id)

    def test_following_nonexistent_user_raises_not_found(self, create_user):
        amina = create_user(username="amina")
        with pytest.raises(NotFoundError):
            user_service.follow_user(amina, 999999)


class TestUnfollowUser:
    def test_removes_existing_follow(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        user_service.follow_user(amina, brian.id)

        user_service.unfollow_user(amina, brian.id)  # should not raise

        # Following again should succeed, proving the row was actually
        # deleted rather than e.g. soft-marked in a way follow_user's
        # duplicate check would still catch.
        user_service.follow_user(amina, brian.id)

    def test_unfollowing_when_not_following_raises_not_found(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        with pytest.raises(NotFoundError):
            user_service.unfollow_user(amina, brian.id)
