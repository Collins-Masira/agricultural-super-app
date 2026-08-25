# tests/integration/test_message_routes.py

class TestStartAndListConversations:
    def test_requires_auth(self, client, brian):
        response = client.post("/api/conversations", json={"participant_ids": [brian["user"]["id"]]})
        assert response.status_code == 401

    def test_start_conversation_success(self, client, amina, brian):
        response = client.post(
            "/api/conversations", headers=amina["headers"], json={"participant_ids": [brian["user"]["id"]]}
        )
        assert response.status_code == 201
        assert len(response.get_json()["participants"]) == 2

    def test_missing_participant_ids_returns_422(self, client, amina):
        response = client.post("/api/conversations", headers=amina["headers"], json={})
        assert response.status_code == 422

    def test_empty_participant_list_returns_422(self, client, amina):
        response = client.post("/api/conversations", headers=amina["headers"], json={"participant_ids": []})
        assert response.status_code == 422

    def test_unknown_participant_returns_422(self, client, amina):
        response = client.post(
            "/api/conversations", headers=amina["headers"], json={"participant_ids": [999999]}
        )
        assert response.status_code == 422

    def test_list_only_returns_own_conversations(self, client, amina, brian, register_user):
        eve = register_user(username="eve")
        client.post("/api/conversations", headers=amina["headers"], json={"participant_ids": [brian["user"]["id"]]})

        amina_conversations = client.get("/api/conversations", headers=amina["headers"]).get_json()
        eve_conversations = client.get("/api/conversations", headers=eve["headers"]).get_json()

        assert len(amina_conversations) == 1
        assert len(eve_conversations) == 0


class TestGetConversation:
    def _start(self, client, headers, participant_ids):
        response = client.post("/api/conversations", headers=headers, json={"participant_ids": participant_ids})
        return response.get_json()["id"]

    def test_participant_can_view(self, client, amina, brian):
        convo_id = self._start(client, amina["headers"], [brian["user"]["id"]])
        response = client.get(f"/api/conversations/{convo_id}", headers=brian["headers"])
        assert response.status_code == 200

    def test_non_participant_returns_403(self, client, amina, brian, register_user):
        eve = register_user(username="eve")
        convo_id = self._start(client, amina["headers"], [brian["user"]["id"]])

        response = client.get(f"/api/conversations/{convo_id}", headers=eve["headers"])
        assert response.status_code == 403

    def test_unknown_conversation_returns_404(self, client, amina):
        response = client.get("/api/conversations/999999", headers=amina["headers"])
        assert response.status_code == 404


class TestMessages:
    def _start(self, client, headers, participant_ids):
        response = client.post("/api/conversations", headers=headers, json={"participant_ids": participant_ids})
        return response.get_json()["id"]

    def test_send_and_list_messages(self, client, amina, brian):
        convo_id = self._start(client, amina["headers"], [brian["user"]["id"]])

        send_response = client.post(
            f"/api/conversations/{convo_id}/messages", headers=amina["headers"], json={"content": "Hey Brian!"}
        )
        assert send_response.status_code == 201
        assert send_response.get_json()["is_read"] is False

        list_response = client.get(f"/api/conversations/{convo_id}/messages", headers=brian["headers"])
        assert list_response.status_code == 200
        assert len(list_response.get_json()) == 1

    def test_non_participant_cannot_send(self, client, amina, brian, register_user):
        eve = register_user(username="eve")
        convo_id = self._start(client, amina["headers"], [brian["user"]["id"]])

        response = client.post(
            f"/api/conversations/{convo_id}/messages", headers=eve["headers"], json={"content": "Intruding"}
        )
        assert response.status_code == 403

    def test_missing_content_returns_422(self, client, amina, brian):
        convo_id = self._start(client, amina["headers"], [brian["user"]["id"]])
        response = client.post(f"/api/conversations/{convo_id}/messages", headers=amina["headers"], json={})
        assert response.status_code == 422

    def test_recipient_can_mark_read(self, client, amina, brian):
        convo_id = self._start(client, amina["headers"], [brian["user"]["id"]])
        msg_id = client.post(
            f"/api/conversations/{convo_id}/messages", headers=amina["headers"], json={"content": "Hey"}
        ).get_json()["id"]

        response = client.patch(f"/api/messages/{msg_id}/read", headers=brian["headers"])
        assert response.status_code == 200
        assert response.get_json()["is_read"] is True

    def test_sender_cannot_mark_own_message_read(self, client, amina, brian):
        convo_id = self._start(client, amina["headers"], [brian["user"]["id"]])
        msg_id = client.post(
            f"/api/conversations/{convo_id}/messages", headers=amina["headers"], json={"content": "Hey"}
        ).get_json()["id"]

        response = client.patch(f"/api/messages/{msg_id}/read", headers=amina["headers"])
        assert response.status_code == 403
