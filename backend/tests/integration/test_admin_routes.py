# tests/integration/test_admin_routes.py
#
# The most important tests in this file are the 401/403 ones -- proving a
# normal user token cannot reach admin data or actions no matter how the
# request is made, since that's the actual security boundary (the
# frontend hiding admin UI is a nicety, not a control).


class TestStatsRequiresAdmin:
    def test_no_auth_returns_401(self, client):
        response = client.get("/api/admin/stats")
        assert response.status_code == 401

    def test_normal_user_returns_403(self, client, amina):
        response = client.get("/api/admin/stats", headers=amina["headers"])
        assert response.status_code == 403

    def test_admin_returns_200(self, client, admin_user):
        response = client.get("/api/admin/stats", headers=admin_user["headers"])
        assert response.status_code == 200


class TestStatsContent:
    def test_counts_reflect_real_data(self, client, admin_user, amina, brian):
        client.post("/api/posts", headers=amina["headers"], json={"title": "T", "content": "C"})
        client.post("/api/posts", headers=brian["headers"], json={"title": "T2", "content": "C2"})
        client.post(
            "/api/communities", headers=amina["headers"], json={"name": "Farmers United", "description": "d"}
        )

        response = client.get("/api/admin/stats", headers=admin_user["headers"])
        body = response.get_json()

        # amina, brian, admin_user = 3 users total.
        assert body["users"]["total"] == 3
        assert body["users"]["active"] == 3
        assert body["posts"]["total"] == 2
        assert body["communities"]["total"] == 1

    def test_active_and_inactive_split_correctly(self, client, admin_user, amina, brian):
        from app.extensions import db
        from app.models import User

        user = db.session.get(User, brian["user"]["id"])
        user.is_active = False
        db.session.commit()

        response = client.get("/api/admin/stats", headers=admin_user["headers"])
        body = response.get_json()
        assert body["users"]["active"] == 2  # amina + admin_user
        assert body["users"]["inactive"] == 1  # brian

    def test_recent_users_and_posts_are_included(self, client, admin_user, amina):
        client.post("/api/posts", headers=amina["headers"], json={"title": "Recent", "content": "C"})
        response = client.get("/api/admin/stats", headers=admin_user["headers"])
        body = response.get_json()
        assert any(u["username"] == "amina" for u in body["recent_users"])
        assert any(p["title"] == "Recent" for p in body["recent_posts"])

    def test_ai_status_is_reported(self, client, admin_user):
        response = client.get("/api/admin/stats", headers=admin_user["headers"])
        ai = response.get_json()["ai"]
        assert "provider" in ai
        assert "configured" in ai


class TestListUsersRequiresAdmin:
    def test_no_auth_returns_401(self, client):
        response = client.get("/api/admin/users")
        assert response.status_code == 401

    def test_normal_user_returns_403(self, client, amina):
        response = client.get("/api/admin/users", headers=amina["headers"])
        assert response.status_code == 403

    def test_admin_returns_200_with_pagination_metadata(self, client, admin_user, amina, brian):
        response = client.get("/api/admin/users", headers=admin_user["headers"])
        assert response.status_code == 200
        body = response.get_json()
        assert body["total"] == 3  # amina, brian, admin_user
        assert "page" in body and "per_page" in body
        assert len(body["items"]) == 3

    def test_admin_listing_exposes_email_and_status(self, client, admin_user, amina):
        # Unlike the public user directory, admin needs email/status --
        # this is the HTTP-level proof the admin route uses the full
        # UserSchema, not UserPublicSchema.
        response = client.get("/api/admin/users", headers=admin_user["headers"])
        item = next(u for u in response.get_json()["items"] if u["username"] == "amina")
        assert item["email"] == "amina@example.com"
        assert "is_active" in item

    def test_search_matches_username(self, client, admin_user, amina, brian):
        response = client.get("/api/admin/users?search=ami", headers=admin_user["headers"])
        usernames = {u["username"] for u in response.get_json()["items"]}
        assert usernames == {"amina"}

    def test_filters_by_role(self, client, admin_user, register_user):
        register_user(username="expertx", role="expert")
        response = client.get("/api/admin/users?role=expert", headers=admin_user["headers"])
        usernames = {u["username"] for u in response.get_json()["items"]}
        assert "expertx" in usernames

    def test_filters_by_status(self, client, admin_user, amina):
        from app.extensions import db
        from app.models import User

        user = db.session.get(User, amina["user"]["id"])
        user.is_active = False
        db.session.commit()

        response = client.get("/api/admin/users?status=inactive", headers=admin_user["headers"])
        usernames = {u["username"] for u in response.get_json()["items"]}
        assert usernames == {"amina"}


class TestGetSingleUser:
    def test_admin_can_view_any_user(self, client, admin_user, amina):
        response = client.get(f"/api/admin/users/{amina['user']['id']}", headers=admin_user["headers"])
        assert response.status_code == 200
        assert response.get_json()["username"] == "amina"

    def test_normal_user_returns_403(self, client, amina, brian):
        response = client.get(f"/api/admin/users/{brian['user']['id']}", headers=amina["headers"])
        assert response.status_code == 403

    def test_unknown_user_returns_404(self, client, admin_user):
        response = client.get("/api/admin/users/999999", headers=admin_user["headers"])
        assert response.status_code == 404


class TestUpdateUser:
    def test_normal_user_cannot_deactivate_anyone(self, client, amina, brian):
        response = client.patch(
            f"/api/admin/users/{brian['user']['id']}", headers=amina["headers"], json={"is_active": False}
        )
        assert response.status_code == 403

    def test_normal_user_cannot_promote_self_to_admin(self, client, amina):
        # Belt-and-suspenders: even hitting the admin endpoint directly
        # (bypassing any frontend) with their own id, a normal user is
        # blocked purely by not having the admin role in the first place.
        response = client.patch(
            f"/api/admin/users/{amina['user']['id']}", headers=amina["headers"], json={"role": "admin"}
        )
        assert response.status_code == 403

    def test_admin_can_deactivate_a_user(self, client, admin_user, amina):
        response = client.patch(
            f"/api/admin/users/{amina['user']['id']}", headers=admin_user["headers"], json={"is_active": False}
        )
        assert response.status_code == 200
        assert response.get_json()["is_active"] is False

        login_response = client.post(
            "/api/auth/login", json={"username": "amina", "password": "TestPassword123!"}
        )
        assert login_response.status_code == 401

    def test_admin_can_reactivate_a_user(self, client, admin_user, amina):
        client.patch(f"/api/admin/users/{amina['user']['id']}", headers=admin_user["headers"], json={"is_active": False})
        response = client.patch(
            f"/api/admin/users/{amina['user']['id']}", headers=admin_user["headers"], json={"is_active": True}
        )
        assert response.status_code == 200
        assert response.get_json()["is_active"] is True

    def test_admin_can_change_another_users_role(self, client, admin_user, amina):
        response = client.patch(
            f"/api/admin/users/{amina['user']['id']}", headers=admin_user["headers"], json={"role": "expert"}
        )
        assert response.status_code == 200
        assert response.get_json()["role"] == "expert"

    def test_admin_cannot_modify_their_own_account_via_this_endpoint(self, client, admin_user):
        response = client.patch(
            f"/api/admin/users/{admin_user['user'].id}", headers=admin_user["headers"], json={"is_active": False}
        )
        assert response.status_code == 403

    def test_invalid_role_returns_422(self, client, admin_user, amina):
        response = client.patch(
            f"/api/admin/users/{amina['user']['id']}", headers=admin_user["headers"], json={"role": "superuser"}
        )
        assert response.status_code == 422

    def test_empty_body_returns_422(self, client, admin_user, amina):
        response = client.patch(f"/api/admin/users/{amina['user']['id']}", headers=admin_user["headers"], json={})
        assert response.status_code == 422

    def test_unknown_user_returns_404(self, client, admin_user):
        response = client.patch("/api/admin/users/999999", headers=admin_user["headers"], json={"is_active": False})
        assert response.status_code == 404
