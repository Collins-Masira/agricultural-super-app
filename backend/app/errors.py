# app/errors.py

from flask import jsonify
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError

from app.extensions import db


class ApiError(Exception):
    """
    Base class for every deliberately-raised API error. Routes and
    services raise these instead of constructing Flask responses
    directly, keeping HTTP concerns out of the service layer and
    guaranteeing every error reaches the client through the same JSON
    envelope: {"error": "...", "details": {...optional...}}.
    """

    status_code = 400

    def __init__(self, message, status_code=None, payload=None):
        super().__init__(message)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        body = {"error": self.message}
        if self.payload:
            body["details"] = self.payload
        return body


class ValidationAPIError(ApiError):
    """Malformed or semantically invalid request data. HTTP 422."""

    status_code = 422


class UnauthorizedError(ApiError):
    """Missing, invalid, or expired credentials. HTTP 401."""

    status_code = 401


class ForbiddenError(ApiError):
    """Authenticated, but not allowed to perform this action. HTTP 403."""

    status_code = 403


class NotFoundError(ApiError):
    """The requested resource does not exist. HTTP 404."""

    status_code = 404


class ConflictError(ApiError):
    """The request conflicts with existing state (duplicates). HTTP 409."""

    status_code = 409


def register_error_handlers(app):
    """
    Attach handlers so every failure mode -- explicit ApiError subclasses,
    schema validation errors raised directly by a route, database
    integrity violations, and framework-level 404/405/500s -- returns the
    same JSON shape instead of Flask's default HTML error pages.
    """

    @app.errorhandler(ApiError)
    def handle_api_error(err):
        return jsonify(err.to_dict()), err.status_code

    @app.errorhandler(ValidationError)
    def handle_marshmallow_error(err):
        # Covers schema.load() calls made directly in a route without an
        # intermediate try/except -- normalized to the same envelope as
        # ValidationAPIError.
        return jsonify({"error": "Validation failed.", "details": err.messages}), 422

    @app.errorhandler(IntegrityError)
    def handle_integrity_error(err):
        # Last line of defense against races that slip past service-level
        # pre-checks (e.g. two requests registering the same username at
        # the same instant). The session MUST be rolled back here, or
        # every subsequent query in this request/thread would raise
        # "PendingRollbackError" instead of the real problem.
        db.session.rollback()
        return (
            jsonify({"error": "A record with conflicting unique data already exists."}),
            409,
        )

    @app.errorhandler(404)
    def handle_404(err):
        return jsonify({"error": "The requested resource was not found."}), 404

    @app.errorhandler(405)
    def handle_405(err):
        return jsonify({"error": "Method not allowed on this endpoint."}), 405

    @app.errorhandler(500)
    def handle_500(err):
        db.session.rollback()
        return jsonify({"error": "An unexpected server error occurred."}), 500
