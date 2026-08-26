# app/services/upload_service.py

"""
Image upload handling, shared by post images and profile images -- both
already just store an `image_url` string (see PostImage.image_url,
Profile.profile_image_url), so this doesn't touch either model or
schema. It only adds a way to turn an uploaded file into a URL; once you
have that URL, it flows through the existing post/profile endpoints
exactly like a pasted URL always did.

Security posture (see docs/TECHNICAL_DEBT.md-style reasoning): a file's
extension and declared Content-Type are both attacker-controlled and
proves nothing. The only thing trusted here is whether Pillow can
actually decode the bytes as one of the allowed image formats -- a
disguised executable, a corrupt file, or an SVG with embedded script
content all fail this check. The re-encode step (rather than saving the
uploaded bytes verbatim) also strips EXIF/metadata that could otherwise
carry something unwanted through to every viewer of the image. Filenames
are never taken from the client -- always a fresh random UUID -- so
there's no path-traversal or overwrite-another-upload surface at all.
"""

import io
import os
import uuid

from PIL import Image, UnidentifiedImageError

from app.errors import ValidationAPIError

MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
MAX_DIMENSION_PX = 2000  # downscale anything larger, aspect ratio preserved

# Pillow's declared format -> (file extension, save format, allows alpha)
ALLOWED_FORMATS = {
    "JPEG": ("jpg", "JPEG", False),
    "PNG": ("png", "PNG", True),
    "WEBP": ("webp", "WEBP", True),
}


def _ensure_upload_folder(upload_folder):
    os.makedirs(upload_folder, exist_ok=True)


def save_uploaded_image(file_storage, upload_folder):
    """
    Validate and persist an uploaded image file.

    `file_storage` is a werkzeug FileStorage (from request.files). Raises
    ValidationAPIError for anything that fails validation. Returns the
    generated filename (not a full path/URL -- the route builds that).
    """
    if file_storage is None or not file_storage.filename:
        raise ValidationAPIError("No image file was provided.")

    raw_bytes = file_storage.read()
    if not raw_bytes:
        raise ValidationAPIError("The uploaded file is empty.")
    if len(raw_bytes) > MAX_FILE_SIZE_BYTES:
        raise ValidationAPIError(
            f"Image is too large. Maximum size is {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB."
        )

    try:
        image = Image.open(io.BytesIO(raw_bytes))
        image.verify()  # cheap structural check; the image object is unusable after this
        # Re-open: verify() consumes the parser state, and we still need
        # to actually decode pixel data below to confirm it's not just a
        # well-formed header on truncated/malicious data.
        image = Image.open(io.BytesIO(raw_bytes))
        image.load()
    except (UnidentifiedImageError, OSError, ValueError):
        raise ValidationAPIError(
            "This file is not a valid image. Supported formats: JPEG, PNG, WebP."
        )

    format_info = ALLOWED_FORMATS.get(image.format)
    if format_info is None:
        raise ValidationAPIError(
            f"Unsupported image format ({image.format or 'unknown'}). "
            "Supported formats: JPEG, PNG, WebP."
        )
    extension, save_format, allows_alpha = format_info

    # Downscale oversized images rather than rejecting them outright --
    # a phone photo is routinely 4000px+ wide, which is a worse user
    # experience to bounce than to just resize.
    if image.width > MAX_DIMENSION_PX or image.height > MAX_DIMENSION_PX:
        image.thumbnail((MAX_DIMENSION_PX, MAX_DIMENSION_PX), Image.LANCZOS)

    if save_format == "JPEG" and image.mode in ("RGBA", "P"):
        image = image.convert("RGB")  # JPEG has no alpha channel
    elif not allows_alpha and image.mode == "P":
        image = image.convert("RGB")

    _ensure_upload_folder(upload_folder)
    filename = f"{uuid.uuid4().hex}.{extension}"
    destination = os.path.join(upload_folder, filename)

    save_kwargs = {"format": save_format}
    if save_format == "JPEG":
        save_kwargs["quality"] = 85
        save_kwargs["optimize"] = True
    image.save(destination, **save_kwargs)

    return filename
