
from .user_schema import UserSchema, UserPublicSchema
from .profile_schema import ProfileSchema
from .post_schema import PostSchema, PostImageSchema
from .comment_schema import CommentSchema
from .community_schema import CommunitySchema, CommunityMemberSchema
from .message_schema import (
    ConversationSchema,
    ConversationParticipantSchema,
    MessageSchema,
)


user_schema = UserSchema()
users_schema = UserSchema(many=True)
user_public_schema = UserPublicSchema()
users_public_schema = UserPublicSchema(many=True)

profile_schema = ProfileSchema()

post_schema = PostSchema()
posts_schema = PostSchema(many=True)
post_image_schema = PostImageSchema()
post_images_schema = PostImageSchema(many=True)

comment_schema = CommentSchema()
comments_schema = CommentSchema(many=True)

community_schema = CommunitySchema()
communities_schema = CommunitySchema(many=True)
community_member_schema = CommunityMemberSchema()
community_members_schema = CommunityMemberSchema(many=True)

conversation_schema = ConversationSchema()
conversations_schema = ConversationSchema(many=True)
message_schema = MessageSchema()
messages_schema = MessageSchema(many=True)
