# wsgi.py
#
# Entry point for WSGI servers (gunicorn, uwsgi) in production, e.g.:
#   gunicorn "wsgi:app"
#
# Also runnable directly for local development:
#   python wsgi.py

import os

from app import create_app

app = create_app(os.environ.get("FLASK_ENV", "development"))

if __name__ == "__main__":
    app.run()
