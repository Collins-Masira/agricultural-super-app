# tests/unit/test_config.py
#
# Tests _normalize_database_url() directly rather than through
# get_config()/Config.SQLALCHEMY_DATABASE_URI -- Config reads DATABASE_URL
# from os.environ at CLASS-DEFINITION time (module import), so
# monkeypatching the env var afterward has no effect on it (see
# test_app_factory.py for the same caveat with SECRET_KEY). Testing the
# normalization function in isolation sidesteps that entirely.

from app.config import _normalize_database_url


class TestNormalizeDatabaseUrl:
    def test_rewrites_legacy_postgres_scheme(self):
        assert (
            _normalize_database_url("postgres://user:pass@host:5432/db")
            == "postgresql://user:pass@host:5432/db"
        )

    def test_leaves_correct_postgresql_scheme_unchanged(self):
        url = "postgresql://user:pass@host:5432/db"
        assert _normalize_database_url(url) == url

    def test_leaves_unrelated_scheme_unchanged(self):
        assert _normalize_database_url("sqlite:///:memory:") == "sqlite:///:memory:"
