#!/usr/bin/env python3
"""
scripts/cleanup_expired_stories.py

Physically deletes Story rows whose expires_at has already passed.

This is housekeeping only -- app/services/story_service.py's read paths
(list_active_stories, list_user_active_stories, get_active_story_or_404)
already filter on `expires_at > now` independently, so a story stops
being "active" the instant it expires regardless of whether or how
often this script runs. Running it just reclaims database space.

Usage:
    python scripts/cleanup_expired_stories.py

Intended to run on a schedule (see render.yaml's story-cleanup cron job),
but is safe to run manually or not at all.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from app.services import story_service


def main():
    app = create_app(os.environ.get("FLASK_ENV"))
    with app.app_context():
        deleted = story_service.cleanup_expired_stories()
        print(f"Deleted {deleted} expired stor{'y' if deleted == 1 else 'ies'}.")


if __name__ == "__main__":
    main()
