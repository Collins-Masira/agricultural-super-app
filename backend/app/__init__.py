# app/__init__.py

from flask import Flask
from flask_cors import CORS

from app.config import get_config
from app.errors import register_error_handlers
from app.extensions import db, ma, migrate
from app.routes import register_blueprints


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

    db.init_app(app)
    migrate.init_app(app, db)
    ma.init_app(app)

    CORS(app, origins=app.config["CORS_ORIGINS"], supports_credentials=True)

    register_error_handlers(app)
    register_blueprints(app)

    @app.get("/health")
    def health_check():
        """Unauthenticated liveness probe for load balancers / uptime checks."""
        return {"status": "ok"}, 200

    if app.config.get("TESTING"):
        # Test-only route so the global 500 handler (JSON envelope,
        # session rollback) can be exercised by an actual unhandled
        # exception rather than left as an unverified assumption. Gated
        # behind TESTING so it can never exist in a production app.
        @app.get("/debug/raise")
        def debug_raise():
            raise RuntimeError("Deliberate test exception.")

    return app