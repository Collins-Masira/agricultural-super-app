# tests/integration/test_admin_moderation.py
#
# Post/comment/community moderation deliberately does NOT get its own
# admin-only endpoints -- it reuses the existing owner-or-admin authorization
# already built into post_service/community_service (see _assert_owner /
# _assert_creator), which already grants role=="admin" an override. These
# tests prove that override actually works end-to-end through the real
# routes for an admin token, and is still denied for a normal user.


class TestPostModeration:
    def test_admin_can_delete_another_users_post(self, client, admin_user, amina):
        post_id = client.post(
            "/api/posts", headers=amina["headers"], json={"title": "T", "content": "C"}
        ).get_json()["id"]

        response = client.delete(f"/api/posts/{post_id}", headers=admin_user["headers"])
        assert response.status_code == 204
        assert client.get(f"/api/posts/{post_id}").status_code == 404

    def test_admin_can_edit_another_users_post(self, client, admin_user, amina):
        post_id = client.post(
            "/api/posts", headers=amina["headers"], json={"title": "Original", "content": "C"}
        ).get_json()["id"]

        response = client.put(
            f"/api/posts/{post_id}", headers=admin_user["headers"], json={"title": "Moderated"}
        )
        assert response.status_code == 200
        assert response.get_json()["title"] == "Moderated"

    def test_normal_user_still_cannot_delete_someone_elses_post(self, client, amina, brian):
        post_id = client.post(
            "/api/posts", headers=amina["headers"], json={"title": "T", "content": "C"}
        ).get_json()["id"]

        response = client.delete(f"/api/posts/{post_id}", headers=brian["headers"])
        assert response.status_code == 403


class TestCommentModeration:
    def test_admin_can_delete_another_users_comment(self, client, admin_user, amina, brian):
        post_id = client.post(
            "/api/posts", headers=amina["headers"], json={"title": "T", "content": "C"}
        ).get_json()["id"]
        comment_id = client.post(
            f"/api/posts/{post_id}/comments", headers=brian["headers"], json={"content": "spam"}
        ).get_json()["id"]

        response = client.delete(f"/api/comments/{comment_id}", headers=admin_user["headers"])
        assert response.status_code == 204


class TestCommunityModeration:
    def test_admin_can_delete_another_users_community(self, client, admin_user, amina):
        community_id = client.post(
            "/api/communities", headers=amina["headers"], json={"name": "Some Group"}
        ).get_json()["id"]

        response = client.delete(f"/api/communities/{community_id}", headers=admin_user["headers"])
        assert response.status_code == 204
