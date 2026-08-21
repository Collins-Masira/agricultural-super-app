# app/__init__.py

from flask import Flask

from app.config import Config
from app.extensions import db, ma, migrate


def create_app(config_class=Config):
    """Application factory.

    Establishes the Flask app, binds the SQLAlchemy/Migrate/Marshmallow
    extensions, and imports the model classes so they are registered on the
    SQLAlchemy metadata (used by Flask-Migrate and db.create_all()).
    """
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    ma.init_app(app)

    # Importing the models package registers every model on db.metadata.
    from app import models  # noqa: F401,E402

    return app