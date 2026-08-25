# tests/integration/test_user_routes.py

class TestGetUser:
    def test_returns_public_profile(self, client, amina):
        response = client.get(f"/api/users/{amina['user']['id']}")
        assert response.status_code == 200
        assert response.get_json()["username"] == "amina"

    def test_does_not_expose_email(self, client, amina):
        # UserPublicSchema deliberately excludes email -- this is the
        # HTTP-level proof that the public route actually uses that
        # schema and not the full UserSchema.
        response = client.get(f"/api/users/{amina['user']['id']}")
        assert "email" not in response.get_json()

    def test_unknown_user_returns_404(self, client):
        response = client.get("/api/users/999999")
        assert response.status_code == 404


class TestUpdateProfile:
    def test_requires_auth(self, client):
        response = client.put("/api/users/me/profile", json={"first_name": "X"})
        assert response.status_code == 401

    def test_creates_profile_on_first_call(self, client, amina):
        response = client.put(
            "/api/users/me/profile", headers=amina["headers"], json={"first_name": "Amina", "bio": "Maize farmer"}
        )
        assert response.status_code == 200
        assert response.get_json()["first_name"] == "Amina"

    def test_updates_profile_on_second_call(self, client, amina):
        client.put("/api/users/me/profile", headers=amina["headers"], json={"first_name": "First"})
        response = client.put("/api/users/me/profile", headers=amina["headers"], json={"first_name": "Second"})
        assert response.get_json()["first_name"] == "Second"


class TestFollow:
    def test_follow_and_unfollow(self, client, amina, brian):
        follow_response = client.post(f"/api/users/{brian['user']['id']}/follow", headers=amina["headers"])
        assert follow_response.status_code == 201

        unfollow_response = client.delete(f"/api/users/{brian['user']['id']}/follow", headers=amina["headers"])
        assert unfollow_response.status_code == 204

    def test_follow_requires_auth(self, client, brian):
        response = client.post(f"/api/users/{brian['user']['id']}/follow")
        assert response.status_code == 401

    def test_following_twice_returns_409(self, client, amina, brian):
        client.post(f"/api/users/{brian['user']['id']}/follow", headers=amina["headers"])
        response = client.post(f"/api/users/{brian['user']['id']}/follow", headers=amina["headers"])
        assert response.status_code == 409

    def test_following_self_returns_422(self, client, amina):
        response = client.post(f"/api/users/{amina['user']['id']}/follow", headers=amina["headers"])
        assert response.status_code == 422

    def test_unfollowing_without_following_returns_404(self, client, amina, brian):
        response = client.delete(f"/api/users/{brian['user']['id']}/follow", headers=amina["headers"])
        assert response.status_code == 404
