from app.extensions import utcnow
from app.extensions import db

COMMUNITY_MEMBER_ROLES = ("member", "admin")


class CommunityMember(db.Model):
    __tablename__ = "community_members"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    community_id = db.Column(
        db.Integer,
        db.ForeignKey("communities.id", ondelete="CASCADE"),
        nullable=False
    )

    role = db.Column(
        db.String(20),
        nullable=False,
        default="member",
        server_default="member"
    )

    joined_at = db.Column(
        db.DateTime,
        default=utcnow,
        nullable=False
    )

    user = db.relationship(
        "User",
        back_populates="community_memberships"
    )

    community = db.relationship(
        "Community",
        back_populates="members"
    )

    __table_args__ = (
        db.UniqueConstraint(
            "user_id",
            "community_id",
            name="unique_community_member"
        ),
        db.CheckConstraint(
            f"role IN {COMMUNITY_MEMBER_ROLES}",
            name="ck_community_members_role"
        ),
    )
