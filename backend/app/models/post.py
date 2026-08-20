# app/models/post.py

from datetime import datetime
from app.extensions import db


class Post(db.Model):
    __tablename__ = "posts"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False
    )

    title = db.Column(
        db.String(255),
        nullable=False
    )

    content = db.Column(
        db.Text,
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    user = db.relationship(
        "User",
        back_populates="posts"
    )

    images = db.relationship(
        "PostImage",
        back_populates="post",
        cascade="all, delete-orphan"
    )

    comments = db.relationship(
        "Comment",
        back_populates="post",
        cascade="all, delete-orphan"
    )

    likes = db.relationship(
        "Like",
        back_populates="post",
        cascade="all, delete-orphan"
    )