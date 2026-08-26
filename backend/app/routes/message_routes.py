# app/routes/message_routes.py

from flask import Blueprint, jsonify, request

from app.auth.decorators import get_current_user, jwt_required
from app.errors import ValidationAPIError
from app.schemas import conversation_schema, conversations_schema, message_schema, messages_schema
from app.services import message_service

conversations_bp = Blueprint("conversations", __name__, url_prefix="/api/conversations")

# "Mark as read" addresses a specific message by its own id, not scoped
# under a conversation -- its own small top-level blueprint, matching the
# comments_bp pattern in post_routes.py.
messages_bp = Blueprint("messages", __name__, url_prefix="/api/messages")


@conversations_bp.get("")
@jwt_required
def list_conversations():
    conversations = message_service.list_conversations(get_current_user())
    return jsonify(conversations_schema.dump(conversations)), 200


@conversations_bp.post("")
@jwt_required
def start_conversation():
    payload = request.get_json(silent=True) or {}
    participant_ids = payload.get("participant_ids")
    if not isinstance(participant_ids, list) or not participant_ids:
        raise ValidationAPIError("participant_ids must be a non-empty list of user ids.")

    conversation = message_service.start_conversation(get_current_user(), participant_ids)
    return jsonify(conversation_schema.dump(conversation)), 201


@conversations_bp.get("/<int:conversation_id>")
@jwt_required
def get_conversation(conversation_id):
    conversation = message_service.get_conversation_for_user(get_current_user(), conversation_id)
    return jsonify(conversation_schema.dump(conversation)), 200


@conversations_bp.get("/<int:conversation_id>/messages")
@jwt_required
def list_messages(conversation_id):
    messages = message_service.list_messages(get_current_user(), conversation_id)
    return jsonify(messages_schema.dump(messages)), 200


@conversations_bp.post("/<int:conversation_id>/messages")
@jwt_required
def send_message(conversation_id):
    payload = request.get_json(silent=True) or {}
    content = payload.get("content")
    if not content:
        raise ValidationAPIError("content is required.")

    message = message_service.send_message(get_current_user(), conversation_id, content)
    return jsonify(message_schema.dump(message)), 201


@messages_bp.patch("/<int:message_id>/read")
@jwt_required
def mark_read(message_id):
    message = message_service.mark_message_read(get_current_user(), message_id)
    return jsonify(message_schema.dump(message)), 200
