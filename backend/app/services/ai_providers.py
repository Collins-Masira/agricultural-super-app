# app/services/ai_providers.py

"""
AI provider abstraction for the AI Farming Assistant.

Keeps the application from being architecturally locked to a single paid
AI vendor. `ai_service.py` (the module the rest of the app talks to)
resolves a concrete AIProvider from config and calls `.complete()` --
everything provider-specific (request shape, auth, response parsing) is
contained inside that provider's class, and the frontend never talks to
a provider directly (Frontend -> Flask /api/ai/assistant -> ai_service
-> AIProvider -> actual provider).

Providers:
  - OllamaProvider    (default): a locally-run, open-source model served
    by Ollama (https://ollama.com). No API key, no external network call
    -- this is what the app uses out of the box with nothing configured
    beyond `ollama serve` running locally.
  - AnthropicProvider (optional): Claude via the Anthropic Messages API,
    for teams that want a hosted model in staging/production. Requires
    ANTHROPIC_API_KEY.

Select the active provider with the AI_PROVIDER env var (see
app/config.py): "ollama" (default) or "anthropic".
"""

import json
import urllib.error
import urllib.request
from abc import ABC, abstractmethod

# Sensible default per provider when AI_MODEL isn't set. Ollama's is a
# small, widely-available open model; Anthropic's is the current
# general-purpose Claude model.
DEFAULT_MODELS = {
    "ollama": "llama3.2:1b",
    "anthropic": "claude-sonnet-5",
}


class AIProviderError(Exception):
    """
    Raised by any provider on failure (unreachable, misconfigured, timed
    out, malformed response, etc). Deliberately the ONE exception type
    every provider raises, regardless of what actually went wrong
    upstream -- ai_service.py only has to catch this single type to
    handle every provider uniformly.

    `public_message` is safe to show a user (no internals, no secrets).
    `log_message` carries the real detail for server-side logs only.
    """

    def __init__(self, public_message, log_message=None):
        super().__init__(public_message)
        self.public_message = public_message
        self.log_message = log_message or public_message


class AIProvider(ABC):
    """Common interface every AI provider implements."""

    @abstractmethod
    def complete(self, messages, system_prompt):
        """
        `messages`: list of {"role": "user"|"assistant", "content": str},
        already trimmed/validated by the caller.

        Returns the assistant's reply text, or raises AIProviderError.
        """
        raise NotImplementedError


class OllamaProvider(AIProvider):
    """
    Calls a local (or self-hosted) Ollama server's chat API
    (POST {base_url}/api/chat). Ollama has no concept of an API key, so
    "not configured" for this provider means "the server isn't running"
    or "the model hasn't been pulled yet" -- both handled explicitly
    below rather than surfacing a generic failure for either.
    """

    REQUEST_TIMEOUT_SECONDS = 60

    def __init__(self, base_url, model):
        self.base_url = (base_url or "http://localhost:11434").rstrip("/")
        self.model = model

    def complete(self, messages, system_prompt):
        body = json.dumps(
            {
                "model": self.model,
                "messages": [{"role": "system", "content": system_prompt}, *messages],
                "stream": False,
            }
        ).encode("utf-8")

        request_obj = urllib.request.Request(
            f"{self.base_url}/api/chat",
            data=body,
            method="POST",
            headers={"Content-Type": "application/json"},
        )

        try:
            with urllib.request.urlopen(request_obj, timeout=self.REQUEST_TIMEOUT_SECONDS) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as err:
            detail = err.read().decode("utf-8", errors="replace")
            if err.code == 404 or "not found" in detail.lower():
                raise AIProviderError(
                    f'The AI model "{self.model}" is not available on the configured Ollama '
                    f"server. Ask an admin to run `ollama pull {self.model}`.",
                    log_message=f"Ollama model not found (model={self.model}): {detail}",
                )
            raise AIProviderError(
                "The AI assistant could not process your request right now. Please try again.",
                log_message=f"Ollama HTTP error {err.code}: {detail}",
            )
        except (urllib.error.URLError, TimeoutError, ConnectionError) as err:
            raise AIProviderError(
                "The AI assistant is temporarily unavailable (the local AI server is not "
                "reachable). Please try again shortly.",
                log_message=f"Ollama unreachable at {self.base_url}: {err}",
            )
        except json.JSONDecodeError as err:
            raise AIProviderError(
                "The AI assistant returned an unexpected response. Please try again.",
                log_message=f"Ollama returned non-JSON response: {err}",
            )

        try:
            content = payload["message"]["content"]
        except (KeyError, TypeError) as err:
            raise AIProviderError(
                "The AI assistant returned an unexpected response. Please try again.",
                log_message=f"Ollama malformed response shape: {payload!r} ({err})",
            )

        if not isinstance(content, str) or not content.strip():
            raise AIProviderError(
                "The AI assistant returned an empty response. Please try again.",
                log_message=f"Ollama returned empty content: {payload!r}",
            )
        return content.strip()


class AnthropicProvider(AIProvider):
    """Calls the Anthropic Messages API. Requires ANTHROPIC_API_KEY."""

    API_URL = "https://api.anthropic.com/v1/messages"
    API_VERSION = "2023-06-01"
    REQUEST_TIMEOUT_SECONDS = 20
    MAX_TOKENS = 1024

    def __init__(self, api_key, model):
        self.api_key = api_key
        self.model = model

    def complete(self, messages, system_prompt):
        if not self.api_key:
            raise AIProviderError(
                "The AI assistant is not configured. Set the ANTHROPIC_API_KEY "
                "environment variable on the server (with AI_PROVIDER=anthropic) to "
                "enable this feature."
            )

        body = json.dumps(
            {
                "model": self.model,
                "max_tokens": self.MAX_TOKENS,
                "system": system_prompt,
                "messages": messages,
            }
        ).encode("utf-8")

        request_obj = urllib.request.Request(
            self.API_URL,
            data=body,
            method="POST",
            headers={
                "Content-Type": "application/json",
                "x-api-key": self.api_key,
                "anthropic-version": self.API_VERSION,
            },
        )

        try:
            with urllib.request.urlopen(request_obj, timeout=self.REQUEST_TIMEOUT_SECONDS) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as err:
            detail = err.read().decode("utf-8", errors="replace")
            raise AIProviderError(
                "The AI assistant could not process your request right now. Please try again.",
                log_message=f"Anthropic HTTP error {err.code}: {detail}",
            )
        except (urllib.error.URLError, TimeoutError) as err:
            raise AIProviderError(
                "The AI assistant is temporarily unavailable. Please try again shortly.",
                log_message=f"Anthropic unreachable: {err}",
            )
        except json.JSONDecodeError as err:
            raise AIProviderError(
                "The AI assistant returned an unexpected response. Please try again.",
                log_message=f"Anthropic returned non-JSON response: {err}",
            )

        try:
            text = "".join(
                block["text"] for block in payload["content"] if block.get("type") == "text"
            ).strip()
        except (KeyError, TypeError) as err:
            raise AIProviderError(
                "The AI assistant returned an unexpected response. Please try again.",
                log_message=f"Anthropic malformed response shape: {payload!r} ({err})",
            )

        if not text:
            raise AIProviderError(
                "The AI assistant returned an empty response. Please try again.",
                log_message=f"Anthropic returned empty content: {payload!r}",
            )
        return text


def get_provider(config):
    """
    Build the configured AIProvider from Flask app config (`current_app.config`
    or an equivalent mapping). Raises AIProviderError -- not a hard crash --
    for an unknown AI_PROVIDER value, so a typo in config degrades to a
    clean 503 for the caller instead of an unhandled 500.
    """
    provider_name = (config.get("AI_PROVIDER") or "ollama").strip().lower()
    model = config.get("AI_MODEL") or DEFAULT_MODELS.get(provider_name)

    if provider_name == "ollama":
        return OllamaProvider(base_url=config.get("OLLAMA_BASE_URL"), model=model)
    if provider_name == "anthropic":
        return AnthropicProvider(api_key=config.get("ANTHROPIC_API_KEY"), model=model)

    raise AIProviderError(
        "The AI assistant is misconfigured on the server.",
        log_message=f"Unknown AI_PROVIDER={provider_name!r}; expected 'ollama' or 'anthropic'.",
    )
