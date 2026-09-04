# app/services/report_service.py

from app.extensions import utcnow

from app.errors import ConflictError, NotFoundError, ValidationAPIError
from app.extensions import db
from app.models import Report
from app.services import post_service

MAX_PAGE_SIZE = 100


def create_report(current_user, post_id, reason, details=None):
    post_service.get_post_or_404(post_id)

    existing = (
        db.session.query(Report)
        .filter_by(reporter_id=current_user.id, post_id=post_id)
        .first()
    )
    if existing:
        raise ConflictError("You have already reported this post.")

    report = Report(
        reporter_id=current_user.id,
        post_id=post_id,
        reason=reason,
        details=details,
    )
    db.session.add(report)
    db.session.commit()
    return report


def list_reports(status=None, page=1, per_page=20):
    """
    Admin moderation queue. Unlike create_report (scoped to the current
    user), this has no owner filter -- only admin_required routes may
    call it.
    """
    per_page = min(per_page, MAX_PAGE_SIZE)
    query = db.session.query(Report)
    if status:
        query = query.filter(Report.status == status)

    total = query.count()
    items = (
        query.order_by(Report.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    return {"items": items, "page": page, "per_page": per_page, "total": total}


def _get_report_or_404(report_id):
    report = db.session.get(Report, report_id)
    if report is None:
        raise NotFoundError(f"Report {report_id} not found.")
    return report


def review_report(admin, report_id, status):
    if status not in ("reviewed", "dismissed"):
        raise ValidationAPIError("status must be one of: reviewed, dismissed.")

    report = _get_report_or_404(report_id)
    report.status = status
    report.reviewed_at = utcnow()
    report.reviewed_by_id = admin.id
    db.session.commit()
    return report
