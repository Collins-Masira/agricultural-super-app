SWAGGER_TEMPLATE = {
    "swagger": "2.0",
    "info": {
        "title": "Agricultural Super App API",
        "description": (
            "REST API for the Agricultural Super App: authentication, posts, comments, "
            "reactions, communities, direct messages, and the AI Farming Assistant. "
            "All routes are under /api except /health. Authenticated routes require "
            "an Authorization: Bearer <token> header, obtained from /api/auth/register "
            "or /api/auth/login. Every error response is {\"error\": \"...\", "
            "\"details\": {...optional...}}."
        ),
        "version": "1.0.0",
    },
    "basePath": "/",
    "schemes": ["http", "https"],
    "consumes": ["application/json"],
    "produces": ["application/json"],
    "securityDefinitions": {
        "BearerAuth": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": "JWT bearer token. Format: 'Bearer <token>'.",
        }
    },
    "tags": [
        {"name": "Authentication", "description": "Register, login, session, password reset."},
        {"name": "Users", "description": "Public profiles, directory, follows."},
        {"name": "Posts", "description": "Feed posts, images, reposts, saves."},
        {"name": "Comments", "description": "Comments on posts."},
        {"name": "Reactions", "description": "Likes and multi-type reactions on posts."},
        {"name": "Communities", "description": "Communities, membership, and moderation."},
        {"name": "Messages", "description": "Direct message conversations."},
        {"name": "AI", "description": "AI Farming Assistant conversations and messages."},
        {"name": "Admin", "description": "Admin-only moderation and stats (role=admin)."},
        {"name": "Uploads", "description": "Image upload for posts and profiles."},
    ],
    "definitions": {
        "Error": {
            "type": "object",
            "properties": {
                "error": {"type": "string"},
                "details": {"type": "object"},
                "code": {"type": "string"},
            },
        },
        "Profile": {
            "type": "object",
            "properties": {
                "id": {"type": "integer"},
                "user_id": {"type": "integer"},
                "first_name": {"type": "string", "x-nullable": True},
                "last_name": {"type": "string", "x-nullable": True},
                "bio": {"type": "string", "x-nullable": True},
                "location": {"type": "string", "x-nullable": True},
                "profile_image_url": {"type": "string", "x-nullable": True},
                "phone_number": {"type": "string", "x-nullable": True},
                "created_at": {"type": "string", "format": "date-time"},
                "updated_at": {"type": "string", "format": "date-time"},
            },
        },
        "UserPublic": {
            "type": "object",
            "properties": {
                "id": {"type": "integer"},
                "username": {"type": "string"},
                "role": {"type": "string"},
                "profile": {
                    "type": "object",
                    "properties": {
                        "first_name": {"type": "string", "x-nullable": True},
                        "last_name": {"type": "string", "x-nullable": True},
                        "profile_image_url": {"type": "string", "x-nullable": True},
                    },
                },
            },
        },
        "User": {
            "type": "object",
            "properties": {
                "id": {"type": "integer"},
                "username": {"type": "string"},
                "email": {"type": "string"},
                "role": {"type": "string", "enum": ["farmer", "expert", "admin"]},
                "is_active": {"type": "boolean"},
                "created_at": {"type": "string", "format": "date-time"},
                "updated_at": {"type": "string", "format": "date-time"},
                "profile": {"$ref": "#/definitions/Profile"},
            },
        },
        "PostImage": {
            "type": "object",
            "properties": {
                "id": {"type": "integer"},
                "post_id": {"type": "integer"},
                "image_url": {"type": "string"},
                "created_at": {"type": "string", "format": "date-time"},
            },
        },
        "Comment": {
            "type": "object",
            "properties": {
                "id": {"type": "integer"},
                "user_id": {"type": "integer"},
                "post_id": {"type": "integer"},
                "content": {"type": "string"},
                "created_at": {"type": "string", "format": "date-time"},
                "updated_at": {"type": "string", "format": "date-time"},
                "author": {"$ref": "#/definitions/UserPublic"},
            },
        },
        "Post": {
            "type": "object",
            "properties": {
                "id": {"type": "integer"},
                "user_id": {"type": "integer"},
                "community_id": {"type": "integer", "x-nullable": True},
                "original_post_id": {"type": "integer", "x-nullable": True},
                "is_announcement": {"type": "boolean"},
                "title": {"type": "string"},
                "content": {"type": "string"},
                "created_at": {"type": "string", "format": "date-time"},
                "updated_at": {"type": "string", "format": "date-time"},
                "author": {"$ref": "#/definitions/UserPublic"},
                "images": {"type": "array", "items": {"$ref": "#/definitions/PostImage"}},
                "comments": {"type": "array", "items": {"$ref": "#/definitions/Comment"}},
                "original_post": {"type": "object", "x-nullable": True},
                "like_count": {"type": "integer"},
                "liked_by_me": {"type": "boolean"},
                "reaction_counts": {"type": "object"},
                "my_reaction": {"type": "string", "x-nullable": True},
                "save_count": {"type": "integer"},
                "saved_by_me": {"type": "boolean"},
                "repost_count": {"type": "integer"},
                "reposted_by_me": {"type": "boolean"},
                "comments_open": {"type": "boolean"},
            },
        },
        "CommunityMember": {
            "type": "object",
            "properties": {
                "id": {"type": "integer"},
                "user_id": {"type": "integer"},
                "community_id": {"type": "integer"},
                "role": {"type": "string", "enum": ["member", "admin"]},
                "joined_at": {"type": "string", "format": "date-time"},
                "member": {"$ref": "#/definitions/UserPublic"},
            },
        },
        "Community": {
            "type": "object",
            "properties": {
                "id": {"type": "integer"},
                "name": {"type": "string"},
                "description": {"type": "string", "x-nullable": True},
                "image_url": {"type": "string", "x-nullable": True},
                "posting_permission": {
                    "type": "string",
                    "enum": ["everyone", "experts_only", "admins_only"],
                },
                "messaging_permission": {
                    "type": "string",
                    "enum": ["everyone", "experts_only", "admins_only"],
                },
                "comments_enabled": {"type": "boolean"},
                "created_by": {"type": "integer"},
                "created_at": {"type": "string", "format": "date-time"},
                "updated_at": {"type": "string", "format": "date-time"},
                "creator": {"$ref": "#/definitions/UserPublic"},
                "members": {"type": "array", "items": {"$ref": "#/definitions/CommunityMember"}},
                "my_role": {"type": "string", "x-nullable": True},
            },
        },
        "Message": {
            "type": "object",
            "properties": {
                "id": {"type": "integer"},
                "conversation_id": {"type": "integer"},
                "sender_id": {"type": "integer"},
                "content": {"type": "string"},
                "is_read": {"type": "boolean"},
                "created_at": {"type": "string", "format": "date-time"},
                "sender": {"$ref": "#/definitions/UserPublic"},
            },
        },
        "Conversation": {
            "type": "object",
            "properties": {
                "id": {"type": "integer"},
                "created_at": {"type": "string", "format": "date-time"},
                "updated_at": {"type": "string", "format": "date-time"},
                "participants": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {"type": "integer"},
                            "conversation_id": {"type": "integer"},
                            "user_id": {"type": "integer"},
                            "joined_at": {"type": "string", "format": "date-time"},
                            "participant": {"$ref": "#/definitions/UserPublic"},
                        },
                    },
                },
                "messages": {"type": "array", "items": {"$ref": "#/definitions/Message"}},
            },
        },
        "AIMessage": {
            "type": "object",
            "properties": {
                "id": {"type": "integer"},
                "conversation_id": {"type": "integer"},
                "role": {"type": "string", "enum": ["user", "assistant"]},
                "content": {"type": "string"},
                "created_at": {"type": "string", "format": "date-time"},
            },
        },
        "AIConversation": {
            "type": "object",
            "properties": {
                "id": {"type": "integer"},
                "title": {"type": "string", "x-nullable": True},
                "created_at": {"type": "string", "format": "date-time"},
                "updated_at": {"type": "string", "format": "date-time"},
            },
        },
        "AIConversationDetail": {
            "type": "object",
            "properties": {
                "id": {"type": "integer"},
                "title": {"type": "string", "x-nullable": True},
                "created_at": {"type": "string", "format": "date-time"},
                "updated_at": {"type": "string", "format": "date-time"},
                "messages": {"type": "array", "items": {"$ref": "#/definitions/AIMessage"}},
            },
        },
    },
}

SWAGGER_CONFIG = {
    "headers": [],
    "specs": [
        {
            "endpoint": "apispec",
            "route": "/apispec.json",
            "rule_filter": lambda rule: True,
            "model_filter": lambda tag: True,
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/apidocs/",
}
