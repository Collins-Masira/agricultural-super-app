# app/services/story_service.py

"""
Stories: a photo update that is only ever considered "active" for 24
hours from creation. Every read path below filters on
`Story.expires_at > datetime.utcnow()` -- that comparison is the entire
expiration rule, enforced here in the backend regardless of what the
frontend does or doesn't render. cleanup_expired_stories() only ever
reclaims storage for rows that are already excluded by that filter; it
is never what makes a story stop being active.
"""

from datetime import datetime, timedelta

from app.errors import ForbiddenError, NotFoundError
from app.extensions import db
from app.models import Story

STORY_LIFETIME = timedelta(hours=24)


def _not_expired():
    return Story.expires_at > datetime.utcnow()


def create_story(current_user, image_url, caption=None):
    now = datetime.utcnow()
    story = Story(
        user_id=current_user.id,
        image_url=image_url,
        caption=caption,
        created_at=now,
        expires_at=now + STORY_LIFETIME,
    )
    db.session.add(story)
    db.session.commit()
    return story


def list_active_stories():
    """
    Every currently-active story, across all users, grouped so each
    user's stories are contiguous (most-recently-active user's group
    first) and chronological (oldest first) within each group -- the
    shape the StoryBar/StoryViewer UX already expects when grouping
    slides per author.
    """
    stories = (
        db.session.query(Story)
        .filter(_not_expired())
        .order_by(Story.created_at.desc(), Story.id.desc())
        .all()
    )

    order = []
    by_user = {}
    for story in stories:
        if story.user_id not in by_user:
            by_user[story.user_id] = []
            order.append(story.user_id)
        by_user[story.user_id].append(story)

    return [story for user_id in order for story in reversed(by_user[user_id])]


def list_user_active_stories(user_id):
    return (
        db.session.query(Story)
        .filter(Story.user_id == user_id)
        .filter(_not_expired())
        .order_by(Story.created_at.asc())
        .all()
    )


def get_active_story_or_404(story_id):
    story = db.session.get(Story, story_id)
    if story is None or story.expires_at <= datetime.utcnow():
        raise NotFoundError(f"Story {story_id} not found.")
    return story


def delete_story(current_user, story_id):
    story = db.session.get(Story, story_id)
    if story is None:
        raise NotFoundError(f"Story {story_id} not found.")
    if current_user.id != story.user_id and current_user.role != "admin":
        raise ForbiddenError("You do not have permission to delete this story.")
    db.session.delete(story)
    db.session.commit()


def cleanup_expired_stories():
    """
    Physically deletes rows past expiry. Pure housekeeping -- callers
    never rely on this having run for expiration itself to hold, since
    every read above already filters on expires_at independently.
    """
    deleted = (
        db.session.query(Story)
        .filter(Story.expires_at <= datetime.utcnow())
        .delete(synchronize_session=False)
    )
    db.session.commit()
    return deleted
