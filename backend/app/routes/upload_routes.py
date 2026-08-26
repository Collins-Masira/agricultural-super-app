# app/routes/upload_routes.py

from flask import Blueprint, current_app, jsonify, request, send_from_directory

from app.auth.decorators import jwt_required
from app.services import upload_service

uploads_bp = Blueprint("uploads", __name__, url_prefix="/api/uploads")


@uploads_bp.post("")
@jwt_required
def upload_image():
    """
    Auth required -- any authenticated user can upload an image for
    their own post or profile (ownership of *where the URL gets used* is
    still enforced by the existing post/profile endpoints; this endpoint
    only ever produces a URL, it doesn't attach anything to anything).

    Body: multipart/form-data with a single file field named "image".
    """
    file_storage = request.files.get("image")
    filename = upload_service.save_uploaded_image(file_storage, current_app.config["UPLOAD_FOLDER"])

    url = request.host_url.rstrip("/") + f"/api/uploads/{filename}"
    return jsonify({"url": url, "filename": filename}), 201


@uploads_bp.get("/<path:filename>")
def serve_upload(filename):
    """
    Public (no auth) -- these are meant to be viewable anywhere the
    image_url they're stored under is already publicly dumped (post
    images, profile images). send_from_directory rejects any filename
    containing '..' or an absolute path itself, so this is safe against
    path traversal regardless of what's in the URL.
    """
    return send_from_directory(current_app.config["UPLOAD_FOLDER"], filename)
