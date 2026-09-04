# tests/integration/test_report_routes.py


def _create_post(client, headers, title="T"):
    response = client.post("/api/posts", headers=headers, json={"title": title, "content": "c"})
    return response.get_json()["id"]


class TestCreateReport:
    def test_requires_auth(self, client, amina):
        post_id = _create_post(client, amina["headers"])
        response = client.post(f"/api/posts/{post_id}/report", json={"reason": "spam"})
        assert response.status_code == 401

    def test_files_a_report(self, client, amina, brian):
        post_id = _create_post(client, amina["headers"])
        response = client.post(
            f"/api/posts/{post_id}/report", headers=brian["headers"], json={"reason": "spam"}
        )
        assert response.status_code == 201
        body = response.get_json()
        assert body["reason"] == "spam"
        assert body["status"] == "pending"
        assert body["post_id"] == post_id
        assert body["reporter"]["username"] == "brian"

    def test_accepts_optional_details(self, client, amina, brian):
        post_id = _create_post(client, amina["headers"])
        response = client.post(
            f"/api/posts/{post_id}/report",
            headers=brian["headers"],
            json={"reason": "misleading", "details": "This claims a fake cure."},
        )
        assert response.get_json()["details"] == "This claims a fake cure."

    def test_rejects_an_invalid_reason(self, client, amina, brian):
        post_id = _create_post(client, amina["headers"])
        response = client.post(
            f"/api/posts/{post_id}/report", headers=brian["headers"], json={"reason": "not_a_real_reason"}
        )
        assert response.status_code == 422

    def test_requires_a_reason(self, client, amina, brian):
        post_id = _create_post(client, amina["headers"])
        response = client.post(f"/api/posts/{post_id}/report", headers=brian["headers"], json={})
        assert response.status_code == 422

    def test_cannot_report_the_same_post_twice(self, client, amina, brian):
        post_id = _create_post(client, amina["headers"])
        client.post(f"/api/posts/{post_id}/report", headers=brian["headers"], json={"reason": "spam"})
        response = client.post(
            f"/api/posts/{post_id}/report", headers=brian["headers"], json={"reason": "scam"}
        )
        assert response.status_code == 409

    def test_reporting_a_nonexistent_post_returns_404(self, client, amina):
        response = client.post("/api/posts/999999/report", headers=amina["headers"], json={"reason": "spam"})
        assert response.status_code == 404


class TestListReportsRequiresAdmin:
    def test_no_auth_returns_401(self, client):
        response = client.get("/api/admin/reports")
        assert response.status_code == 401

    def test_normal_user_returns_403(self, client, amina):
        response = client.get("/api/admin/reports", headers=amina["headers"])
        assert response.status_code == 403

    def test_admin_returns_200_with_pagination_metadata(self, client, admin_user, amina, brian):
        post_id = _create_post(client, amina["headers"])
        client.post(f"/api/posts/{post_id}/report", headers=brian["headers"], json={"reason": "spam"})

        response = client.get("/api/admin/reports", headers=admin_user["headers"])
        assert response.status_code == 200
        body = response.get_json()
        assert body["total"] == 1
        assert "page" in body and "per_page" in body
        assert body["items"][0]["reason"] == "spam"


class TestListReportsFiltering:
    def test_filters_by_status(self, client, admin_user, amina, brian):
        post1 = _create_post(client, amina["headers"], title="One")
        post2 = _create_post(client, amina["headers"], title="Two")
        client.post(f"/api/posts/{post1}/report", headers=brian["headers"], json={"reason": "spam"})
        r2 = client.post(
            f"/api/posts/{post2}/report", headers=brian["headers"], json={"reason": "scam"}
        ).get_json()
        client.patch(f"/api/admin/reports/{r2['id']}", headers=admin_user["headers"], json={"status": "reviewed"})

        response = client.get("/api/admin/reports?status=pending", headers=admin_user["headers"])
        body = response.get_json()
        assert body["total"] == 1
        assert body["items"][0]["reason"] == "spam"


class TestReviewReport:
    def test_normal_user_cannot_review(self, client, amina, brian):
        post_id = _create_post(client, amina["headers"])
        report_id = client.post(
            f"/api/posts/{post_id}/report", headers=brian["headers"], json={"reason": "spam"}
        ).get_json()["id"]

        response = client.patch(
            f"/api/admin/reports/{report_id}", headers=amina["headers"], json={"status": "reviewed"}
        )
        assert response.status_code == 403

    def test_admin_can_mark_reviewed(self, client, admin_user, amina, brian):
        post_id = _create_post(client, amina["headers"])
        report_id = client.post(
            f"/api/posts/{post_id}/report", headers=brian["headers"], json={"reason": "spam"}
        ).get_json()["id"]

        response = client.patch(
            f"/api/admin/reports/{report_id}", headers=admin_user["headers"], json={"status": "reviewed"}
        )
        assert response.status_code == 200
        body = response.get_json()
        assert body["status"] == "reviewed"
        assert body["reviewed_at"] is not None

    def test_admin_can_mark_dismissed(self, client, admin_user, amina, brian):
        post_id = _create_post(client, amina["headers"])
        report_id = client.post(
            f"/api/posts/{post_id}/report", headers=brian["headers"], json={"reason": "spam"}
        ).get_json()["id"]

        response = client.patch(
            f"/api/admin/reports/{report_id}", headers=admin_user["headers"], json={"status": "dismissed"}
        )
        assert response.get_json()["status"] == "dismissed"

    def test_invalid_status_returns_422(self, client, admin_user, amina, brian):
        post_id = _create_post(client, amina["headers"])
        report_id = client.post(
            f"/api/posts/{post_id}/report", headers=brian["headers"], json={"reason": "spam"}
        ).get_json()["id"]

        response = client.patch(
            f"/api/admin/reports/{report_id}", headers=admin_user["headers"], json={"status": "pending"}
        )
        assert response.status_code == 422

    def test_missing_status_returns_422(self, client, admin_user, amina, brian):
        post_id = _create_post(client, amina["headers"])
        report_id = client.post(
            f"/api/posts/{post_id}/report", headers=brian["headers"], json={"reason": "spam"}
        ).get_json()["id"]

        response = client.patch(f"/api/admin/reports/{report_id}", headers=admin_user["headers"], json={})
        assert response.status_code == 422

    def test_unknown_report_returns_404(self, client, admin_user):
        response = client.patch(
            "/api/admin/reports/999999", headers=admin_user["headers"], json={"status": "reviewed"}
        )
        assert response.status_code == 404


class TestAdminStatsIncludesReports:
    def test_reports_counts_reflect_real_data(self, client, admin_user, amina, brian):
        post_id = _create_post(client, amina["headers"])
        client.post(f"/api/posts/{post_id}/report", headers=brian["headers"], json={"reason": "spam"})

        response = client.get("/api/admin/stats", headers=admin_user["headers"])
        reports = response.get_json()["reports"]
        assert reports["total"] == 1
        assert reports["pending"] == 1
