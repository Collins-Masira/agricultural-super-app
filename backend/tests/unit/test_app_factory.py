# tests/unit/test_app_factory.py
#
# Tests _validate_production_secrets() directly against a minimal Flask
# app with an explicit .config, rather than going through create_app()
# with real Config subclasses -- Config.SECRET_KEY etc. are read from
# os.environ at CLASS-DEFINITION time (module import), not per
# get_config() call, so monkeypatching env vars after app.config has
# already been imported elsewhere in the suite has no effect on them.
# Testing the guard function in isolation sidesteps that entirely and is
# a more direct test of the actual thing being verified anyway.

import pytest
from flask import Flask

from app import _validate_production_secrets


def _app(**config):
    app = Flask(__name__)
    app.config.update(**config)
    return app


class TestProductionSecretGuard:
    def test_production_with_default_secret_key_refuses_to_start(self):
        app = _app(DEBUG=False, TESTING=False, SECRET_KEY="dev-secret-key-change-me", JWT_SECRET_KEY="dev-secret-key-change-me")
        with pytest.raises(RuntimeError, match="SECRET_KEY"):
            _validate_production_secrets(app)

    def test_production_with_default_jwt_secret_key_refuses_to_start(self):
        app = _app(DEBUG=False, TESTING=False, SECRET_KEY="a-real-secret", JWT_SECRET_KEY="dev-secret-key-change-me")
        with pytest.raises(RuntimeError, match="JWT_SECRET_KEY"):
            _validate_production_secrets(app)

    def test_production_with_real_secrets_passes(self):
        app = _app(
            DEBUG=False,
            TESTING=False,
            SECRET_KEY="a-real-random-production-secret",
            JWT_SECRET_KEY="a-different-real-random-secret",
        )
        _validate_production_secrets(app)  # should not raise

    def test_development_with_default_secret_key_is_allowed(self):
        app = _app(DEBUG=True, TESTING=False, SECRET_KEY="dev-secret-key-change-me", JWT_SECRET_KEY="dev-secret-key-change-me")
        _validate_production_secrets(app)  # should not raise

    def test_testing_with_default_secret_key_is_allowed(self):
        app = _app(DEBUG=False, TESTING=True, SECRET_KEY="dev-secret-key-change-me", JWT_SECRET_KEY="dev-secret-key-change-me")
        _validate_production_secrets(app)  # should not raise

    def test_real_create_app_boots_for_testing_and_development(self):
        # End-to-end sanity check that the guard is actually wired into
        # create_app() and doesn't block the two configs the rest of the
        # suite (and local dev) depend on.
        from app import create_app

        assert create_app("testing") is not None
        assert create_app("development") is not None
