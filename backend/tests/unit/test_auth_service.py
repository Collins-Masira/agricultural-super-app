# tests/unit/test_auth_service.py

import pytest

from app.errors import ConflictError, UnauthorizedError
from app.services import auth_service


def _register_data(username="amina", email="amina@example.com", password="supersecret123", role="farmer"):
    """
    Matches the shape UserSchema.load() produces: password under the
    key "password_hash" (see app/schemas/user_schema.py's data_key), not
    a schema call itself -- these are unit tests of the SERVICE, so we
    hand it exactly what the schema would have handed it, without going
    through the schema (or HTTP) at all.
    """
    return {"username": username, "email": email, "password_hash": password, "role": role}


class TestRegisterUser:
    def test_creates_user_with_hashed_password(self):
        user = auth_service.register_user(_register_data())
        assert user.id is not None
        assert user.username == "amina"
        assert user.email == "amina@example.com"
        # The whole point of hashing: the stored value is never the
        # plaintext we handed in.
        assert user.password_hash != "supersecret123"
        assert user.check_password("supersecret123") is True

    def test_defaults_role_to_farmer_when_omitted(self):
        data = _register_data()
        data.pop("role")
        # register_user reads data.get("role", "farmer") -- this proves
        # that default holds even when the caller omits the key
        # entirely, not just when it's explicitly "farmer".
        user = auth_service.register_user(data)
        assert user.role == "farmer"

    def test_duplicate_username_raises_conflict(self):
        auth_service.register_user(_register_data(username="amina", email="a1@example.com"))
        with pytest.raises(ConflictError):
            auth_service.register_user(_register_data(username="amina", email="a2@example.com"))

    def test_duplicate_email_raises_conflict(self):
        auth_service.register_user(_register_data(username="amina", email="shared@example.com"))
        with pytest.raises(ConflictError):
            auth_service.register_user(_register_data(username="different", email="shared@example.com"))


class TestAuthenticateUser:
    def test_valid_username_and_password_succeeds(self, create_user):
        create_user(username="brian", password="anothersecret123")
        user = auth_service.authenticate_user("brian", "anothersecret123")
        assert user.username == "brian"

    def test_valid_email_succeeds(self, create_user):
        create_user(username="brian", email="brian@example.com", password="anothersecret123")
        user = auth_service.authenticate_user("brian@example.com", "anothersecret123")
        assert user.username == "brian"

    def test_wrong_password_raises_unauthorized(self, create_user):
        create_user(username="brian", password="anothersecret123")
        with pytest.raises(UnauthorizedError):
            auth_service.authenticate_user("brian", "wrongpassword")

    def test_unknown_identifier_raises_unauthorized(self):
        with pytest.raises(UnauthorizedError):
            auth_service.authenticate_user("nobody", "whatever123")

    def test_inactive_account_raises_unauthorized(self, create_user):
        create_user(username="deactivated", password="somepassword123", is_active=False)
        with pytest.raises(UnauthorizedError):
            auth_service.authenticate_user("deactivated", "somepassword123")

    def test_same_error_message_for_unknown_user_and_wrong_password(self, create_user):
        # Regression guard for the anti-enumeration design decision noted
        # in auth_service.py: these two failure modes must be
        # indistinguishable to the caller.
        create_user(username="brian", password="anothersecret123")

        with pytest.raises(UnauthorizedError) as unknown_user_exc:
            auth_service.authenticate_user("nobody", "whatever123")

        with pytest.raises(UnauthorizedError) as wrong_password_exc:
            auth_service.authenticate_user("brian", "wrongpassword")

        assert unknown_user_exc.value.message == wrong_password_exc.value.message
