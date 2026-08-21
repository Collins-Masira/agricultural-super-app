# app/config.py

import os


class Config:
    """Base application configuration.

    The target database is PostgreSQL; supply a DATABASE_URL to override the
    local development default. The DBMS has not been finalised in the schema
    docs yet, so the connection is environment-driven.
    """

    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")

    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/agricultural_super_app",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False