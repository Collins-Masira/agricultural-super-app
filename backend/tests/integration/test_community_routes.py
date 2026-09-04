class TestListAndCreateCommunities:
    def test_list_does_not_require_auth(self, client):
        response = client.get("/api/communities")
        assert response.status_code == 200
        assert response.get_json() == []

    def test_list_with_existing_communities_does_not_error_for_anonymous_viewer(self, client, amina):
        client.post("/api/communities", headers=amina["headers"], json={"name": "Maize Farmers"})

        response = client.get("/api/communities")
        assert response.status_code == 200
        body = response.get_json()
        assert len(body) == 1
        assert body[0]["my_role"] is None

    def test_list_reflects_the_authenticated_viewers_role(self, client, amina, brian):
        community_id = client.post(
            "/api/communities", headers=amina["headers"], json={"name": "Maize Farmers"}
        ).get_json()["id"]
        client.post(f"/api/communities/{community_id}/members", headers=brian["headers"])

        creator_view = client.get("/api/communities", headers=amina["headers"]).get_json()
        member_view = client.get("/api/communities", headers=brian["headers"]).get_json()

        assert creator_view[0]["my_role"] == "admin"
        assert member_view[0]["my_role"] == "member"

    def test_create_requires_auth(self, client):
        response = client.post("/api/communities", json={"name": "Maize Farmers"})
        assert response.status_code == 401

    def test_create_success_auto_joins_creator(self, client, amina):
        response = client.post(
            "/api/communities", headers=amina["headers"], json={"name": "Maize Farmers KE", "description": "For growers"}
        )
        assert response.status_code == 201
        body = response.get_json()
        assert body["creator"]["username"] == "amina"
        member_usernames = {m["member"]["username"] for m in body["members"]}
        assert "amina" in member_usernames

    def test_missing_name_returns_422(self, client, amina):
        response = client.post("/api/communities", headers=amina["headers"], json={})
        assert response.status_code == 422

    def test_duplicate_name_returns_409(self, client, amina, brian):
        client.post("/api/communities", headers=amina["headers"], json={"name": "Maize Farmers"})
        response = client.post("/api/communities", headers=brian["headers"], json={"name": "Maize Farmers"})
        assert response.status_code == 409


class TestGetUpdateDeleteCommunity:
    def _create_community(self, client, headers, name="Maize Farmers"):
        response = client.post("/api/communities", headers=headers, json={"name": name})
        return response.get_json()["id"]

    def test_get_unknown_returns_404(self, client):
        response = client.get("/api/communities/999999")
        assert response.status_code == 404

    def test_creator_can_update(self, client, amina):
        community_id = self._create_community(client, amina["headers"])
        response = client.put(
            f"/api/communities/{community_id}", headers=amina["headers"], json={"description": "Updated"}
        )
        assert response.status_code == 200
        assert response.get_json()["description"] == "Updated"

    def test_non_creator_update_returns_403(self, client, amina, brian):
        community_id = self._create_community(client, amina["headers"])
        response = client.put(
            f"/api/communities/{community_id}", headers=brian["headers"], json={"description": "Hijacked"}
        )
        assert response.status_code == 403

    def test_creator_can_delete(self, client, amina):
        community_id = self._create_community(client, amina["headers"])
        response = client.delete(f"/api/communities/{community_id}", headers=amina["headers"])
        assert response.status_code == 204
        assert client.get(f"/api/communities/{community_id}").status_code == 404

    def test_non_creator_delete_returns_403(self, client, amina, brian):
        community_id = self._create_community(client, amina["headers"])
        response = client.delete(f"/api/communities/{community_id}", headers=brian["headers"])
        assert response.status_code == 403


class TestMembership:
    def _create_community(self, client, headers, name="Maize Farmers"):
        response = client.post("/api/communities", headers=headers, json={"name": name})
        return response.get_json()["id"]

    def test_join_and_view_membership(self, client, amina, brian):
        community_id = self._create_community(client, amina["headers"])
        response = client.post(f"/api/communities/{community_id}/members", headers=brian["headers"])
        assert response.status_code == 201

        detail = client.get(f"/api/communities/{community_id}").get_json()
        member_usernames = {m["member"]["username"] for m in detail["members"]}
        assert member_usernames == {"amina", "brian"}

    def test_joining_twice_returns_409(self, client, amina, brian):
        community_id = self._create_community(client, amina["headers"])
        client.post(f"/api/communities/{community_id}/members", headers=brian["headers"])

        response = client.post(f"/api/communities/{community_id}/members", headers=brian["headers"])
        assert response.status_code == 409

    def test_creator_leaving_own_community_returns_403(self, client, amina):
        community_id = self._create_community(client, amina["headers"])
        response = client.delete(f"/api/communities/{community_id}/members", headers=amina["headers"])
        assert response.status_code == 403

    def test_member_can_leave(self, client, amina, brian):
        community_id = self._create_community(client, amina["headers"])
        client.post(f"/api/communities/{community_id}/members", headers=brian["headers"])

        response = client.delete(f"/api/communities/{community_id}/members", headers=brian["headers"])
        assert response.status_code == 204


class TestCommunitySettings:
    def _create_community(self, client, headers, name="Maize Farmers"):
        response = client.post("/api/communities", headers=headers, json={"name": name})
        return response.get_json()["id"]

    def test_admin_can_change_posting_permission(self, client, amina):
        community_id = self._create_community(client, amina["headers"])
        response = client.put(
            f"/api/communities/{community_id}",
            headers=amina["headers"],
            json={"posting_permission": "experts_only"},
        )
        assert response.status_code == 200
        assert response.get_json()["posting_permission"] == "experts_only"

    def test_admin_can_close_and_reopen_comments(self, client, amina):
        community_id = self._create_community(client, amina["headers"])

        closed = client.put(
            f"/api/communities/{community_id}", headers=amina["headers"], json={"comments_enabled": False}
        )
        assert closed.get_json()["comments_enabled"] is False

        reopened = client.put(
            f"/api/communities/{community_id}", headers=amina["headers"], json={"comments_enabled": True}
        )
        assert reopened.get_json()["comments_enabled"] is True

    def test_non_admin_cannot_change_settings(self, client, amina, brian):
        community_id = self._create_community(client, amina["headers"])
        client.post(f"/api/communities/{community_id}/members", headers=brian["headers"])

        response = client.put(
            f"/api/communities/{community_id}",
            headers=brian["headers"],
            json={"posting_permission": "admins_only"},
        )
        assert response.status_code == 403

    def test_invalid_permission_value_returns_422(self, client, amina):
        community_id = self._create_community(client, amina["headers"])
        response = client.put(
            f"/api/communities/{community_id}",
            headers=amina["headers"],
            json={"posting_permission": "nobody"},
        )
        assert response.status_code == 422

    def test_my_role_reflects_membership(self, client, amina, brian, register_user):
        eve = register_user(username="eve")
        community_id = self._create_community(client, amina["headers"])
        client.post(f"/api/communities/{community_id}/members", headers=brian["headers"])

        admin_view = client.get(f"/api/communities/{community_id}", headers=amina["headers"]).get_json()
        member_view = client.get(f"/api/communities/{community_id}", headers=brian["headers"]).get_json()
        stranger_view = client.get(f"/api/communities/{community_id}", headers=eve["headers"]).get_json()

        assert admin_view["my_role"] == "admin"
        assert member_view["my_role"] == "member"
        assert stranger_view["my_role"] is None


class TestMemberManagement:
    def _create_community(self, client, headers, name="Maize Farmers"):
        response = client.post("/api/communities", headers=headers, json={"name": name})
        return response.get_json()["id"]

    def test_admin_can_promote_a_member(self, client, amina, brian):
        community_id = self._create_community(client, amina["headers"])
        client.post(f"/api/communities/{community_id}/members", headers=brian["headers"])

        response = client.patch(
            f"/api/communities/{community_id}/members/{brian['user']['id']}",
            headers=amina["headers"],
            json={"role": "admin"},
        )
        assert response.status_code == 200

    def test_non_admin_cannot_promote_members(self, client, amina, brian, register_user):
        eve = register_user(username="eve")
        community_id = self._create_community(client, amina["headers"])
        client.post(f"/api/communities/{community_id}/members", headers=brian["headers"])
        client.post(f"/api/communities/{community_id}/members", headers=eve["headers"])

        response = client.patch(
            f"/api/communities/{community_id}/members/{eve['user']['id']}",
            headers=brian["headers"],
            json={"role": "admin"},
        )
        assert response.status_code == 403

    def test_admin_can_remove_a_member(self, client, amina, brian):
        community_id = self._create_community(client, amina["headers"])
        client.post(f"/api/communities/{community_id}/members", headers=brian["headers"])

        response = client.delete(
            f"/api/communities/{community_id}/members/{brian['user']['id']}", headers=amina["headers"]
        )
        assert response.status_code == 204

    def test_non_admin_cannot_remove_a_member(self, client, amina, brian, register_user):
        eve = register_user(username="eve")
        community_id = self._create_community(client, amina["headers"])
        client.post(f"/api/communities/{community_id}/members", headers=brian["headers"])
        client.post(f"/api/communities/{community_id}/members", headers=eve["headers"])

        response = client.delete(
            f"/api/communities/{community_id}/members/{eve['user']['id']}", headers=brian["headers"]
        )
        assert response.status_code == 403

    def test_creator_cannot_be_removed(self, client, amina):
        community_id = self._create_community(client, amina["headers"])
        response = client.delete(
            f"/api/communities/{community_id}/members/{amina['user']['id']}", headers=amina["headers"]
        )
        assert response.status_code == 403
