# app/models/like.py

from app.extensions import utcnow
from app.extensions import db

REACTION_TYPES = ("like", "love", "funny", "wow", "sad", "fire")


class Like(db.Model):
    __tablename__ = "likes"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    post_id = db.Column(
        db.Integer,
        db.ForeignKey("posts.id", ondelete="CASCADE"),
        nullable=False
    )

    reaction_type = db.Column(
        db.String(20),
        nullable=False,
        default="like",
        server_default="like"
    )

    created_at = db.Column(
        db.DateTime,
        default=utcnow,
        nullable=False
    )

    user = db.relationship(
        "User",
        back_populates="likes"
    )

    post = db.relationship(
        "Post",
        back_populates="likes"
    )

    __table_args__ = (
        db.UniqueConstraint(
            "user_id",
            "post_id",
            name="unique_user_post_like"
        ),
        db.CheckConstraint(
            f"reaction_type IN {REACTION_TYPES}",
            name="ck_likes_reaction_type"
        ),
    )