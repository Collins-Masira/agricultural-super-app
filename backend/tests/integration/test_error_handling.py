# tests/integration/test_error_handling.py
#
# Cross-cutting concerns that don't belong to any single resource's test
# file: the consistent JSON error envelope, framework-level 404/405, and
# the health check. Resource-specific error cases (404 on a missing
# post, 403 on someone else's comment, etc.) are already covered in
# their own route test files -- this file exists for the handling
# itself, not to re-verify every business rule a second time.

from app.errors import (
    ConflictError,
    ForbiddenError,
    InvalidTokenError,
    NotFoundError,
    UnauthorizedError,
    ValidationAPIError,
)


class TestErrorEnvelopeShape:
    def test_not_found_error_has_consistent_shape(self, client):
        response = client.get("/api/posts/999999")
        body = response.get_json()
        assert response.status_code == 404
        assert set(body.keys()) == {"error"}
        assert isinstance(body["error"], str)

    def test_validation_error_includes_details(self, client):
        response = client.post("/api/auth/register", json={"username": "ab"})
        body = response.get_json()
        assert response.status_code == 422
        assert "error" in body
        assert "details" in body
        assert isinstance(body["details"], dict)

    def test_unmatched_route_returns_json_not_html(self, client):
        response = client.get("/api/this-route-does-not-exist")
        assert response.status_code == 404
        assert response.content_type == "application/json"
        assert "error" in response.get_json()

    def test_wrong_http_method_returns_405_json(self, client):
        # /api/posts exists for GET/POST, not DELETE
        response = client.delete("/api/posts")
        assert response.status_code == 405
        assert "error" in response.get_json()

    def test_unhandled_exception_returns_json_500_not_a_stack_trace(self, client):
        # Exercises the actual 500 handler via a genuine unhandled
        # exception (see app/__init__.py's TESTING-only /debug/raise),
        # rather than just trusting the handler is correct by reading
        # it. A person hitting a real bug in production should get this
        # same clean JSON response, never a leaked traceback.
        response = client.get("/debug/raise")
        assert response.status_code == 500
        assert response.get_json() == {"error": "An unexpected server error occurred."}


class TestApiErrorHierarchy:
    """
    Confirms each custom exception carries the HTTP status code the rest
    of the app assumes it does -- a class-level typo here (e.g.
    ForbiddenError.status_code = 401 instead of 403) would silently
    change every route's error responses without any single route test
    necessarily catching it, since each route test only checks its own
    expected status code.
    """

    def test_status_codes_match_http_semantics(self):
        assert ValidationAPIError("x").status_code == 422
        assert UnauthorizedError("x").status_code == 401
        assert ForbiddenError("x").status_code == 403
        assert NotFoundError("x").status_code == 404
        assert ConflictError("x").status_code == 409

    def test_payload_is_included_in_details(self):
        err = ValidationAPIError("Invalid input.", payload={"field": ["reason"]})
        assert err.to_dict() == {"error": "Invalid input.", "details": {"field": ["reason"]}}

    def test_no_payload_omits_details_key(self):
        err = NotFoundError("Not found.")
        assert err.to_dict() == {"error": "Not found."}

    def test_status_code_can_be_overridden_per_instance(self):
        # ApiError.__init__ allows overriding the class-level default --
        # e.g. raise ApiError("Teapot.", status_code=418) -- without
        # needing a dedicated subclass for a one-off status code.
        err = NotFoundError("Custom.", status_code=418)
        assert err.status_code == 418
        # ...and instances that don't pass one keep the class default.
        assert NotFoundError("Default.").status_code == 404

    def test_invalid_token_error_is_a_401_with_a_code_marker(self):
        # InvalidTokenError is what jwt_required raises for a genuinely
        # dead session (missing/expired/forged token, deactivated
        # account) -- the frontend's global 401 handler forces a logout
        # ONLY when it sees this marker (see http.js), so this class
        # existing, being 401, and carrying `code: "invalid_token"` in
        # its envelope is the entire contract that handler depends on.
        err = InvalidTokenError("Token has expired.")
        assert err.status_code == 401
        assert err.code == "invalid_token"
        assert err.to_dict() == {"error": "Token has expired.", "code": "invalid_token"}

    def test_plain_unauthorized_error_has_no_code_marker(self):
        # A plain UnauthorizedError (login with the wrong password,
        # change-password with the wrong current password) must NOT
        # carry the invalid_token marker -- these are ordinary domain
        # failures on a request whose token (if any) is completely
        # valid, and must never force a logout of the current session.
        err = UnauthorizedError("Current password is incorrect.")
        assert err.status_code == 401
        assert err.code is None
        assert "code" not in err.to_dict()


class TestInvalidTokenCodeMarker:
    """
    Regression coverage for a real bug: the frontend used to force-logout
    the current session on ANY 401 response, anywhere -- including a
    401 from an authenticated, otherwise-valid request that failed for a
    business reason (e.g. change-password with the wrong current
    password). That silently killed a perfectly good admin session, so
    a later unrelated admin action (e.g. reactivating a user) would then
    fail with "Missing or malformed Authorization header" for no visible
    reason. The fix: only requests where jwt_required itself rejects the
    token carry `code: "invalid_token"` in the error envelope; the
    frontend keys its force-logout off that marker specifically.
    """

    def test_missing_auth_header_carries_the_marker(self, client):
        response = client.get("/api/admin/stats")
        body = response.get_json()
        assert response.status_code == 401
        assert body["code"] == "invalid_token"

    def test_malformed_token_carries_the_marker(self, client):
        response = client.get("/api/admin/stats", headers={"Authorization": "Bearer not-a-real-jwt"})
        body = response.get_json()
        assert response.status_code == 401
        assert body["code"] == "invalid_token"

    def test_deactivated_users_token_carries_the_marker(self, client, admin_user, amina):
        client.patch(f"/api/admin/users/{amina['user']['id']}", headers=admin_user["headers"], json={"is_active": False})
        response = client.get("/api/auth/me", headers=amina["headers"])
        body = response.get_json()
        assert response.status_code == 401
        assert body["code"] == "invalid_token"

    def test_wrong_login_password_does_not_carry_the_marker(self, client, amina):
        response = client.post("/api/auth/login", json={"username": "amina", "password": "WrongPassword123!"})
        body = response.get_json()
        assert response.status_code == 401
        assert "code" not in body

    def test_wrong_change_password_current_password_does_not_carry_the_marker(self, client, amina):
        # This is the exact bug: a valid, authenticated request (real
        # token, real user) that fails for a domain reason. A still-valid
        # session token must survive this.
        response = client.put(
            "/api/auth/change-password",
            headers=amina["headers"],
            json={"current_password": "WrongCurrentPassword!", "new_password": "NewStrong123!"},
        )
        body = response.get_json()
        assert response.status_code == 401
        assert "code" not in body


class TestHealthCheck:
    def test_health_check_does_not_require_auth(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.get_json() == {"status": "ok"}


class TestCors:
    """
    The whole reason Flask-Cors was added (see requirements.txt's
    justification comment) is so the separate ReactJS/Redux SPA can call
    this API from the browser at all -- without the right header, every
    browser blocks the response before JS ever sees it, even though the
    request succeeded on the wire. This proves the configuration in
    create_app() actually takes effect, not just that it's present in
    the code.
    """

    def test_allowed_origin_receives_cors_header(self, client, app):
        allowed_origin = app.config["CORS_ORIGINS"][0]
        response = client.get("/health", headers={"Origin": allowed_origin})
        assert response.headers.get("Access-Control-Allow-Origin") == allowed_origin

    def test_disallowed_origin_does_not_receive_cors_header(self, client):
        response = client.get("/health", headers={"Origin": "https://evil-site.example.com"})
        # Flask-Cors omits the header entirely for origins not in the
        # allow-list, rather than sending a "false" value -- the
        # browser's same-origin policy then blocks the response.
        assert response.headers.get("Access-Control-Allow-Origin") is None
