# tests/integration/test_story_routes.py

import io
from datetime import datetime, timedelta

from PIL import Image

from app.extensions import db
from app.models import Story
from app.services import story_service


def _image_bytes(fmt="PNG", size=(50, 40)):
    buf = io.BytesIO()
    Image.new("RGB", size, color=(90, 140, 90)).save(buf, format=fmt)
    buf.seek(0)
    return buf.read()


def _upload_image(client, headers):
    response = client.post(
        "/api/uploads",
        headers=headers,
        data={"image": (io.BytesIO(_image_bytes()), "story.png")},
        content_type="multipart/form-data",
    )
    assert response.status_code == 201, response.get_json()
    return response.get_json()["url"]


def _story_aged(user_id, hours_old):
    created_at = datetime.utcnow() - timedelta(hours=hours_old)
    story = Story(
        user_id=user_id,
        image_url="https://x/story.jpg",
        created_at=created_at,
        expires_at=created_at + story_service.STORY_LIFETIME,
    )
    db.session.add(story)
    db.session.commit()
    return story


class TestCreateStory:
    def test_requires_auth(self, client):
        response = client.post("/api/stories", json={"image_url": "https://x/1.jpg"})
        assert response.status_code == 401

    def test_authenticated_user_can_create_story(self, client, amina):
        response = client.post(
            "/api/stories",
            headers=amina["headers"],
            json={"image_url": "https://x/1.jpg", "caption": "Sunrise over the maize"},
        )
        assert response.status_code == 201
        body = response.get_json()
        assert body["image_url"] == "https://x/1.jpg"
        assert body["caption"] == "Sunrise over the maize"
        assert body["author"]["username"] == "amina"
        assert body["created_at"] is not None
        assert body["expires_at"] is not None

    def test_missing_image_url_returns_422(self, client, amina):
        response = client.post("/api/stories", headers=amina["headers"], json={})
        assert response.status_code == 422

    def test_expires_at_is_approximately_24_hours_after_created_at(self, client, amina):
        response = client.post(
            "/api/stories", headers=amina["headers"], json={"image_url": "https://x/1.jpg"}
        )
        body = response.get_json()
        created_at = datetime.fromisoformat(body["created_at"])
        expires_at = datetime.fromisoformat(body["expires_at"])
        assert expires_at - created_at == timedelta(hours=24)

    def test_real_uploaded_image_can_become_a_story(self, client, amina):
        url = _upload_image(client, amina["headers"])
        response = client.post("/api/stories", headers=amina["headers"], json={"image_url": url})
        assert response.status_code == 201
        assert response.get_json()["image_url"] == url


class TestListActiveStories:
    def test_active_story_is_returned(self, client, amina):
        client.post("/api/stories", headers=amina["headers"], json={"image_url": "https://x/1.jpg"})
        response = client.get("/api/stories")
        assert response.status_code == 200
        assert len(response.get_json()) == 1

    def test_expired_story_is_not_returned(self, client, amina):
        _story_aged(amina["user"]["id"], hours_old=25)
        response = client.get("/api/stories")
        assert response.get_json() == []

    def test_does_not_require_auth(self, client, amina):
        client.post("/api/stories", headers=amina["headers"], json={"image_url": "https://x/1.jpg"})
        response = client.get("/api/stories")
        assert response.status_code == 200

    def test_multiple_users_active_stories_all_appear(self, client, amina, brian):
        client.post("/api/stories", headers=amina["headers"], json={"image_url": "https://x/1.jpg"})
        client.post("/api/stories", headers=brian["headers"], json={"image_url": "https://x/2.jpg"})
        response = client.get("/api/stories")
        authors = {story["author"]["username"] for story in response.get_json()}
        assert authors == {"amina", "brian"}

    def test_deleted_story_no_longer_appears(self, client, amina):
        create_response = client.post(
            "/api/stories", headers=amina["headers"], json={"image_url": "https://x/1.jpg"}
        )
        story_id = create_response.get_json()["id"]
        client.delete(f"/api/stories/{story_id}", headers=amina["headers"])
        response = client.get("/api/stories")
        assert response.get_json() == []


class TestListUserActiveStories:
    def test_returns_only_that_users_stories(self, client, amina, brian):
        client.post("/api/stories", headers=amina["headers"], json={"image_url": "https://x/1.jpg"})
        client.post("/api/stories", headers=brian["headers"], json={"image_url": "https://x/2.jpg"})

        response = client.get(f"/api/stories/users/{amina['user']['id']}")
        assert response.status_code == 200
        body = response.get_json()
        assert len(body) == 1
        assert body[0]["author"]["username"] == "amina"


class TestGetStory:
    def test_returns_active_story(self, client, amina):
        create_response = client.post(
            "/api/stories", headers=amina["headers"], json={"image_url": "https://x/1.jpg"}
        )
        story_id = create_response.get_json()["id"]
        response = client.get(f"/api/stories/{story_id}")
        assert response.status_code == 200
        assert response.get_json()["id"] == story_id

    def test_expired_story_returns_404(self, client, amina):
        story = _story_aged(amina["user"]["id"], hours_old=25)
        response = client.get(f"/api/stories/{story.id}")
        assert response.status_code == 404

    def test_unknown_story_returns_404(self, client):
        response = client.get("/api/stories/999999")
        assert response.status_code == 404


class TestDeleteStory:
    def test_requires_auth(self, client, amina):
        create_response = client.post(
            "/api/stories", headers=amina["headers"], json={"image_url": "https://x/1.jpg"}
        )
        story_id = create_response.get_json()["id"]
        response = client.delete(f"/api/stories/{story_id}")
        assert response.status_code == 401

    def test_owner_can_delete_own_story(self, client, amina):
        create_response = client.post(
            "/api/stories", headers=amina["headers"], json={"image_url": "https://x/1.jpg"}
        )
        story_id = create_response.get_json()["id"]
        response = client.delete(f"/api/stories/{story_id}", headers=amina["headers"])
        assert response.status_code == 204

    def test_another_user_cannot_delete_someone_elses_story(self, client, amina, brian):
        create_response = client.post(
            "/api/stories", headers=amina["headers"], json={"image_url": "https://x/1.jpg"}
        )
        story_id = create_response.get_json()["id"]
        response = client.delete(f"/api/stories/{story_id}", headers=brian["headers"])
        assert response.status_code == 403
