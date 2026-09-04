# tests/integration/test_notification_routes.py
#
# Covers both the notifications resource itself (list/read/unread-count)
# and the trigger points that create notifications as a side effect of
# another action (liking, commenting, following) -- see the
# create_notification() calls in post_service and user_service.


def _create_post(client, headers, title="T"):
    response = client.post("/api/posts", headers=headers, json={"title": title, "content": "c"})
    return response.get_json()["id"]


class TestListNotificationsRequiresAuth:
    def test_no_auth_returns_401(self, client):
        response = client.get("/api/notifications")
        assert response.status_code == 401


class TestLikeTriggersNotification:
    def test_liking_a_post_notifies_the_author(self, client, amina, brian):
        post_id = _create_post(client, amina["headers"])
        client.post(f"/api/posts/{post_id}/like", headers=brian["headers"])

        response = client.get("/api/notifications", headers=amina["headers"])
        notifications = response.get_json()
        assert len(notifications) == 1
        assert notifications[0]["type"] == "post_like"
        assert notifications[0]["post_id"] == post_id
        assert notifications[0]["actor"]["username"] == "brian"
        assert notifications[0]["is_read"] is False

    def test_liking_your_own_post_does_not_notify_you(self, client, amina):
        post_id = _create_post(client, amina["headers"])
        client.post(f"/api/posts/{post_id}/like", headers=amina["headers"])

        response = client.get("/api/notifications", headers=amina["headers"])
        assert response.get_json() == []


class TestReactionTriggersNotification:
    def test_new_reaction_notifies_the_author(self, client, amina, brian):
        post_id = _create_post(client, amina["headers"])
        client.post(f"/api/posts/{post_id}/reactions", headers=brian["headers"], json={"reaction_type": "love"})

        notifications = client.get("/api/notifications", headers=amina["headers"]).get_json()
        assert len(notifications) == 1
        assert notifications[0]["type"] == "post_like"

    def test_changing_an_existing_reaction_does_not_notify_again(self, client, amina, brian):
        post_id = _create_post(client, amina["headers"])
        client.post(f"/api/posts/{post_id}/reactions", headers=brian["headers"], json={"reaction_type": "love"})
        client.post(f"/api/posts/{post_id}/reactions", headers=brian["headers"], json={"reaction_type": "fire"})

        notifications = client.get("/api/notifications", headers=amina["headers"]).get_json()
        assert len(notifications) == 1


class TestCommentTriggersNotification:
    def test_commenting_notifies_the_author(self, client, amina, brian):
        post_id = _create_post(client, amina["headers"])
        client.post(f"/api/posts/{post_id}/comments", headers=brian["headers"], json={"content": "Nice post!"})

        notifications = client.get("/api/notifications", headers=amina["headers"]).get_json()
        assert len(notifications) == 1
        assert notifications[0]["type"] == "post_comment"
        assert notifications[0]["post_id"] == post_id
        assert notifications[0]["post_title"] == "T"

    def test_commenting_on_your_own_post_does_not_notify_you(self, client, amina):
        post_id = _create_post(client, amina["headers"])
        client.post(f"/api/posts/{post_id}/comments", headers=amina["headers"], json={"content": "note to self"})

        assert client.get("/api/notifications", headers=amina["headers"]).get_json() == []


class TestFollowTriggersNotification:
    def test_following_a_user_notifies_them(self, client, amina, brian):
        client.post(f"/api/users/{brian['user']['id']}/follow", headers=amina["headers"])

        notifications = client.get("/api/notifications", headers=brian["headers"]).get_json()
        assert len(notifications) == 1
        assert notifications[0]["type"] == "follow"
        assert notifications[0]["actor"]["username"] == "amina"


class TestUnreadCount:
    def test_counts_unread_notifications(self, client, amina, brian):
        post_id = _create_post(client, amina["headers"])
        client.post(f"/api/posts/{post_id}/like", headers=brian["headers"])
        client.post(f"/api/posts/{post_id}/comments", headers=brian["headers"], json={"content": "hi"})

        response = client.get("/api/notifications/unread-count", headers=amina["headers"])
        assert response.get_json()["count"] == 2


class TestMarkRead:
    def test_marks_a_single_notification_read(self, client, amina, brian):
        client.post(f"/api/users/{brian['user']['id']}/follow", headers=amina["headers"])
        notification_id = client.get("/api/notifications", headers=brian["headers"]).get_json()[0]["id"]

        response = client.patch(f"/api/notifications/{notification_id}/read", headers=brian["headers"])
        assert response.status_code == 200
        assert response.get_json()["is_read"] is True
        assert client.get("/api/notifications/unread-count", headers=brian["headers"]).get_json()["count"] == 0

    def test_cannot_mark_someone_elses_notification_read(self, client, amina, brian, register_user):
        client.post(f"/api/users/{brian['user']['id']}/follow", headers=amina["headers"])
        notification_id = client.get("/api/notifications", headers=brian["headers"]).get_json()[0]["id"]

        carol_headers = register_user(username="carol")["headers"]
        response = client.patch(f"/api/notifications/{notification_id}/read", headers=carol_headers)
        assert response.status_code == 403

    def test_marks_all_notifications_read(self, client, amina, brian):
        post_id = _create_post(client, amina["headers"])
        client.post(f"/api/posts/{post_id}/like", headers=brian["headers"])
        client.post(f"/api/posts/{post_id}/comments", headers=brian["headers"], json={"content": "hi"})

        response = client.patch("/api/notifications/read-all", headers=amina["headers"])
        assert response.status_code == 204
        assert client.get("/api/notifications/unread-count", headers=amina["headers"]).get_json()["count"] == 0
