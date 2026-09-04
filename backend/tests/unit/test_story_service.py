# tests/unit/test_story_service.py

from datetime import datetime, timedelta

import pytest

from app.errors import ForbiddenError, NotFoundError
from app.extensions import db
from app.models import Story
from app.services import story_service


def _story_aged(user, hours_old, image_url="https://x/story.jpg"):
    """
    Directly persists a Story whose created_at/expires_at are pinned to
    an exact age, bypassing create_story()'s "now" -- this is how time-
    boundary behavior (23h vs 24h vs 25h old) is tested without needing
    to freeze the system clock.
    """
    created_at = datetime.utcnow() - timedelta(hours=hours_old)
    story = Story(
        user_id=user.id,
        image_url=image_url,
        created_at=created_at,
        expires_at=created_at + story_service.STORY_LIFETIME,
    )
    db.session.add(story)
    db.session.commit()
    return story


class TestCreateStory:
    def test_creates_story_owned_by_current_user(self, create_user):
        amina = create_user(username="amina")
        story = story_service.create_story(amina, "https://x/story.jpg", "Morning harvest")
        assert story.user_id == amina.id
        assert story.image_url == "https://x/story.jpg"
        assert story.caption == "Morning harvest"

    def test_created_at_is_populated(self, create_user):
        amina = create_user(username="amina")
        before = datetime.utcnow()
        story = story_service.create_story(amina, "https://x/story.jpg")
        after = datetime.utcnow()
        assert before <= story.created_at <= after

    def test_expires_at_is_exactly_24_hours_after_created_at(self, create_user):
        amina = create_user(username="amina")
        story = story_service.create_story(amina, "https://x/story.jpg")
        assert story.expires_at - story.created_at == timedelta(hours=24)

    def test_caption_defaults_to_none(self, create_user):
        amina = create_user(username="amina")
        story = story_service.create_story(amina, "https://x/story.jpg")
        assert story.caption is None


class TestListActiveStories:
    def test_active_story_is_returned(self, create_user):
        amina = create_user(username="amina")
        story = story_service.create_story(amina, "https://x/story.jpg")
        assert story.id in [s.id for s in story_service.list_active_stories()]

    def test_expired_story_is_not_returned(self, create_user):
        amina = create_user(username="amina")
        expired = _story_aged(amina, hours_old=25)
        assert expired.id not in [s.id for s in story_service.list_active_stories()]

    def test_multiple_users_active_stories_are_all_returned(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        s1 = story_service.create_story(amina, "https://x/1.jpg")
        s2 = story_service.create_story(brian, "https://x/2.jpg")

        ids = {s.id for s in story_service.list_active_stories()}
        assert {s1.id, s2.id} <= ids

    def test_deleted_story_no_longer_appears(self, create_user):
        amina = create_user(username="amina")
        story = story_service.create_story(amina, "https://x/story.jpg")
        story_service.delete_story(amina, story.id)
        assert story.id not in [s.id for s in story_service.list_active_stories()]

    def test_groups_each_users_stories_contiguously_oldest_first(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")

        # Explicit, well-separated timestamps -- real-clock back-to-back
        # calls can tie at this resolution, which would make the ordering
        # assertion below flaky.
        amina_first = _story_aged(amina, hours_old=1, image_url="https://x/a1.jpg")
        brian_only = _story_aged(brian, hours_old=2, image_url="https://x/b1.jpg")
        amina_second = _story_aged(amina, hours_old=0.5, image_url="https://x/a2.jpg")

        ordered = story_service.list_active_stories()
        by_id = [s.id for s in ordered]

        # Amina's most recent story is newer than Brian's only story, so
        # her group (chronological oldest-first within it) comes first.
        assert by_id == [amina_first.id, amina_second.id, brian_only.id]


class TestListUserActiveStories:
    def test_returns_only_that_users_active_stories_oldest_first(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        first = story_service.create_story(amina, "https://x/1.jpg")
        story_service.create_story(brian, "https://x/2.jpg")
        second = story_service.create_story(amina, "https://x/3.jpg")

        stories = story_service.list_user_active_stories(amina.id)
        assert [s.id for s in stories] == [first.id, second.id]

    def test_excludes_expired_stories(self, create_user):
        amina = create_user(username="amina")
        _story_aged(amina, hours_old=25)
        assert story_service.list_user_active_stories(amina.id) == []


class TestGetActiveStoryOr404:
    def test_returns_active_story(self, create_user):
        amina = create_user(username="amina")
        story = story_service.create_story(amina, "https://x/story.jpg")
        assert story_service.get_active_story_or_404(story.id).id == story.id

    def test_raises_not_found_for_missing_story(self):
        with pytest.raises(NotFoundError):
            story_service.get_active_story_or_404(999999)

    def test_raises_not_found_for_expired_story(self, create_user):
        amina = create_user(username="amina")
        expired = _story_aged(amina, hours_old=25)
        with pytest.raises(NotFoundError):
            story_service.get_active_story_or_404(expired.id)


class TestTimeBoundaries:
    def test_23_hours_old_is_active(self, create_user):
        amina = create_user(username="amina")
        story = _story_aged(amina, hours_old=23)
        assert story.id in [s.id for s in story_service.list_active_stories()]

    def test_23_hours_59_minutes_old_is_active(self, create_user):
        amina = create_user(username="amina")
        created_at = datetime.utcnow() - timedelta(hours=23, minutes=59)
        story = Story(
            user_id=amina.id,
            image_url="https://x/story.jpg",
            created_at=created_at,
            expires_at=created_at + story_service.STORY_LIFETIME,
        )
        db.session.add(story)
        db.session.commit()
        assert story.id in [s.id for s in story_service.list_active_stories()]

    def test_exactly_24_hours_old_is_expired(self, create_user):
        amina = create_user(username="amina")
        created_at = datetime.utcnow() - timedelta(hours=24)
        story = Story(
            user_id=amina.id,
            image_url="https://x/story.jpg",
            created_at=created_at,
            expires_at=created_at + story_service.STORY_LIFETIME,  # == datetime.utcnow()
        )
        db.session.add(story)
        db.session.commit()
        assert story.id not in [s.id for s in story_service.list_active_stories()]

    def test_25_hours_old_is_expired(self, create_user):
        amina = create_user(username="amina")
        story = _story_aged(amina, hours_old=25)
        assert story.id not in [s.id for s in story_service.list_active_stories()]


class TestDeleteStory:
    def test_owner_can_delete_own_story(self, create_user):
        amina = create_user(username="amina")
        story = story_service.create_story(amina, "https://x/story.jpg")
        story_service.delete_story(amina, story.id)
        assert db.session.get(Story, story.id) is None

    def test_another_user_cannot_delete_someone_elses_story(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        story = story_service.create_story(amina, "https://x/story.jpg")

        with pytest.raises(ForbiddenError):
            story_service.delete_story(brian, story.id)

    def test_admin_can_delete_anyones_story(self, create_user):
        amina = create_user(username="amina")
        admin = create_user(username="admin1", role="admin")
        story = story_service.create_story(amina, "https://x/story.jpg")

        story_service.delete_story(admin, story.id)
        assert db.session.get(Story, story.id) is None

    def test_raises_not_found_for_missing_story(self, create_user):
        amina = create_user(username="amina")
        with pytest.raises(NotFoundError):
            story_service.delete_story(amina, 999999)


class TestCleanupExpiredStories:
    def test_deletes_only_expired_stories(self, create_user):
        amina = create_user(username="amina")
        active = story_service.create_story(amina, "https://x/active.jpg")
        expired = _story_aged(amina, hours_old=25)
        # Captured before cleanup runs: the bulk DELETE below bypasses
        # the ORM's identity map, so `expired` itself becomes a stale
        # Python object afterward -- reading any of its attributes
        # (including .id) would trigger a refresh against a row that no
        # longer exists and raise ObjectDeletedError.
        active_id, expired_id = active.id, expired.id

        deleted_count = story_service.cleanup_expired_stories()

        assert deleted_count == 1
        assert db.session.get(Story, active_id) is not None
        assert db.session.get(Story, expired_id) is None

    def test_returns_zero_when_nothing_is_expired(self, create_user):
        amina = create_user(username="amina")
        story_service.create_story(amina, "https://x/active.jpg")
        assert story_service.cleanup_expired_stories() == 0
