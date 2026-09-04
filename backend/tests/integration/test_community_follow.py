# tests/integration/test_community_follow.py


class TestFollowCommunity:
    def _create_community(self, client, headers, name="Maize Farmers"):
        response = client.post("/api/communities", headers=headers, json={"name": name})
        return response.get_json()["id"]

    def test_follow_requires_auth(self, client, amina):
        community_id = self._create_community(client, amina["headers"])
        response = client.post(f"/api/communities/{community_id}/follow")
        assert response.status_code == 401

    def test_follow_success(self, client, amina, brian):
        community_id = self._create_community(client, amina["headers"])
        response = client.post(f"/api/communities/{community_id}/follow", headers=brian["headers"])
        assert response.status_code == 201
        assert response.get_json()["isFollowing"] is True

    def test_follow_nonexistent_community_returns_404(self, client, amina):
        response = client.post("/api/communities/999999/follow", headers=amina["headers"])
        assert response.status_code == 404

    def test_duplicate_follow_returns_409(self, client, amina, brian):
        community_id = self._create_community(client, amina["headers"])
        client.post(f"/api/communities/{community_id}/follow", headers=brian["headers"])
        response = client.post(f"/api/communities/{community_id}/follow", headers=brian["headers"])
        assert response.status_code == 409


class TestUnfollowCommunity:
    def _create_community(self, client, headers, name="Maize Farmers"):
        response = client.post("/api/communities", headers=headers, json={"name": name})
        return response.get_json()["id"]

    def test_unfollow_requires_auth(self, client, amina):
        community_id = self._create_community(client, amina["headers"])
        response = client.delete(f"/api/communities/{community_id}/follow")
        assert response.status_code == 401

    def test_unfollow_success(self, client, amina, brian):
        community_id = self._create_community(client, amina["headers"])
        client.post(f"/api/communities/{community_id}/follow", headers=brian["headers"])

        response = client.delete(f"/api/communities/{community_id}/follow", headers=brian["headers"])
        assert response.status_code == 200
        assert response.get_json()["isFollowing"] is False

    def test_unfollow_nonexistent_community_returns_404(self, client, amina):
        response = client.delete("/api/communities/999999/follow", headers=amina["headers"])
        assert response.status_code == 404

    def test_unfollow_when_not_following_returns_404(self, client, amina, brian):
        community_id = self._create_community(client, amina["headers"])
        response = client.delete(f"/api/communities/{community_id}/follow", headers=brian["headers"])
        assert response.status_code == 404


class TestFollowIndependence:
    """Following and membership are independent operations."""

    def _create_community(self, client, headers, name="Maize Farmers"):
        response = client.post("/api/communities", headers=headers, json={"name": name})
        return response.get_json()["id"]

    def test_following_does_not_create_membership(self, client, amina, brian):
        community_id = self._create_community(client, amina["headers"])
        client.post(f"/api/communities/{community_id}/follow", headers=brian["headers"])

        detail = client.get(f"/api/communities/{community_id}").get_json()
        member_usernames = {m["member"]["username"] for m in detail["members"]}
        assert "brian" not in member_usernames

    def test_membership_does_not_create_follow(self, client, amina, brian):
        community_id = self._create_community(client, amina["headers"])
        client.post(f"/api/communities/{community_id}/members", headers=brian["headers"])

        # Unfollowing should fail because brian was never following
        response = client.delete(f"/api/communities/{community_id}/follow", headers=brian["headers"])
        assert response.status_code == 404
