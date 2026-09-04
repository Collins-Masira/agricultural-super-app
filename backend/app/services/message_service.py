# app/services/message_service.py

from app.extensions import utcnow

from app.errors import ForbiddenError, NotFoundError, ValidationAPIError
from app.extensions import db
from app.models import Conversation, ConversationParticipant, Message, User


def _assert_participant(current_user, conversation):
    participant_ids = {p.user_id for p in conversation.participants}
    if current_user.id not in participant_ids:
        raise ForbiddenError("You are not a participant in this conversation.")


def get_conversation_or_404(conversation_id):
    conversation = db.session.get(Conversation, conversation_id)
    if conversation is None:
        raise NotFoundError(f"Conversation {conversation_id} not found.")
    return conversation


def get_conversation_for_user(current_user, conversation_id):
    """
    Combines the existence check and the authorization check, since
    every route that touches a specific conversation needs both -- this
    is the single entry point routes should call rather than composing
    get_conversation_or_404() + _assert_participant() themselves.
    """
    conversation = get_conversation_or_404(conversation_id)
    _assert_participant(current_user, conversation)
    return conversation


def list_conversations(current_user):
    return (
        db.session.query(Conversation)
        .join(ConversationParticipant)
        .filter(ConversationParticipant.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )


def start_conversation(current_user, participant_ids):
    """
    Creates a conversation among the caller and the given participant
    ids. The caller is always included even if they omitted their own
    id from the request -- starting a conversation you're not part of
    doesn't make sense.
    """
    participant_ids = set(participant_ids)
    participant_ids.add(current_user.id)

    if len(participant_ids) < 2:
        raise ValidationAPIError("A conversation needs at least one other participant.")

    found_ids = {
        row[0]
        for row in db.session.query(User.id).filter(User.id.in_(participant_ids)).all()
    }
    missing = participant_ids - found_ids
    if missing:
        raise ValidationAPIError(f"Unknown user id(s): {sorted(missing)}")

    conversation = Conversation(created_by=current_user.id)
    db.session.add(conversation)
    db.session.flush()  # assigns conversation.id before participant rows

    for user_id in participant_ids:
        db.session.add(
            ConversationParticipant(conversation_id=conversation.id, user_id=user_id)
        )

    db.session.commit()
    return conversation


def send_message(current_user, conversation_id, content):
    conversation = get_conversation_for_user(current_user, conversation_id)

    message = Message(
        conversation_id=conversation.id,
        sender_id=current_user.id,
        content=content,
    )
    db.session.add(message)

    # Bump the parent conversation's updated_at so conversation lists
    # naturally sort by "most recently active" -- without this, a
    # conversation with new messages wouldn't rise to the top of
    # list_conversations()'s ordering.
    conversation.updated_at = utcnow()

    db.session.commit()
    return message


def list_messages(current_user, conversation_id):
    get_conversation_for_user(current_user, conversation_id)
    return (
        db.session.query(Message)
        .filter_by(conversation_id=conversation_id)
        .order_by(Message.created_at.asc())
        .all()
    )


def mark_message_read(current_user, message_id):
    message = db.session.get(Message, message_id)
    if message is None:
        raise NotFoundError(f"Message {message_id} not found.")

    conversation = get_conversation_for_user(current_user, message.conversation_id)

    if message.sender_id == current_user.id:
        raise ForbiddenError("You cannot mark your own message as read.")

    message.is_read = True
    db.session.commit()
    return message
