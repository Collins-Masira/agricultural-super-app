# app/routes/__init__.py

from .auth_routes import auth_bp
from .community_routes import communities_bp
from .message_routes import conversations_bp, messages_bp
from .post_routes import comments_bp, posts_bp
from .user_routes import users_bp


def register_blueprints(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(posts_bp)
    app.register_blueprint(comments_bp)
    app.register_blueprint(communities_bp)
    app.register_blueprint(conversations_bp)
    app.register_blueprint(messages_bp)
