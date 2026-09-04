# tests/unit/test_notification_service.py

import pytest

from app.errors import ForbiddenError, NotFoundError
from app.services import notification_service


class TestCreateNotification:
    def test_creates_a_notification_for_the_recipient(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")

        notification = notification_service.create_notification(
            recipient_id=amina.id, actor_id=brian.id, type="follow"
        )

        assert notification.recipient_id == amina.id
        assert notification.actor_id == brian.id
        assert notification.type == "follow"
        assert notification.is_read is False

    def test_returns_none_and_does_not_notify_yourself(self, create_user):
        amina = create_user(username="amina")

        result = notification_service.create_notification(
            recipient_id=amina.id, actor_id=amina.id, type="follow"
        )

        assert result is None
        assert notification_service.list_notifications(amina) == []


class TestListNotifications:
    def test_lists_newest_first(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        first = notification_service.create_notification(recipient_id=amina.id, actor_id=brian.id, type="follow")
        second = notification_service.create_notification(recipient_id=amina.id, actor_id=brian.id, type="follow")

        results = notification_service.list_notifications(amina)

        assert [n.id for n in results] == [second.id, first.id]

    def test_only_returns_the_recipients_own_notifications(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        carol = create_user(username="carol")
        notification_service.create_notification(recipient_id=brian.id, actor_id=carol.id, type="follow")

        assert notification_service.list_notifications(amina) == []


class TestCountUnread:
    def test_counts_only_unread(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        first = notification_service.create_notification(recipient_id=amina.id, actor_id=brian.id, type="follow")
        notification_service.create_notification(recipient_id=amina.id, actor_id=brian.id, type="follow")

        notification_service.mark_read(amina, first.id)

        assert notification_service.count_unread(amina) == 1


class TestMarkRead:
    def test_marks_a_notification_read(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        notification = notification_service.create_notification(recipient_id=amina.id, actor_id=brian.id, type="follow")

        updated = notification_service.mark_read(amina, notification.id)

        assert updated.is_read is True

    def test_raises_forbidden_for_someone_elses_notification(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        carol = create_user(username="carol")
        notification = notification_service.create_notification(recipient_id=amina.id, actor_id=brian.id, type="follow")

        with pytest.raises(ForbiddenError):
            notification_service.mark_read(carol, notification.id)

    def test_raises_not_found_for_missing_notification(self, create_user):
        amina = create_user(username="amina")
        with pytest.raises(NotFoundError):
            notification_service.mark_read(amina, 999999)


class TestMarkAllRead:
    def test_marks_every_unread_notification_read(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        notification_service.create_notification(recipient_id=amina.id, actor_id=brian.id, type="follow")
        notification_service.create_notification(recipient_id=amina.id, actor_id=brian.id, type="follow")

        notification_service.mark_all_read(amina)

        assert notification_service.count_unread(amina) == 0

    def test_does_not_affect_other_users_notifications(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        carol = create_user(username="carol")
        notification_service.create_notification(recipient_id=brian.id, actor_id=carol.id, type="follow")

        notification_service.mark_all_read(amina)

        assert notification_service.count_unread(brian) == 1
