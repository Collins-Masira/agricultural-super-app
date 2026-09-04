from datetime import datetime
from app.extensions import db

COMMUNITY_PERMISSION_LEVELS = ("everyone", "experts_only", "admins_only")


class Community(db.Model):
    __tablename__ = "communities"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    name = db.Column(
        db.String(150),
        unique=True,
        nullable=False
    )

    description = db.Column(
        db.Text
    )

    image_url = db.Column(
        db.Text
    )

    created_by = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False
    )

    posting_permission = db.Column(
        db.String(20),
        nullable=False,
        default="everyone",
        server_default="everyone"
    )

    messaging_permission = db.Column(
        db.String(20),
        nullable=False,
        default="everyone",
        server_default="everyone"
    )

    comments_enabled = db.Column(
        db.Boolean,
        nullable=False,
        default=True,
        server_default="1"
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

    creator = db.relationship(
        "User",
        back_populates="created_communities"
    )

    members = db.relationship(
        "CommunityMember",
        back_populates="community",
        cascade="all, delete-orphan"
    )

    follows = db.relationship(
        "CommunityFollow",
        back_populates="community",
        cascade="all, delete-orphan"
    )

    conversations = db.relationship(
        "Conversation",
        foreign_keys="Conversation.community_id",
        back_populates="community"
    )

    posts = db.relationship(
        "Post",
        back_populates="community",
        cascade="all, delete-orphan"
    )

    __table_args__ = (
        db.CheckConstraint(
            f"posting_permission IN {COMMUNITY_PERMISSION_LEVELS}",
            name="ck_communities_posting_permission"
        ),
        db.CheckConstraint(
            f"messaging_permission IN {COMMUNITY_PERMISSION_LEVELS}",
            name="ck_communities_messaging_permission"
        ),
    )
