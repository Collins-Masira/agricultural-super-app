# tests/integration/test_community_routes.py

class TestListAndCreateCommunities:
    def test_list_does_not_require_auth(self, client):
        response = client.get("/api/communities")
        assert response.status_code == 200
        assert response.get_json() == []

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
