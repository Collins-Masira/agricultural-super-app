import os

from flask import Flask
from flask_cors import CORS

from app.config import get_config
from app.errors import register_error_handlers
from app.extensions import db, ma, mail, migrate
from app.routes import register_blueprints

_INSECURE_DEFAULTS = {
    "SECRET_KEY": "dev-secret-key-change-me",
    "JWT_SECRET_KEY": "dev-secret-key-change-me",
}


def _validate_production_secrets(app):
    """
    Refuse to boot in production with a well-known default secret --
    tokens signed with a secret an attacker can read from this file's
    source are forgeable, which defeats authentication entirely. See
    docs/TECHNICAL_DEBT.md item 6 for the original finding; this closes
    it rather than leaving it as a deploy-time trust exercise.
    """
    is_production = app.config.get("DEBUG") is False and not app.config.get("TESTING")
    if not is_production:
        return

    for key, insecure_default in _INSECURE_DEFAULTS.items():
        if app.config.get(key) == insecure_default:
            raise RuntimeError(
                f"Refusing to start: {key} is still set to its insecure development default. "
                f"Set a real {key} via environment variable before running in production."
            )


def create_app(config_name=None):
    """
    Application factory. Using a factory (rather than a module-level
    `app = Flask(__name__)`) is what makes it possible to run the exact
    same codebase against different configs -- e.g. TestingConfig's
    in-memory SQLite for the test suite -- without any import-order
    tricks or monkeypatching.
    """
    app = Flask(__name__)
    app.config.from_object(get_config(config_name))
    _validate_production_secrets(app)
    if not app.config.get("UPLOAD_FOLDER"):
        app.config["UPLOAD_FOLDER"] = os.path.join(app.instance_path, "uploads")
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    db.init_app(app)
    migrate.init_app(app, db)
    ma.init_app(app)
    mail.init_app(app)

    CORS(app, origins=app.config["CORS_ORIGINS"], supports_credentials=True)

    # Importing the models package registers every model on db.metadata.
    from app import models  # noqa: F401,E402

    register_error_handlers(app)
    register_blueprints(app)

    @app.get("/health")
    def health_check():
        """Unauthenticated liveness probe for load balancers / uptime checks."""
        return {"status": "ok"}, 200

    if app.config.get("TESTING"):
        @app.get("/debug/raise")
        def debug_raise():
            raise RuntimeError("Deliberate test exception.")

    return app
