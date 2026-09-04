# app/models/report.py

from datetime import datetime
from app.extensions import db

REPORT_REASONS = ("spam", "harassment", "scam", "misleading", "inappropriate", "other")
REPORT_STATUSES = ("pending", "reviewed", "dismissed")


class Report(db.Model):
    __tablename__ = "reports"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    reporter_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    post_id = db.Column(
        db.Integer,
        db.ForeignKey("posts.id", ondelete="CASCADE"),
        nullable=False
    )

    reason = db.Column(
        db.String(20),
        nullable=False
    )

    details = db.Column(
        db.Text,
        nullable=True
    )

    status = db.Column(
        db.String(20),
        nullable=False,
        default="pending",
        server_default="pending"
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    reviewed_at = db.Column(
        db.DateTime,
        nullable=True
    )

    reviewed_by_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )

    reporter = db.relationship(
        "User",
        foreign_keys=[reporter_id],
        back_populates="reports_filed"
    )

    post = db.relationship(
        "Post",
        back_populates="reports"
    )

    reviewed_by = db.relationship(
        "User",
        foreign_keys=[reviewed_by_id],
    )

    __table_args__ = (
        db.UniqueConstraint(
            "reporter_id",
            "post_id",
            name="unique_reporter_post_report"
        ),
        db.CheckConstraint(
            f"reason IN {REPORT_REASONS}",
            name="ck_reports_reason"
        ),
        db.CheckConstraint(
            f"status IN {REPORT_STATUSES}",
            name="ck_reports_status"
        ),
    )
