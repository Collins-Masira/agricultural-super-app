# app/routes/story_routes.py

from flask import Blueprint, jsonify, request

from app.auth.decorators import get_current_user, jwt_required
from app.schemas import stories_schema, story_schema
from app.services import story_service

stories_bp = Blueprint("stories", __name__, url_prefix="/api/stories")


@stories_bp.get("")
def list_stories():
    """
    List every currently-active story (expires_at > now), grouped so
    each user's stories are contiguous.
    ---
    tags:
      - Stories
    responses:
      200:
        description: Active stories.
        schema:
          type: array
          items:
            $ref: '#/definitions/Story'
    """
    stories = story_service.list_active_stories()
    return jsonify(stories_schema.dump(stories)), 200


@stories_bp.post("")
@jwt_required
def create_story():
    """
    Create a story. Expires automatically 24 hours from now -- the
    client cannot set or influence expires_at.
    ---
    tags:
      - Stories
    security:
      - BearerAuth: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [image_url]
          properties:
            image_url:
              type: string
            caption:
              type: string
              maxLength: 120
    responses:
      201:
        description: Story created.
        schema:
          $ref: '#/definitions/Story'
      422:
        description: image_url is required.
        schema:
          $ref: '#/definitions/Error'
    """
    data = story_schema.load(request.get_json(silent=True) or {})
    story = story_service.create_story(get_current_user(), data["image_url"], data.get("caption"))
    return jsonify(story_schema.dump(story)), 201


@stories_bp.get("/users/<int:user_id>")
def list_user_stories(user_id):
    """
    List a single user's currently-active stories, oldest first.
    ---
    tags:
      - Stories
    parameters:
      - in: path
        name: user_id
        type: integer
        required: true
    responses:
      200:
        description: That user's active stories.
        schema:
          type: array
          items:
            $ref: '#/definitions/Story'
    """
    stories = story_service.list_user_active_stories(user_id)
    return jsonify(stories_schema.dump(stories)), 200


@stories_bp.get("/<int:story_id>")
def get_story(story_id):
    """
    Get a single story by id. An expired story is treated as not found.
    ---
    tags:
      - Stories
    parameters:
      - in: path
        name: story_id
        type: integer
        required: true
    responses:
      200:
        description: The story.
        schema:
          $ref: '#/definitions/Story'
      404:
        description: Story not found, or expired.
        schema:
          $ref: '#/definitions/Error'
    """
    story = story_service.get_active_story_or_404(story_id)
    return jsonify(story_schema.dump(story)), 200


@stories_bp.delete("/<int:story_id>")
@jwt_required
def delete_story(story_id):
    """
    Delete a story. Owner (or a global admin) only.
    ---
    tags:
      - Stories
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: story_id
        type: integer
        required: true
    responses:
      204:
        description: Story deleted.
      403:
        description: Not the story owner.
        schema:
          $ref: '#/definitions/Error'
      404:
        description: Story not found.
        schema:
          $ref: '#/definitions/Error'
    """
    story_service.delete_story(get_current_user(), story_id)
    return "", 204
