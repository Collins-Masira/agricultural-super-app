# app/extensions.py

from datetime import datetime, timezone

from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_marshmallow import Marshmallow
from flask_mail import Mail
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

db = SQLAlchemy()
migrate = Migrate()
ma = Marshmallow()
mail = Mail()
limiter = Limiter(key_func=get_remote_address)


def utcnow():
    """UTC now as a naive datetime (DB columns are naive UTC). Replaces
    the deprecated datetime.utcnow while keeping naive semantics that
    every PostgreSQL/SQLite column and serialization layer expects."""
    return datetime.now(timezone.utc).replace(tzinfo=None)
