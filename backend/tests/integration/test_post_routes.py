# tests/integration/test_post_routes.py

class TestListAndCreatePosts:
    def test_list_posts_does_not_require_auth(self, client):
        response = client.get("/api/posts")
        assert response.status_code == 200
        assert response.get_json() == []

    def test_create_post_requires_auth(self, client):
        response = client.post("/api/posts", json={"title": "T", "content": "C"})
        assert response.status_code == 401

    def test_create_post_success(self, client, amina):
        response = client.post(
            "/api/posts",
            headers=amina["headers"],
            json={
                "title": "Maize planting tips",
                "content": "Plant in rows 75cm apart.",
                "images": [{"image_url": "https://example.com/maize.jpg"}],
            },
        )
        assert response.status_code == 201
        body = response.get_json()
        assert body["author"]["username"] == "amina"
        assert body["images"][0]["image_url"].endswith("maize.jpg")

    def test_create_post_missing_content_returns_422(self, client, amina):
        response = client.post("/api/posts", headers=amina["headers"], json={"title": "T"})
        assert response.status_code == 422

    def test_list_reflects_created_posts_newest_first(self, client, amina):
        client.post("/api/posts", headers=amina["headers"], json={"title": "First", "content": "c"})
        client.post("/api/posts", headers=amina["headers"], json={"title": "Second", "content": "c"})

        response = client.get("/api/posts")
        titles = [p["title"] for p in response.get_json()]
        assert titles == ["Second", "First"]


class TestGetUpdateDeletePost:
    def _create_post(self, client, headers, title="Original"):
        response = client.post("/api/posts", headers=headers, json={"title": title, "content": "c"})
        return response.get_json()["id"]

    def test_get_post_returns_full_detail(self, client, amina):
        post_id = self._create_post(client, amina["headers"])
        response = client.get(f"/api/posts/{post_id}")
        assert response.status_code == 200
        assert response.get_json()["title"] == "Original"

    def test_get_unknown_post_returns_404(self, client):
        response = client.get("/api/posts/999999")
        assert response.status_code == 404

    def test_owner_can_update(self, client, amina):
        post_id = self._create_post(client, amina["headers"])
        response = client.put(f"/api/posts/{post_id}", headers=amina["headers"], json={"title": "Updated"})
        assert response.status_code == 200
        assert response.get_json()["title"] == "Updated"

    def test_non_owner_update_returns_403(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])
        response = client.put(f"/api/posts/{post_id}", headers=brian["headers"], json={"title": "Hijacked"})
        assert response.status_code == 403

    def test_update_without_auth_returns_401(self, client, amina):
        post_id = self._create_post(client, amina["headers"])
        response = client.put(f"/api/posts/{post_id}", json={"title": "No auth"})
        assert response.status_code == 401

    def test_owner_can_delete(self, client, amina):
        post_id = self._create_post(client, amina["headers"])
        response = client.delete(f"/api/posts/{post_id}", headers=amina["headers"])
        assert response.status_code == 204
        assert client.get(f"/api/posts/{post_id}").status_code == 404

    def test_non_owner_delete_returns_403(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])
        response = client.delete(f"/api/posts/{post_id}", headers=brian["headers"])
        assert response.status_code == 403


class TestPostImages:
    def _create_post(self, client, headers):
        response = client.post("/api/posts", headers=headers, json={"title": "T", "content": "c"})
        return response.get_json()["id"]

    def test_owner_can_add_image(self, client, amina):
        post_id = self._create_post(client, amina["headers"])
        response = client.post(
            f"/api/posts/{post_id}/images", headers=amina["headers"], json={"image_url": "https://x/new.jpg"}
        )
        assert response.status_code == 201

    def test_missing_image_url_returns_422(self, client, amina):
        post_id = self._create_post(client, amina["headers"])
        response = client.post(f"/api/posts/{post_id}/images", headers=amina["headers"], json={})
        assert response.status_code == 422

    def test_non_owner_cannot_add_image(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])
        response = client.post(
            f"/api/posts/{post_id}/images", headers=brian["headers"], json={"image_url": "https://x/hijack.jpg"}
        )
        assert response.status_code == 403

    def test_owner_can_delete_image(self, client, amina):
        post_id = self._create_post(client, amina["headers"])
        add_response = client.post(
            f"/api/posts/{post_id}/images", headers=amina["headers"], json={"image_url": "https://x/new.jpg"}
        )
        image_id = add_response.get_json()["id"]

        response = client.delete(f"/api/posts/{post_id}/images/{image_id}", headers=amina["headers"])
        assert response.status_code == 204


class TestComments:
    def _create_post(self, client, headers):
        response = client.post("/api/posts", headers=headers, json={"title": "T", "content": "c"})
        return response.get_json()["id"]

    def test_add_comment_requires_auth(self, client, amina):
        post_id = self._create_post(client, amina["headers"])
        response = client.post(f"/api/posts/{post_id}/comments", json={"content": "Nice!"})
        assert response.status_code == 401

    def test_add_and_list_comments(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])
        add_response = client.post(
            f"/api/posts/{post_id}/comments", headers=brian["headers"], json={"content": "Great tips!"}
        )
        assert add_response.status_code == 201
        assert add_response.get_json()["author"]["username"] == "brian"

        list_response = client.get(f"/api/posts/{post_id}/comments")
        assert list_response.status_code == 200
        assert len(list_response.get_json()) == 1

    def test_missing_content_returns_422(self, client, amina):
        post_id = self._create_post(client, amina["headers"])
        response = client.post(f"/api/posts/{post_id}/comments", headers=amina["headers"], json={})
        assert response.status_code == 422

    def test_owner_can_edit_own_comment(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])
        comment_id = client.post(
            f"/api/posts/{post_id}/comments", headers=brian["headers"], json={"content": "Original"}
        ).get_json()["id"]

        response = client.put(f"/api/comments/{comment_id}", headers=brian["headers"], json={"content": "Edited"})
        assert response.status_code == 200
        assert response.get_json()["content"] == "Edited"

    def test_non_owner_edit_returns_403(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])
        comment_id = client.post(
            f"/api/posts/{post_id}/comments", headers=brian["headers"], json={"content": "Original"}
        ).get_json()["id"]

        response = client.put(f"/api/comments/{comment_id}", headers=amina["headers"], json={"content": "Hijacked"})
        assert response.status_code == 403

    def test_owner_can_delete_own_comment(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])
        comment_id = client.post(
            f"/api/posts/{post_id}/comments", headers=brian["headers"], json={"content": "Original"}
        ).get_json()["id"]

        response = client.delete(f"/api/comments/{comment_id}", headers=brian["headers"])
        assert response.status_code == 204

    def test_updating_comment_with_missing_content_returns_422(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])
        comment_id = client.post(
            f"/api/posts/{post_id}/comments", headers=brian["headers"], json={"content": "Original"}
        ).get_json()["id"]

        response = client.put(f"/api/comments/{comment_id}", headers=brian["headers"], json={})
        assert response.status_code == 422

    def test_updating_unknown_comment_returns_404(self, client, amina):
        response = client.put("/api/comments/999999", headers=amina["headers"], json={"content": "x"})
        assert response.status_code == 404

    def test_deleting_unknown_comment_returns_404(self, client, amina):
        response = client.delete("/api/comments/999999", headers=amina["headers"])
        assert response.status_code == 404


class TestLikes:
    def _create_post(self, client, headers):
        response = client.post("/api/posts", headers=headers, json={"title": "T", "content": "c"})
        return response.get_json()["id"]

    def test_like_and_unlike(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])

        like_response = client.post(f"/api/posts/{post_id}/like", headers=brian["headers"])
        assert like_response.status_code == 201

        unlike_response = client.delete(f"/api/posts/{post_id}/like", headers=brian["headers"])
        assert unlike_response.status_code == 204

    def test_liking_twice_returns_409(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])
        client.post(f"/api/posts/{post_id}/like", headers=brian["headers"])

        response = client.post(f"/api/posts/{post_id}/like", headers=brian["headers"])
        assert response.status_code == 409

    def test_unliking_without_liking_returns_404(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])
        response = client.delete(f"/api/posts/{post_id}/like", headers=brian["headers"])
        assert response.status_code == 404

    def test_like_count_and_liked_by_me_on_get_post(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])

        before = client.get(f"/api/posts/{post_id}", headers=brian["headers"]).get_json()
        assert before["like_count"] == 0
        assert before["liked_by_me"] is False

        client.post(f"/api/posts/{post_id}/like", headers=brian["headers"])

        after_brian = client.get(f"/api/posts/{post_id}", headers=brian["headers"]).get_json()
        assert after_brian["like_count"] == 1
        assert after_brian["liked_by_me"] is True

        after_amina = client.get(f"/api/posts/{post_id}", headers=amina["headers"]).get_json()
        assert after_amina["like_count"] == 1
        assert after_amina["liked_by_me"] is False

        after_anonymous = client.get(f"/api/posts/{post_id}").get_json()
        assert after_anonymous["like_count"] == 1
        assert after_anonymous["liked_by_me"] is False

    def test_like_count_on_list_posts(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])
        client.post(f"/api/posts/{post_id}/like", headers=brian["headers"])

        listing = client.get("/api/posts", headers=brian["headers"]).get_json()
        post = next(p for p in listing if p["id"] == post_id)
        assert post["like_count"] == 1
        assert post["liked_by_me"] is True
