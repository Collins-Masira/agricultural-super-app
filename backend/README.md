# Backend

## Purpose

The backend provides the server-side application for the **Agricultural Super App**. It exposes the platform's capabilities to the frontend over a REST API and acts as the single source of truth for business logic and data.

## Status

| Item | Status |
| --- | --- |
| Technology stack | Flask, SQLAlchemy, Marshmallow, PostgreSQL (SQLite for tests), JWT auth, Flask-Mail, Pillow |
| Models (`app/models/`) | Done — audited against `docs/schema.dbml`, verified |
| Schemas (`app/schemas/`) | Done — verified via live model round-trips |
| Application factory, config | Done |
| Auth (register/login/JWT, password reset, change-password) | Done — see "Password policy" and "Email" below |
| Role-based admin system | Done — see "Admin access" below |
| Image uploads (real device files, not URLs) | Done — see "Image uploads" below |
| Routes — auth, users, posts, comments, communities, messages, admin, uploads | Done |
| Migrations | Flask-Migrate/Alembic, migration history committed under `migrations/versions/` |
| API docs | Flasgger/Swagger UI at `/apidocs/`, spec at `/apispec.json` — see "API documentation" below |
| Tests | 548 passing — see "Testing" |
| CI | `../.github/workflows/backend-ci.yml` — tests, migrations, and Swagger boot check on every push/PR |

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
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, `PUT /api/auth/change-password` |
| Users | `GET /api/users/<id>`, `PUT /api/users/me/profile`, `POST\|DELETE /api/users/<id>/follow` |
| Posts | `GET\|POST /api/posts`, `GET\|PUT\|DELETE /api/posts/<id>`, `POST /api/posts/<id>/images`, `DELETE /api/posts/<id>/images/<id>`, `GET\|POST /api/posts/<id>/comments`, `POST\|DELETE /api/posts/<id>/like` |
| Comments | `PUT\|DELETE /api/comments/<id>` |
| Communities | `GET\|POST /api/communities`, `GET\|PUT\|DELETE /api/communities/<id>`, `POST\|DELETE /api/communities/<id>/members`, `POST\|DELETE /api/communities/<id>/follow` |
| Messaging | `GET\|POST /api/conversations`, `GET /api/conversations/<id>`, `GET\|POST /api/conversations/<id>/messages`, `PATCH /api/messages/<id>/read` |
| Uploads | `POST /api/uploads` (multipart image upload), `GET /api/uploads/<filename>` |
| Admin (requires `role=admin`) | `GET /api/admin/stats`, `GET /api/admin/users`, `GET /api/admin/users/<id>`, `PATCH /api/admin/users/<id>` |

Authenticated routes require `Authorization: Bearer <token>`, issued by `/api/auth/register` or `/api/auth/login`.

Every error response is a consistent JSON envelope: `{"error": "message", "details": {...optional...}}`.

`DELETE /api/posts/<id>` requires the caller to be the post's author, a global admin
(`role=admin`), or an admin member of the community the post belongs to (community admins cannot
delete posts outside their own community). See `app/services/post_service.py::_assert_can_delete_post`.

## API documentation

Interactive Swagger UI, generated from the real routes and kept in sync with them automatically:
`GET /apidocs/` (spec JSON at `/apispec.json`). Authenticated routes are marked accordingly, and
Swagger UI's "Authorize" button accepts a `Bearer <token>` value to try them directly. This is the
authoritative, always-current reference; `docs/API.md` is a hand-written narrative companion.

## Password policy

Passwords (registration, reset, and change-password) must be 8+ characters and include an
uppercase letter, a lowercase letter, a number, and a special character. The single source of
truth is `app/validators.py` (mirrored on the frontend in `frontend/src/lib/passwordPolicy.js`
for live UI feedback — the backend re-validates independently and is the real enforcement point).

## Admin access

There is intentionally no public "sign up as admin" path. To grant admin access, promote an
existing user's `role` column to `admin` directly in the database (e.g. via `flask shell` or a
one-off script) — never via an API route. `admin_required` (`app/auth/decorators.py`) is the
actual security boundary enforced on every `/api/admin/*` route; any frontend admin-nav hiding
is UX only.

## Image and video uploads

`POST /api/uploads` accepts a multipart image file (JPEG/PNG/WebP, validated by real content via
Pillow, not by extension/filename), re-encodes it (strips embedded metadata), and stores it under
`UPLOAD_FOLDER` (defaults to `<instance>/uploads`; override with the `UPLOAD_FOLDER` env var to
point at a different path, or swap `app/services/upload_service.py` for an object-storage backend
later). Images are capped at 5MB.

`POST /api/uploads/video` accepts a multipart video file (MP4/MOV/WebM, for Reels/FarmClips) up to
50MB, validated by a magic-byte check on the container format (there's no video-processing
dependency in this project to decode/re-encode it like images). Stored the same way, served from
the same `GET /api/uploads/<filename>`.

`MAX_CONTENT_LENGTH` (env-overridable, default 50MB) is the app-wide Flask request-body ceiling;
each upload type still enforces its own stricter limit inside `upload_service.py`.

## Email (password reset delivery)

Password-reset emails are sent via Flask-Mail over standard SMTP — any provider works (Gmail,
Outlook, a transactional service, etc.); there is no provider-specific logic. Set `MAIL_SERVER`,
`MAIL_PORT`, `MAIL_USE_TLS`/`MAIL_USE_SSL`, `MAIL_USERNAME`, `MAIL_PASSWORD`, and
`MAIL_DEFAULT_SENDER` in `.env` (see `.env.example` for a Gmail App Password example). If any of
`MAIL_SERVER`/`MAIL_USERNAME`/`MAIL_PASSWORD` is unset, email is treated as "not configured": the
reset token is still issued (so the flow can still be completed out-of-band), but no email is
sent — and the response to the client is identical either way, to avoid leaking whether an email
address is registered. **As of this MVP, no real SMTP credentials have been configured in this
environment, so live email delivery has not been verified end-to-end** — the send path itself is
covered by automated tests (`tests/unit/test_email_service.py`,
`tests/unit/test_auth_service.py::TestRequestPasswordReset`) using Flask-Mail's in-memory test
transport.

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

## Business Rules

1. **Messaging permission**: A user may only initiate a conversation with a user they follow (`user_follows`) or a community they follow (`community_follows`). Enforced at the application layer.
2. **Self-follow prevention**: Users cannot follow themselves. Enforced via database `CHECK` constraint and application layer.
3. **Role validation**: Allowed role values are `farmer`, `expert`, `admin` (per `docs/database.md`). Enforced at the application layer.
4. **Foreign-key relationships**: All FK relationships are properly enforced at the database level with `ON DELETE CASCADE` or `RESTRICT` as specified in the DBML schema.
5. **Unique constraints**: Duplicate follows, community memberships, and conversation participants are prevented by database unique constraints.

## Database Responsibility

- Own all database access and data integrity on behalf of the application.
- Enforce the data model defined in `docs/schema.dbml`.
- Apply schema changes through versioned migrations (Alembic, via Flask-Migrate).
- Prevent secrets and plain-text passwords from ever being stored or logged.

## Relationship with Frontend

- The frontend consumes the backend API; the backend never renders UI.
- Both live in the same repository but as separate application folders (`backend/` and `frontend/`).
- CORS is configured via `CORS_ORIGINS` in `.env` to allow the SPA's origin.
