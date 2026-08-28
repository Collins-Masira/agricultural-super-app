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

    community_id = db.Column(
        db.Integer,
        db.ForeignKey("communities.id", ondelete="CASCADE"),
        nullable=True
    )

    original_post_id = db.Column(
        db.Integer,
        db.ForeignKey("posts.id", ondelete="CASCADE"),
        nullable=True
    )

    is_announcement = db.Column(
        db.Boolean,
        nullable=False,
        default=False,
        server_default="0"
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
        default=datetime.utcnow,
        nullable=False
    )

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    user = db.relationship(
        "User",
        back_populates="posts"
    )

    community = db.relationship(
        "Community",
        back_populates="posts"
    )

    original_post = db.relationship(
        "Post",
        remote_side=[id],
        back_populates="reposts"
    )

    reposts = db.relationship(
        "Post",
        back_populates="original_post",
        cascade="all, delete-orphan"
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

    saves = db.relationship(
        "SavedPost",
        back_populates="post",
        cascade="all, delete-orphan"
    )

    __table_args__ = (
        db.UniqueConstraint(
            "user_id",
            "original_post_id",
            name="unique_user_repost"
        ),
    )