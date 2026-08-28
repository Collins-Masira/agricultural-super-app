# app/schemas/report_schema.py

from marshmallow import EXCLUDE, fields, validate

from app.extensions import ma
from app.models.report import REPORT_REASONS


class ReportSchema(ma.Schema):
    """
    Represents a Report filed against a Post. `reason` is the only
    client-supplied field on create; everything else (reporter, post,
    status, review metadata) is server-controlled.
    """

    class Meta:
        unknown = EXCLUDE

    id = fields.Integer(dump_only=True)
    post_id = fields.Integer(dump_only=True)
    status = fields.String(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    reviewed_at = fields.DateTime(dump_only=True, allow_none=True)

    reason = fields.String(
        required=True,
        validate=validate.OneOf(REPORT_REASONS),
    )

    details = fields.String(
        allow_none=True,
        load_default=None,
        validate=validate.Length(max=1000),
    )

    reporter = fields.Nested(
        "UserPublicSchema",
        dump_only=True,
    )

    post = fields.Nested(
        "PostSchema",
        dump_only=True,
        only=("id", "title", "author"),
    )
