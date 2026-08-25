# tests/integration/test_auth_routes.py

class TestRegister:
    def test_register_success_returns_token_and_user(self, client):
        response = client.post(
            "/api/auth/register",
            json={"username": "amina", "email": "amina@example.com", "password": "supersecret123"},
        )
        assert response.status_code == 201
        body = response.get_json()
        assert "token" in body
        assert body["user"]["username"] == "amina"
        assert body["user"]["role"] == "farmer"

    def test_password_hash_never_appears_in_response(self, client):
        response = client.post(
            "/api/auth/register",
            json={"username": "amina", "email": "amina@example.com", "password": "supersecret123"},
        )
        assert "password_hash" not in response.get_json()["user"]
        assert "password" not in response.get_json()["user"]

    def test_self_registering_as_admin_is_rejected(self, client):
        # The security fix documented in app/schemas/user_schema.py and
        # docs/TECHNICAL_DEBT.md -- this is the single most important
        # test in the whole suite, since a regression here is a
        # privilege-escalation vulnerability, not just a broken feature.
        response = client.post(
            "/api/auth/register",
            json={
                "username": "hacker",
                "email": "hacker@example.com",
                "password": "hackerpass123",
                "role": "admin",
            },
        )
        assert response.status_code == 422
        assert "role" in response.get_json()["details"]

    def test_self_registering_as_expert_is_allowed(self, client):
        response = client.post(
            "/api/auth/register",
            json={
                "username": "expert1",
                "email": "expert1@example.com",
                "password": "supersecret123",
                "role": "expert",
            },
        )
        assert response.status_code == 201
        assert response.get_json()["user"]["role"] == "expert"

    def test_duplicate_username_returns_409(self, client, amina):
        response = client.post(
            "/api/auth/register",
            json={"username": "amina", "email": "different@example.com", "password": "supersecret123"},
        )
        assert response.status_code == 409

    def test_duplicate_email_returns_409(self, client, amina):
        response = client.post(
            "/api/auth/register",
            json={"username": "different", "email": "amina@example.com", "password": "supersecret123"},
        )
        assert response.status_code == 409

    def test_short_password_returns_422(self, client):
        response = client.post(
            "/api/auth/register",
            json={"username": "weakpw", "email": "weak@example.com", "password": "short"},
        )
        assert response.status_code == 422

    def test_missing_fields_returns_422(self, client):
        response = client.post("/api/auth/register", json={"username": "onlyusername"})
        assert response.status_code == 422

    def test_malformed_json_body_does_not_500(self, client):
        # request.get_json(silent=True) returns None for unparseable
        # JSON rather than raising -- the route then hands `{}` to the
        # schema, which should fail validation (422), not crash the
        # server (500).
        response = client.post(
            "/api/auth/register",
            data="not valid json{{{",
            content_type="application/json",
        )
        assert response.status_code == 422


class TestLogin:
    def test_login_with_username_succeeds(self, client, amina):
        response = client.post("/api/auth/login", json={"username": "amina", "password": "testpassword123"})
        assert response.status_code == 200
        assert "token" in response.get_json()

    def test_login_with_email_succeeds(self, client, amina):
        response = client.post(
            "/api/auth/login", json={"email": amina["user"]["email"], "password": "testpassword123"}
        )
        assert response.status_code == 200

    def test_wrong_password_returns_401(self, client, amina):
        response = client.post("/api/auth/login", json={"username": "amina", "password": "wrongpassword"})
        assert response.status_code == 401

    def test_missing_password_returns_422(self, client, amina):
        response = client.post("/api/auth/login", json={"username": "amina"})
        assert response.status_code == 422


class TestMe:
    def test_no_token_returns_401(self, client):
        response = client.get("/api/auth/me")
        assert response.status_code == 401

    def test_malformed_auth_header_returns_401(self, client):
        response = client.get("/api/auth/me", headers={"Authorization": "NotBearer sometoken"})
        assert response.status_code == 401

    def test_garbage_token_returns_401(self, client):
        response = client.get("/api/auth/me", headers={"Authorization": "Bearer not.a.real.token"})
        assert response.status_code == 401

    def test_valid_token_returns_current_user(self, client, amina):
        response = client.get("/api/auth/me", headers=amina["headers"])
        assert response.status_code == 200
        assert response.get_json()["username"] == "amina"

    def test_expired_token_returns_401(self, client, amina, app):
        # Crafts a token manually with an already-past expiry, rather
        # than waiting for a real one to expire -- deliberately bypasses
        # encode_token() to control the exp claim directly.
        import jwt as pyjwt
        from datetime import datetime, timedelta, timezone

        expired_payload = {
            "sub": str(amina["user"]["id"]),
            "iat": datetime.now(timezone.utc) - timedelta(hours=2),
            "exp": datetime.now(timezone.utc) - timedelta(hours=1),
        }
        expired_token = pyjwt.encode(expired_payload, app.config["JWT_SECRET_KEY"], algorithm="HS256")

        response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
        assert response.status_code == 401
        assert "expired" in response.get_json()["error"].lower()

    def test_token_with_non_numeric_sub_returns_401(self, client, app):
        # "sub" isn't a valid user id at all -- decorators.py must catch
        # this (ValueError from int(payload["sub"])) rather than letting
        # it crash the request with an unhandled 500.
        import jwt as pyjwt

        bad_payload = {"sub": "not-a-user-id"}
        bad_token = pyjwt.encode(bad_payload, app.config["JWT_SECRET_KEY"], algorithm="HS256")

        response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {bad_token}"})
        assert response.status_code == 401

    def test_token_with_missing_sub_claim_returns_401(self, client, app):
        import jwt as pyjwt

        token_without_sub = pyjwt.encode({}, app.config["JWT_SECRET_KEY"], algorithm="HS256")

        response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token_without_sub}"})
        assert response.status_code == 401

    def test_token_for_deactivated_user_returns_401(self, client, amina):
        # The important claim in decorators.py's docstring: is_active is
        # re-checked on EVERY request, not just at login. A token issued
        # while the account was active must stop working the moment the
        # account is deactivated -- even though the token itself is
        # still validly signed and unexpired.
        from app.extensions import db
        from app.models import User

        user = db.session.get(User, amina["user"]["id"])
        user.is_active = False
        db.session.commit()

        response = client.get("/api/auth/me", headers=amina["headers"])
        assert response.status_code == 401

    def test_token_signed_with_wrong_secret_returns_401(self, client, amina):
        # Distinct from "garbage token" (which isn't even a valid JWT
        # structure) and "expired token" (correctly signed, bad exp):
        # this is a well-formed, correctly-shaped token with legitimate
        # claims, signed with a DIFFERENT secret than the app trusts.
        # This is the exact attack signature verification exists to
        # stop -- if this test ever passes with 200, the app is trusting
        # forged tokens.
        import jwt as pyjwt
        from datetime import datetime, timedelta, timezone

        forged_payload = {
            "sub": str(amina["user"]["id"]),
            "iat": datetime.now(timezone.utc),
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        }
        forged_token = pyjwt.encode(forged_payload, "attacker-controlled-secret", algorithm="HS256")

        response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {forged_token}"})
        assert response.status_code == 401
