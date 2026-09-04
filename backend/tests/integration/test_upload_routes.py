# tests/integration/test_upload_routes.py

import io

from PIL import Image


def _image_bytes(fmt="PNG", size=(50, 40)):
    buf = io.BytesIO()
    Image.new("RGB", size, color=(90, 140, 90)).save(buf, format=fmt)
    buf.seek(0)
    return buf.read()


class TestUploadImage:
    def test_requires_auth(self, client):
        response = client.post(
            "/api/uploads",
            data={"image": (io.BytesIO(_image_bytes()), "test.png")},
            content_type="multipart/form-data",
        )
        assert response.status_code == 401

    def test_valid_png_upload_returns_url(self, client, amina):
        response = client.post(
            "/api/uploads",
            headers=amina["headers"],
            data={"image": (io.BytesIO(_image_bytes("PNG")), "test.png")},
            content_type="multipart/form-data",
        )
        assert response.status_code == 201
        body = response.get_json()
        assert body["url"].startswith("http://")
        assert "/api/uploads/" in body["url"]
        assert body["filename"].endswith(".png")

    def test_valid_jpeg_upload(self, client, amina):
        response = client.post(
            "/api/uploads",
            headers=amina["headers"],
            data={"image": (io.BytesIO(_image_bytes("JPEG")), "photo.jpg")},
            content_type="multipart/form-data",
        )
        assert response.status_code == 201
        assert response.get_json()["filename"].endswith(".jpg")

    def test_valid_webp_upload(self, client, amina):
        response = client.post(
            "/api/uploads",
            headers=amina["headers"],
            data={"image": (io.BytesIO(_image_bytes("WEBP")), "photo.webp")},
            content_type="multipart/form-data",
        )
        assert response.status_code == 201
        assert response.get_json()["filename"].endswith(".webp")

    def test_rejects_disguised_non_image_file(self, client, amina):
        response = client.post(
            "/api/uploads",
            headers=amina["headers"],
            data={"image": (io.BytesIO(b"not actually an image"), "malware.jpg")},
            content_type="multipart/form-data",
        )
        assert response.status_code == 422

    def test_missing_file_field_returns_422(self, client, amina):
        response = client.post(
            "/api/uploads", headers=amina["headers"], data={}, content_type="multipart/form-data"
        )
        assert response.status_code == 422

    def test_uploaded_image_is_immediately_retrievable(self, client, amina):
        upload_response = client.post(
            "/api/uploads",
            headers=amina["headers"],
            data={"image": (io.BytesIO(_image_bytes("PNG")), "test.png")},
            content_type="multipart/form-data",
        )
        filename = upload_response.get_json()["filename"]

        get_response = client.get(f"/api/uploads/{filename}")
        assert get_response.status_code == 200
        assert get_response.content_type == "image/png"

    def test_serving_unknown_filename_returns_404(self, client):
        response = client.get("/api/uploads/does-not-exist.png")
        assert response.status_code == 404

    def test_path_traversal_attempt_is_rejected(self, client):
        response = client.get("/api/uploads/..%2F..%2F..%2Fetc%2Fpasswd")
        assert response.status_code in (400, 404)

    def test_uploaded_image_can_be_attached_to_a_post(self, client, amina):
        upload_response = client.post(
            "/api/uploads",
            headers=amina["headers"],
            data={"image": (io.BytesIO(_image_bytes("PNG")), "test.png")},
            content_type="multipart/form-data",
        )
        url = upload_response.get_json()["url"]

        post_response = client.post(
            "/api/posts",
            headers=amina["headers"],
            json={"title": "With a real uploaded image", "content": "c", "images": [{"image_url": url}]},
        )
        assert post_response.status_code == 201
        assert post_response.get_json()["images"][0]["image_url"] == url

    def test_uploaded_image_can_become_profile_image(self, client, amina):
        upload_response = client.post(
            "/api/uploads",
            headers=amina["headers"],
            data={"image": (io.BytesIO(_image_bytes("PNG")), "avatar.png")},
            content_type="multipart/form-data",
        )
        url = upload_response.get_json()["url"]

        profile_response = client.put(
            "/api/users/me/profile", headers=amina["headers"], json={"profile_image_url": url}
        )
        assert profile_response.status_code == 200
        assert profile_response.get_json()["profile_image_url"] == url


def _video_bytes(padding=200):
    return b"\x00\x00\x00\x18ftypmp42" + b"\x00" * padding


class TestUploadVideo:
    def test_requires_auth(self, client):
        response = client.post(
            "/api/uploads/video",
            data={"video": (io.BytesIO(_video_bytes()), "clip.mp4")},
            content_type="multipart/form-data",
        )
        assert response.status_code == 401

    def test_valid_mp4_upload_returns_url(self, client, amina):
        response = client.post(
            "/api/uploads/video",
            headers=amina["headers"],
            data={"video": (io.BytesIO(_video_bytes()), "clip.mp4", "video/mp4")},
            content_type="multipart/form-data",
        )
        assert response.status_code == 201
        body = response.get_json()
        assert body["url"].startswith("http://")
        assert body["filename"].endswith(".mp4")

    def test_rejects_disguised_non_video_file(self, client, amina):
        response = client.post(
            "/api/uploads/video",
            headers=amina["headers"],
            data={"video": (io.BytesIO(b"not actually a video"), "malware.mp4", "video/mp4")},
            content_type="multipart/form-data",
        )
        assert response.status_code == 422

    def test_missing_file_field_returns_422(self, client, amina):
        response = client.post(
            "/api/uploads/video", headers=amina["headers"], data={}, content_type="multipart/form-data"
        )
        assert response.status_code == 422

    def test_uploaded_video_is_immediately_retrievable(self, client, amina):
        upload_response = client.post(
            "/api/uploads/video",
            headers=amina["headers"],
            data={"video": (io.BytesIO(_video_bytes()), "clip.mp4", "video/mp4")},
            content_type="multipart/form-data",
        )
        filename = upload_response.get_json()["filename"]

        get_response = client.get(f"/api/uploads/{filename}")
        assert get_response.status_code == 200

    def test_uploaded_video_can_become_a_reel(self, client, amina):
        upload_response = client.post(
            "/api/uploads/video",
            headers=amina["headers"],
            data={"video": (io.BytesIO(_video_bytes()), "clip.mp4", "video/mp4")},
            content_type="multipart/form-data",
        )
        url = upload_response.get_json()["url"]

        post_response = client.post(
            "/api/posts",
            headers=amina["headers"],
            json={"title": "How I control fall armyworm", "content": "c", "video_url": url},
        )
        assert post_response.status_code == 201
        assert post_response.get_json()["video_url"] == url
