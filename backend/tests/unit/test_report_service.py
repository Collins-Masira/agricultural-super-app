# tests/unit/test_report_service.py

import pytest

from app.errors import ConflictError, NotFoundError, ValidationAPIError
from app.services import post_service, report_service


def _make_post(author):
    return post_service.create_post(author, {"title": "T", "content": "C"})


class TestCreateReport:
    def test_creates_a_pending_report(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        post = _make_post(brian)

        report = report_service.create_report(amina, post.id, reason="spam")

        assert report.reporter_id == amina.id
        assert report.post_id == post.id
        assert report.reason == "spam"
        assert report.status == "pending"

    def test_stores_optional_details(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        post = _make_post(brian)

        report = report_service.create_report(amina, post.id, reason="other", details="Looks like spam to me.")

        assert report.details == "Looks like spam to me."

    def test_cannot_report_the_same_post_twice(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        post = _make_post(brian)
        report_service.create_report(amina, post.id, reason="spam")

        with pytest.raises(ConflictError):
            report_service.create_report(amina, post.id, reason="scam")

    def test_reporting_nonexistent_post_raises_not_found(self, create_user):
        amina = create_user(username="amina")
        with pytest.raises(NotFoundError):
            report_service.create_report(amina, 999999, reason="spam")


class TestListReports:
    def test_lists_newest_first(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        post1 = _make_post(brian)
        post2 = _make_post(brian)
        first = report_service.create_report(amina, post1.id, reason="spam")
        second = report_service.create_report(amina, post2.id, reason="scam")

        result = report_service.list_reports()

        assert [r.id for r in result["items"]] == [second.id, first.id]
        assert result["total"] == 2

    def test_filters_by_status(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        post1 = _make_post(brian)
        post2 = _make_post(brian)
        pending = report_service.create_report(amina, post1.id, reason="spam")
        reviewed = report_service.create_report(amina, post2.id, reason="scam")
        report_service.review_report(brian, reviewed.id, "reviewed")

        result = report_service.list_reports(status="pending")

        assert [r.id for r in result["items"]] == [pending.id]


class TestReviewReport:
    def test_marks_a_report_reviewed(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        admin = create_user(username="admin1", role="admin")
        post = _make_post(brian)
        report = report_service.create_report(amina, post.id, reason="spam")

        updated = report_service.review_report(admin, report.id, "reviewed")

        assert updated.status == "reviewed"
        assert updated.reviewed_by_id == admin.id
        assert updated.reviewed_at is not None

    def test_marks_a_report_dismissed(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        admin = create_user(username="admin1", role="admin")
        post = _make_post(brian)
        report = report_service.create_report(amina, post.id, reason="spam")

        updated = report_service.review_report(admin, report.id, "dismissed")

        assert updated.status == "dismissed"

    def test_rejects_an_invalid_status(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        admin = create_user(username="admin1", role="admin")
        post = _make_post(brian)
        report = report_service.create_report(amina, post.id, reason="spam")

        with pytest.raises(ValidationAPIError):
            report_service.review_report(admin, report.id, "pending")

    def test_raises_not_found_for_missing_report(self, create_user):
        admin = create_user(username="admin1", role="admin")
        with pytest.raises(NotFoundError):
            report_service.review_report(admin, 999999, "reviewed")
