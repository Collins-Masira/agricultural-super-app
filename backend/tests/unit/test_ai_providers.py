# tests/unit/test_ai_providers.py
#
# These tests never make a real network call -- urllib.request.urlopen is
# monkeypatched to return canned responses/errors. That's deliberate: the
# provider abstraction's whole job is to translate "provider succeeded",
# "provider unreachable", "model missing", and "provider sent garbage"
# into predictable outcomes, and that has to be verifiable without a real
# Ollama server or a real (paid) Anthropic key running in CI.

import io
import json
import urllib.error

import pytest

from app.services import ai_providers
from app.services.ai_providers import (
    AIProviderError,
    AnthropicProvider,
    OllamaProvider,
    get_provider,
)


class _FakeResponse:
    """Minimal stand-in for the object urllib.request.urlopen()'s context manager yields."""

    def __init__(self, payload):
        self._body = json.dumps(payload).encode("utf-8")

    def read(self):
        return self._body

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False


class TestGetProvider:
    def test_defaults_to_ollama(self):
        provider = get_provider({})
        assert isinstance(provider, OllamaProvider)
        assert provider.model == ai_providers.DEFAULT_MODELS["ollama"]
        assert provider.base_url == "http://localhost:11434"

    def test_respects_explicit_ollama_config(self):
        provider = get_provider(
            {"AI_PROVIDER": "ollama", "AI_MODEL": "mistral", "OLLAMA_BASE_URL": "http://gpu-box:11434"}
        )
        assert isinstance(provider, OllamaProvider)
        assert provider.model == "mistral"
        assert provider.base_url == "http://gpu-box:11434"

    def test_selects_anthropic(self):
        provider = get_provider({"AI_PROVIDER": "anthropic", "ANTHROPIC_API_KEY": "sk-test"})
        assert isinstance(provider, AnthropicProvider)
        assert provider.model == ai_providers.DEFAULT_MODELS["anthropic"]
        assert provider.api_key == "sk-test"

    def test_is_case_insensitive(self):
        assert isinstance(get_provider({"AI_PROVIDER": "OLLAMA"}), OllamaProvider)
        assert isinstance(get_provider({"AI_PROVIDER": "Anthropic", "ANTHROPIC_API_KEY": "x"}), AnthropicProvider)

    def test_unknown_provider_raises_ai_provider_error(self):
        with pytest.raises(AIProviderError):
            get_provider({"AI_PROVIDER": "chatgpt"})


class TestOllamaProvider:
    def test_complete_returns_reply_text(self, monkeypatch):
        monkeypatch.setattr(
            ai_providers.urllib.request,
            "urlopen",
            lambda *a, **k: _FakeResponse({"message": {"content": "Water deeply once a week."}}),
        )
        provider = OllamaProvider(base_url="http://localhost:11434", model="llama3.2:1b")
        reply = provider.complete([{"role": "user", "content": "How often should I water maize?"}], "system prompt")
        assert reply == "Water deeply once a week."

    def test_unreachable_server_raises_ai_provider_error(self, monkeypatch):
        def raise_unreachable(*a, **k):
            raise urllib.error.URLError("Connection refused")

        monkeypatch.setattr(ai_providers.urllib.request, "urlopen", raise_unreachable)
        provider = OllamaProvider(base_url="http://localhost:11434", model="llama3.2:1b")

        with pytest.raises(AIProviderError) as exc:
            provider.complete([{"role": "user", "content": "hi"}], "sys")

        # The public-facing message must never leak the raw connection
        # error or any internal detail -- only a clear, actionable hint.
        assert "not reachable" in exc.value.public_message.lower()
        assert "Connection refused" not in exc.value.public_message

    def test_missing_model_raises_actionable_error(self, monkeypatch):
        def raise_404(*a, **k):
            raise urllib.error.HTTPError(
                "url", 404, "Not Found", hdrs=None, fp=io.BytesIO(b'{"error":"model \'x\' not found"}')
            )

        monkeypatch.setattr(ai_providers.urllib.request, "urlopen", raise_404)
        provider = OllamaProvider(base_url="http://localhost:11434", model="does-not-exist")

        with pytest.raises(AIProviderError) as exc:
            provider.complete([{"role": "user", "content": "hi"}], "sys")

        assert "does-not-exist" in exc.value.public_message
        assert "ollama pull" in exc.value.public_message

    def test_malformed_response_raises_ai_provider_error(self, monkeypatch):
        monkeypatch.setattr(
            ai_providers.urllib.request, "urlopen", lambda *a, **k: _FakeResponse({"unexpected": "shape"})
        )
        provider = OllamaProvider(base_url="http://localhost:11434", model="llama3.2:1b")

        with pytest.raises(AIProviderError):
            provider.complete([{"role": "user", "content": "hi"}], "sys")

    def test_empty_content_raises_ai_provider_error(self, monkeypatch):
        monkeypatch.setattr(
            ai_providers.urllib.request, "urlopen", lambda *a, **k: _FakeResponse({"message": {"content": "   "}})
        )
        provider = OllamaProvider(base_url="http://localhost:11434", model="llama3.2:1b")

        with pytest.raises(AIProviderError):
            provider.complete([{"role": "user", "content": "hi"}], "sys")

    def test_default_base_url_when_unset(self):
        provider = OllamaProvider(base_url=None, model="llama3.2:1b")
        assert provider.base_url == "http://localhost:11434"


class TestAnthropicProvider:
    def test_missing_api_key_raises_before_any_network_call(self, monkeypatch):
        def fail_if_called(*a, **k):
            raise AssertionError("urlopen should not be called without an API key")

        monkeypatch.setattr(ai_providers.urllib.request, "urlopen", fail_if_called)
        provider = AnthropicProvider(api_key=None, model="claude-sonnet-5")

        with pytest.raises(AIProviderError) as exc:
            provider.complete([{"role": "user", "content": "hi"}], "sys")
        assert "ANTHROPIC_API_KEY" in exc.value.public_message

    def test_complete_returns_reply_text(self, monkeypatch):
        monkeypatch.setattr(
            ai_providers.urllib.request,
            "urlopen",
            lambda *a, **k: _FakeResponse({"content": [{"type": "text", "text": "Plant in rows 75cm apart."}]}),
        )
        provider = AnthropicProvider(api_key="sk-test", model="claude-sonnet-5")
        reply = provider.complete([{"role": "user", "content": "Maize spacing?"}], "sys")
        assert reply == "Plant in rows 75cm apart."

    def test_upstream_http_error_raises_ai_provider_error(self, monkeypatch):
        def raise_500(*a, **k):
            raise urllib.error.HTTPError("url", 500, "Server Error", hdrs=None, fp=io.BytesIO(b"internal details"))

        monkeypatch.setattr(ai_providers.urllib.request, "urlopen", raise_500)
        provider = AnthropicProvider(api_key="sk-test", model="claude-sonnet-5")

        with pytest.raises(AIProviderError) as exc:
            provider.complete([{"role": "user", "content": "hi"}], "sys")
        # Never leak the raw upstream error body to the public message.
        assert "internal details" not in exc.value.public_message
