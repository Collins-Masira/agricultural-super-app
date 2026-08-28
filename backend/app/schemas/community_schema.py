from marshmallow import EXCLUDE, fields, validate

from app.extensions import ma
from app.models.community import COMMUNITY_PERMISSION_LEVELS


class CommunityMemberSchema(ma.Schema):
    class Meta:
        unknown = EXCLUDE

       id = fields.Integer(dump_only=True)
    user_id = fields.Integer(dump_only=True)
    community_id = fields.Integer(dump_only=True)
    role = fields.String(dump_only=True)
    joined_at = fields.DateTime(dump_only=True)

    member = fields.Nested(
        "UserPublicSchema",
        dump_only=True,
        attribute="user",
    )


class CommunitySchema(ma.Schema):
    class Meta:
        unknown = EXCLUDE

    id = fields.Integer(dump_only=True)

    name = fields.String(
        required=True,
        validate=validate.Length(min=1, max=150),
    )
    description = fields.String(allow_none=True)
    image_url = fields.String(allow_none=True)

    posting_permission = fields.String(validate=validate.OneOf(COMMUNITY_PERMISSION_LEVELS))
    messaging_permission = fields.String(validate=validate.OneOf(COMMUNITY_PERMISSION_LEVELS))
    comments_enabled = fields.Boolean()

    created_by = fields.Integer(dump_only=True)

    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    creator = fields.Nested("UserPublicSchema", dump_only=True)

    members = fields.Nested(
        CommunityMemberSchema,
        many=True,
        dump_only=True,
    )

    my_role = fields.Method("get_my_role", dump_only=True)

    def get_my_role(self, community):
        current_user_id = self.context.get("current_user_id")
        if current_user_id is None:
            return None
        membership = next((m for m in community.members if m.user_id == current_user_id), None)
        return membership.role if membership else None
