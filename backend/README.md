# Backend

## Purpose

The backend provides the server-side application for the **Agricultural Super App**. It exposes the platform's capabilities to the frontend over a REST API and acts as the single source of truth for business logic and data.

## Status

| Item | Status |
| --- | --- |
| Technology stack | Flask, SQLAlchemy, Marshmallow, PostgreSQL (SQLite for tests), JWT auth |
| Models (`app/models/`) | Done — audited against `docs/schema.dbml`, verified |
| Schemas (`app/schemas/`) | Done — verified via live model round-trips |
| Application factory, config | Done |
| Auth (register/login/JWT) | Done |
| Routes — auth, users, posts, comments, communities, messages | Done |
| Migrations | Tooling wired (Flask-Migrate/Alembic); no migration history committed yet — see "Getting started" |
| Tests | 165 passing (67 unit, 98 integration), 99% coverage — see "Testing" |
| CI | Not yet |

See `docs/TECHNICAL_DEBT.md` for known limitations and their priority.

## Getting started

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# edit .env: set real SECRET_KEY, JWT_SECRET_KEY, and DATABASE_URL

export FLASK_APP=wsgi.py
flask db init          # first time only
flask db migrate -m "initial schema"
flask db upgrade

flask run              # or: python wsgi.py
```

`GET /health` returns `{"status": "ok"}` once the server is running.

**Presenting this project?** See [`docs/DEMO.md`](docs/DEMO.md) — includes a live demo script (`scripts/demo.py`) and a guide for what to show a mixed classmate/mentor audience.

## API surface

Full reference with request/response examples for every endpoint: **[`docs/API.md`](docs/API.md)**.

Quick summary — all routes are under `/api`, except `/health`:

| Resource | Routes |
| --- | --- |
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Users | `GET /api/users/<id>`, `PUT /api/users/me/profile`, `POST\|DELETE /api/users/<id>/follow` |
| Posts | `GET\|POST /api/posts`, `GET\|PUT\|DELETE /api/posts/<id>`, `POST /api/posts/<id>/images`, `DELETE /api/posts/<id>/images/<id>`, `GET\|POST /api/posts/<id>/comments`, `POST\|DELETE /api/posts/<id>/like` |
| Comments | `PUT\|DELETE /api/comments/<id>` |
| Communities | `GET\|POST /api/communities`, `GET\|PUT\|DELETE /api/communities/<id>`, `POST\|DELETE /api/communities/<id>/members` |
| Messaging | `GET\|POST /api/conversations`, `GET /api/conversations/<id>`, `GET\|POST /api/conversations/<id>/messages`, `PATCH /api/messages/<id>/read` |

Authenticated routes require `Authorization: Bearer <token>`, issued by `/api/auth/register` or `/api/auth/login`.

Every error response is a consistent JSON envelope: `{"error": "message", "details": {...optional...}}`.

## Testing

```bash
pip install -r requirements-dev.txt
pytest                    # runs the full suite with coverage (see pytest.ini)
pytest tests/unit         # fast, no HTTP: business logic only
pytest tests/integration  # full request/response cycle through real routes
```

Tests run against in-memory SQLite by default (see `TestingConfig` in
`app/config.py`) — no database setup required to run them.

- `tests/unit/` — one file per service (`app/services/`), calling
  functions directly. Fast, and pinpoints exactly which function broke.
- `tests/integration/` — one file per resource, hitting real routes
  through Flask's test client. Confirms the HTTP wiring (status codes,
  auth enforcement, JSON shapes) on top of logic already proven at the
  unit level.
- `tests/conftest.py` — shared fixtures, including factory fixtures
  (`create_user`, `register_user`) for building test data without
  duplicating setup code across test files.

A coverage report is written to `htmlcov/index.html` after each run.

## Database Responsibility

- Own all database access and data integrity on behalf of the application.
- Enforce the data model defined in `docs/schema.dbml`.
- Apply schema changes through versioned migrations (Alembic, via Flask-Migrate).
- Prevent secrets and plain-text passwords from ever being stored or logged.

## Relationship with Frontend

- The frontend consumes the backend API; the backend never renders UI.
- Both live in the same repository but as separate application folders (`backend/` and `frontend/`).
- CORS is configured via `CORS_ORIGINS` in `.env` to allow the SPA's origin.