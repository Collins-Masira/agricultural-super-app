# app/models/post_image.py

from app.extensions import utcnow
from app.extensions import db


class PostImage(db.Model):
    __tablename__ = "post_images"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    post_id = db.Column(
        db.Integer,
        db.ForeignKey("posts.id", ondelete="CASCADE"),
        nullable=False
    )

    image_url = db.Column(
        db.Text,
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=utcnow,
        nullable=False
    )

    post = db.relationship(
        "Post",
        back_populates="images"
    )