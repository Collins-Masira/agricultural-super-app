# tests/integration/test_error_handling.py
#
# Cross-cutting concerns that don't belong to any single resource's test
# file: the consistent JSON error envelope, framework-level 404/405, and
# the health check. Resource-specific error cases (404 on a missing
# post, 403 on someone else's comment, etc.) are already covered in
# their own route test files -- this file exists for the handling
# itself, not to re-verify every business rule a second time.

from app.errors import ConflictError, ForbiddenError, NotFoundError, UnauthorizedError, ValidationAPIError


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
