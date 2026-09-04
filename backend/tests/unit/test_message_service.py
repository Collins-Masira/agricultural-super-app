# tests/unit/test_message_service.py

import pytest

from app.errors import ForbiddenError, NotFoundError, ValidationAPIError
from app.services import message_service


class TestStartConversation:
    def test_includes_current_user_automatically(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")

        # Caller doesn't include their own id -- start_conversation must
        # add it, since starting a conversation you're not part of makes
        # no sense.
        conversation = message_service.start_conversation(amina, [brian.id])

        participant_ids = {p.user_id for p in conversation.participants}
        assert participant_ids == {amina.id, brian.id}

    def test_deduplicates_participant_ids(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")

        conversation = message_service.start_conversation(amina, [brian.id, brian.id, amina.id])

        assert len(conversation.participants) == 2

    def test_rejects_conversation_with_only_self(self, create_user):
        amina = create_user(username="amina")
        with pytest.raises(ValidationAPIError):
            message_service.start_conversation(amina, [amina.id])

    def test_rejects_unknown_participant_id(self, create_user):
        amina = create_user(username="amina")
        with pytest.raises(ValidationAPIError):
            message_service.start_conversation(amina, [999999])


class TestGetConversationForUser:
    def test_participant_can_access(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        conversation = message_service.start_conversation(amina, [brian.id])

        result = message_service.get_conversation_for_user(brian, conversation.id)
        assert result.id == conversation.id

    def test_non_participant_is_forbidden(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        eve = create_user(username="eve")
        conversation = message_service.start_conversation(amina, [brian.id])

        with pytest.raises(ForbiddenError):
            message_service.get_conversation_for_user(eve, conversation.id)

    def test_missing_conversation_raises_not_found(self, create_user):
        amina = create_user(username="amina")
        with pytest.raises(NotFoundError):
            message_service.get_conversation_for_user(amina, 999999)


class TestSendMessage:
    def test_participant_can_send(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        conversation = message_service.start_conversation(amina, [brian.id])

        message = message_service.send_message(amina, conversation.id, "Hello Brian")

        assert message.sender_id == amina.id
        assert message.is_read is False

    def test_non_participant_cannot_send(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        eve = create_user(username="eve")
        conversation = message_service.start_conversation(amina, [brian.id])

        with pytest.raises(ForbiddenError):
            message_service.send_message(eve, conversation.id, "I shouldn't be here")

    def test_sending_bumps_conversation_updated_at(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        conversation = message_service.start_conversation(amina, [brian.id])
        original_updated_at = conversation.updated_at

        message_service.send_message(amina, conversation.id, "Hello")

        assert conversation.updated_at >= original_updated_at


class TestListMessages:
    def test_orders_oldest_first(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        conversation = message_service.start_conversation(amina, [brian.id])

        first = message_service.send_message(amina, conversation.id, "First")
        second = message_service.send_message(brian, conversation.id, "Second")

        messages = message_service.list_messages(amina, conversation.id)
        assert [m.id for m in messages] == [first.id, second.id]


class TestMarkMessageRead:
    def test_recipient_can_mark_read(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        conversation = message_service.start_conversation(amina, [brian.id])
        message = message_service.send_message(amina, conversation.id, "Hello")

        updated = message_service.mark_message_read(brian, message.id)
        assert updated.is_read is True

    def test_sender_cannot_mark_own_message_read(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        conversation = message_service.start_conversation(amina, [brian.id])
        message = message_service.send_message(amina, conversation.id, "Hello")

        with pytest.raises(ForbiddenError):
            message_service.mark_message_read(amina, message.id)

    def test_unknown_message_raises_not_found(self, create_user):
        amina = create_user(username="amina")
        with pytest.raises(NotFoundError):
            message_service.mark_message_read(amina, 999999)
