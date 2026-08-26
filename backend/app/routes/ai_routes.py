# app/routes/ai_routes.py

from flask import Blueprint, jsonify, request

from app.auth.decorators import jwt_required
from app.errors import ValidationAPIError
from app.services import ai_service
from app.services.ai_service import MAX_MESSAGE_LENGTH

ai_bp = Blueprint("ai", __name__, url_prefix="/api/ai")

ALLOWED_ROLES = {"user", "assistant"}
MAX_MESSAGES = 20


@ai_bp.post("/assistant")
@jwt_required
def ask_assistant():
    """
    Auth required -- this proxies an AI provider (local or hosted; see
    app/services/ai_providers.py) that costs real compute/money to run,
    so it shouldn't be open to anonymous callers.

    Body: {"messages": [{"role": "user"|"assistant", "content": "..."}]}
    The full conversation so far; the backend is stateless and doesn't
    persist chat history.
    """
    payload = request.get_json(silent=True) or {}
    messages = payload.get("messages")

    if not isinstance(messages, list) or not messages:
        raise ValidationAPIError("messages must be a non-empty list.")
    if len(messages) > MAX_MESSAGES:
        raise ValidationAPIError(f"messages cannot exceed {MAX_MESSAGES} entries.")

    for entry in messages:
        if not isinstance(entry, dict):
            raise ValidationAPIError("Each message must be an object with role and content.")
        role = entry.get("role")
        content = entry.get("content")
        if role not in ALLOWED_ROLES:
            raise ValidationAPIError("Each message's role must be 'user' or 'assistant'.")
        if not isinstance(content, str) or not content.strip():
            raise ValidationAPIError("Each message must have non-empty text content.")
        if len(content) > MAX_MESSAGE_LENGTH:
            raise ValidationAPIError(f"Message content cannot exceed {MAX_MESSAGE_LENGTH} characters.")

    if messages[-1]["role"] != "user":
        raise ValidationAPIError("The last message must be from the user.")

    reply = ai_service.ask_assistant(messages)
    return jsonify({"reply": reply}), 200
