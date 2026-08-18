# Backend

## Purpose

The backend provides the server-side application for the **Agricultural Super App**. It will expose the platform's capabilities to the frontend over an API and act as the single source of truth for business logic and data.

> **Backend implementation: NOT STARTED.** No application code, dependencies, or technology stack exist yet. Everything below is a plan for when implementation begins.

## Planned Backend Responsibilities

- Expose the application's features through an API consumed by the frontend.
- Implement business rules and workflows for the MVP features.
- Enforce authentication, authorisation, and input validation.
- Manage data persistence for all MVP entities.
- Run background work (notifications, messaging, etc.) where needed.

## API Responsibility

- Provide a well-defined, consistent API for the frontend.
- Handle request routing, validation, and structured error responses.
- Protect every endpoint with authentication and role-based access control.
- Keep the API stable and versioned so the frontend can evolve independently.

## Database Responsibility

- Own all database access and data integrity on behalf of the application.
- Enforce the data model defined in `docs/schema.dbml` and the database documentation in `docs/database.md`.
- Apply schema changes through versioned migrations (tooling chosen when the stack is selected).
- Prevent secrets and plain-text passwords from ever being stored or logged.

## Expected Backend Modules

Planned modules (aligned with the MVP, not yet implemented):

- **Authentication** — registration, login, password hashing, sessions/tokens.
- **User profiles** — profile management and expert verification.
- **Posts** — agricultural posts and attached images.
- **Engagement** — comments and likes.
- **Communities** — community creation, membership, and following.
- **Following** — following experts/users and communities.
- **Messaging** — conversations, participants, and messages.

## Relationship with Frontend

- The frontend consumes the backend API; the backend never renders UI.
- Both live in the same repository but as separate application folders (`backend/` and `frontend/`).
- A shared, documented API contract will be agreed when the stack is selected so both sides can be built and tested independently.

## Development Status

| Item | Status |
| --- | --- |
| Technology stack | Not selected |
| Application code | **NOT STARTED** |
| API endpoints | None — planned |
| Database implementation | None — schema only (`docs/schema.dbml`) |
| Tests | None — planned |
| CI for this folder | Planned, added after scaffolding |