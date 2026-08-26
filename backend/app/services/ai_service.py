# app/services/ai_service.py

"""
AI Farming Assistant -- the entry point the rest of the app calls
(routes/ai_routes.py). Resolves whichever AIProvider is configured (see
app/services/ai_providers.py) and asks it for a completion, translating
any provider failure into the API's standard error envelope.

Why an assistant, specifically: this platform's whole premise is
connecting farmers with agricultural experts. Experts aren't always
online, and a lot of farmer questions ("is this normal flower drop?",
"what's this leaf spot?", "when should I top-dress maize?") are the kind
of first-pass triage an assistant can help with immediately, while still
steering anything serious back to a verified human expert on the
platform -- that's encoded directly in the system prompt below, not
bolted on as an afterthought.

Provider-independent by design: the request flow is always
Frontend -> POST /api/ai/assistant -> ai_service -> AIProvider -> the
actual model. The frontend only ever talks to this Flask endpoint; it
never sees which provider answered or any provider credentials.
"""

from flask import current_app

from app.errors import ApiError
from app.services.ai_providers import AIProviderError, get_provider

MAX_HISTORY_MESSAGES = 20
MAX_MESSAGE_LENGTH = 4000

SYSTEM_PROMPT = (
    "You are the AI Farming Assistant inside AgriConnect, a community app "
    "connecting farmers with verified agricultural experts. Give concise, "
    "practical, safe guidance on crops, livestock, soil, pests, and general "
    "farm management, tailored for smallholder farmers. Prefer plain "
    "language over jargon. Clearly distinguish general educational guidance "
    "from high-stakes decisions: when a question involves something "
    "high-stakes or uncertain (animal disease outbreaks, chemical dosing, "
    "food safety, large financial decisions), say so plainly and recommend "
    "the farmer also consult a verified expert on AgriConnect for "
    "confirmation before acting. Keep answers focused -- a few short "
    "paragraphs or a tight list, not an essay."
)


class AIServiceUnavailableError(ApiError):
    """The AI assistant is not configured, or the upstream provider failed."""

    status_code = 503


def ask_assistant(messages):
    """
    `messages` is a list of {"role": "user"|"assistant", "content": str},
    already validated by the route (non-empty, roles alternate loosely --
    the provider itself will reject a genuinely malformed sequence).

    Returns the assistant's reply text. Never lets a provider-specific
    exception (connection errors, HTTP errors, malformed JSON, ...)
    escape this function -- everything is normalized to
    AIServiceUnavailableError with a user-safe message, and the real
    detail is logged server-side for debugging.
    """
    trimmed = messages[-MAX_HISTORY_MESSAGES:]

    try:
        provider = get_provider(current_app.config)
        return provider.complete(trimmed, SYSTEM_PROMPT)
    except AIProviderError as err:
        current_app.logger.error("AI assistant provider error: %s", err.log_message)
        raise AIServiceUnavailableError(err.public_message)
