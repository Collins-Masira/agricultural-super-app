# tests/integration/test_ai_routes.py
#
# These hit the real HTTP route, but never a real AI provider -- network
# calls are the provider layer's job, already covered in isolation by
# tests/unit/test_ai_providers.py. Here, `ai_service.get_provider` is
# monkeypatched to a fake provider so route/validation/error-envelope
# behavior is deterministic regardless of whether Ollama happens to be
# running on the machine executing the suite.

import pytest

from app.services import ai_service
from app.services.ai_providers import AIProviderError


class _FakeProvider:
    def __init__(self, reply=None, error=None):
        self._reply = reply
        self._error = error

    def complete(self, messages, system_prompt):
        if self._error is not None:
            raise self._error
        return self._reply


@pytest.fixture
def fake_provider(monkeypatch):
    """
    Patches ai_service.get_provider (not the real network-facing
    provider classes) so route tests exercise the full request path --
    validation, auth, ai_service orchestration, error envelope -- without
    depending on any real AI backend being reachable.
    """

    def _install(reply=None, error=None):
        provider = _FakeProvider(reply=reply, error=error)
        monkeypatch.setattr(ai_service, "get_provider", lambda config: provider)
        return provider

    return _install


class TestAskAssistant:
    def test_requires_auth(self, client):
        response = client.post("/api/ai/assistant", json={"messages": [{"role": "user", "content": "Hi"}]})
        assert response.status_code == 401

    def test_success_returns_reply(self, client, amina, fake_provider):
        fake_provider(reply="Water tomatoes deeply once a week, more often in sandy soil.")
        response = client.post(
            "/api/ai/assistant",
            headers=amina["headers"],
            json={"messages": [{"role": "user", "content": "How often should I water tomatoes?"}]},
        )
        assert response.status_code == 200
        assert response.get_json() == {"reply": "Water tomatoes deeply once a week, more often in sandy soil."}

    def test_provider_failure_returns_503_with_public_message_only(self, client, amina, fake_provider):
        fake_provider(
            error=AIProviderError(
                "The AI assistant is temporarily unavailable (the local AI server is not reachable). "
                "Please try again shortly.",
                log_message="Ollama unreachable at http://localhost:11434: Connection refused",
            )
        )
        response = client.post(
            "/api/ai/assistant",
            headers=amina["headers"],
            json={"messages": [{"role": "user", "content": "Why are my tomato leaves yellowing?"}]},
        )
        assert response.status_code == 503
        body = response.get_json()
        assert "not reachable" in body["error"].lower()
        # The internal log-only detail must never reach the client.
        assert "Connection refused" not in body["error"]
        assert "localhost:11434" not in body["error"]

    def test_unconfigured_provider_returns_503(self, client, amina, fake_provider):
        fake_provider(error=AIProviderError("The AI assistant is not configured. Set the ANTHROPIC_API_KEY..."))
        response = client.post(
            "/api/ai/assistant",
            headers=amina["headers"],
            json={"messages": [{"role": "user", "content": "Hi"}]},
        )
        assert response.status_code == 503

    def test_default_provider_is_ollama_when_unset(self, app):
        assert app.config.get("AI_PROVIDER", "ollama") == "ollama"

    def test_missing_messages_returns_422(self, client, amina):
        response = client.post("/api/ai/assistant", headers=amina["headers"], json={})
        assert response.status_code == 422

    def test_empty_messages_returns_422(self, client, amina):
        response = client.post("/api/ai/assistant", headers=amina["headers"], json={"messages": []})
        assert response.status_code == 422

    def test_invalid_role_returns_422(self, client, amina):
        response = client.post(
            "/api/ai/assistant",
            headers=amina["headers"],
            json={"messages": [{"role": "system", "content": "Hi"}]},
        )
        assert response.status_code == 422

    def test_blank_content_returns_422(self, client, amina):
        response = client.post(
            "/api/ai/assistant",
            headers=amina["headers"],
            json={"messages": [{"role": "user", "content": "   "}]},
        )
        assert response.status_code == 422

    def test_last_message_must_be_from_user(self, client, amina):
        response = client.post(
            "/api/ai/assistant",
            headers=amina["headers"],
            json={"messages": [{"role": "assistant", "content": "How can I help?"}]},
        )
        assert response.status_code == 422

    def test_too_many_messages_returns_422(self, client, amina):
        messages = [{"role": "user", "content": "Hi"} for _ in range(25)]
        response = client.post("/api/ai/assistant", headers=amina["headers"], json={"messages": messages})
        assert response.status_code == 422

    def test_message_too_long_returns_422(self, client, amina):
        response = client.post(
            "/api/ai/assistant",
            headers=amina["headers"],
            json={"messages": [{"role": "user", "content": "x" * 5000}]},
        )
        assert response.status_code == 422

    def test_non_dict_message_returns_422(self, client, amina):
        response = client.post(
            "/api/ai/assistant", headers=amina["headers"], json={"messages": ["just a string"]}
        )
        assert response.status_code == 422
