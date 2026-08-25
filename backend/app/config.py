# app/config.py

import os


class Config:
    """
    Shared base configuration. Every value is overridable via environment
    variable so the same codebase runs unmodified across dev/test/prod --
    only the environment differs. Never instantiate this directly; use
    get_config() to select a concrete subclass.
    """

    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-me")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/agri_super_app",
    )

    # Falls back to SECRET_KEY only for local-dev convenience; production
    # should always set JWT_SECRET_KEY explicitly and independently, so a
    # leak of one secret doesn't compromise both signing schemes.
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", SECRET_KEY)
    JWT_ALGORITHM = "HS256"
    JWT_ACCESS_TOKEN_EXPIRES_SECONDS = int(
        os.environ.get("JWT_ACCESS_TOKEN_EXPIRES_SECONDS", 60 * 60 * 24)  # 24h
    )

    # Comma-separated list of allowed browser origins for the SPA.
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",")
        if origin.strip()
    ]

    JSON_SORT_KEYS = False


class DevelopmentConfig(Config):
    DEBUG = True


class TestingConfig(Config):
    """
    Used by the test suite. Defaults to an in-memory SQLite database so
    tests run fast and never touch a real database unless
    TEST_DATABASE_URL is explicitly set (e.g. to run the suite against
    real Postgres in CI).
    """

    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "TEST_DATABASE_URL", "sqlite:///:memory:"
    )
    JWT_ACCESS_TOKEN_EXPIRES_SECONDS = 3600

    # Flask defaults PROPAGATE_EXCEPTIONS to True whenever TESTING=True,
    # which makes unhandled exceptions bubble up raw to the test client
    # instead of going through our registered error handlers. That's the
    # opposite of what we want: the whole point of testing error
    # handling is to confirm the handler produces the same JSON envelope
    # in tests as it would in production. Explicitly disabling this
    # keeps test behavior representative of real request handling.
    PROPAGATE_EXCEPTIONS = False


class ProductionConfig(Config):
    DEBUG = False


CONFIG_MAP = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}


def get_config(config_name=None):
    """
    Resolve a config class by name, falling back to the FLASK_ENV
    environment variable, then to DevelopmentConfig. Returns the class
    itself (not an instance) -- Flask's app.config.from_object() reads
    class attributes directly.
    """
    config_name = config_name or os.environ.get("FLASK_ENV", "default")
    return CONFIG_MAP.get(config_name, DevelopmentConfig)
