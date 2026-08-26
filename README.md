# Agricultural Super App

> **Status:** MVP implemented and functional — Flask/SQLAlchemy backend with 363 passing tests (99% coverage), React/Redux Toolkit frontend, wired together end-to-end. See [backend/README.md](backend/README.md) and [frontend/README.md](frontend/README.md) for details.

## Project Overview

The Agricultural Super App is a social agricultural community platform that connects farmers, agricultural experts, and community groups. It enables users to follow experts and communities, read and publish agricultural blog posts, comment, like, and message — all in one place.

MVP scope:

- User registration and login
- User profiles
- Agricultural blog posts (with images)
- Comments and likes
- Agricultural communities and community membership
- Following agricultural experts/users and communities
- Messaging experts and communities
- Expert verification/profile representation

Out of MVP scope: marketplace, farms/crops/livestock tracking, orders, payments, and weather features.

## Team

- Collins Ondieki — collinsmasiraondieki@gmail.com
- Evans Muthomi — muthomyevans@gmail.com
- Razia Munyua — wambuirazia004@gmail.com
- Bravel Kimani — kimanibravel@gmail.com

See [docs/project/task-tracker.md](docs/project/task-tracker.md) for task allocation.

## MVP Features

| Feature | Status |
| --- | --- |
| User registration, login, logout, password reset, change-password | Implemented (strong password policy enforced backend + frontend) |
| Role-based admin system (dashboard, user management, content moderation) | Implemented (backend-enforced; frontend hiding is UX only) |
| User profiles + expert verification badge | Implemented |
| Agricultural posts with real device image uploads, likes, comments | Implemented |
| Communities & membership (create/join/leave) | Implemented |
| Following experts & users | Implemented |
| Direct messaging (conversations + threads) | Implemented |
| AI Farming Assistant | Implemented (requires `ANTHROPIC_API_KEY` on the backend to answer live; degrades gracefully without it) |
| Password-reset email delivery | Implemented via Flask-Mail (provider-agnostic SMTP); not yet verified against a real SMTP account in this environment — see [backend/README.md](backend/README.md#email-password-reset-delivery) |

See [backend/docs/API.md](backend/docs/API.md) for the full API reference.

## Repository Structure

```text
agricultural-super-app/
├── frontend/                 # React + Redux Toolkit + Vite SPA
│   └── README.md             # Frontend structure and setup
├── backend/                  # Flask + SQLAlchemy + Marshmallow API
│   └── README.md             # Backend structure, API summary, and setup
├── docs/                     # Project documentation
│   ├── architecture.md       # Architecture direction
│   ├── database.md           # Database documentation
│   ├── design.md             # Design and Figma documentation
│   ├── product-data-flow.md  # Product and data flows
│   ├── schema.dbml           # Authoritative database schema (DBML)
│   └── project/              # Requirements, roadmap, standards, tracker, git workflow
├── .github/
│   └── workflows/            # CI/CD configuration and plan
├── README.md
└── .gitignore
```

Frontend and backend live in the **same** repository. See [frontend/README.md](frontend/README.md) and [backend/README.md](backend/README.md).

## Git Workflow

```text
main
  └── develop
        └── feature/<short-description>
```

- `main` — production/release branch.
- `develop` — integration branch.
- `feature/*` — created from `develop` for individual tasks.
- All changes are merged through **Pull Requests** with **code review**.

Full details: [docs/project/git-workflow.md](docs/project/git-workflow.md).

## Design

The official UI/UX design is in Figma (the visual source of truth for frontend implementation):

> https://www.figma.com/make/HqRJlUNybCkDNSuy0TMeQj/Agricultural-Super-App-Development

> **Note:** Collins was added as **owner** of the Figma project (confirmed by Razia). The design is inspectable from Collins's Figma account; the automation environment still returns HTTP 403 and has not inspected the file. Verification status is tracked in `docs/design.md`.

Documentation: [docs/design.md](docs/design.md)

## Database

The official database design is on dbdiagram.io:

> https://dbdiagram.io/d/Agricultural-Super-App-6a841d04fd15a881e5a6b86a

The current verified MVP schema lives in the repository at `docs/schema.dbml` (13 tables covering the full MVP). Experts are represented as `users.role = 'expert'`.

Documentation: [docs/database.md](docs/database.md)

## Documentation

- [Backend plan](backend/README.md)
- [Frontend plan](frontend/README.md)
- [Architecture documentation](docs/architecture.md)
- [Database documentation](docs/database.md)
- [Database schema (DBML)](docs/schema.dbml)
- [Design documentation](docs/design.md)
- [Product & data flows](docs/product-data-flow.md)
- [Git workflow](docs/project/git-workflow.md)
- [Task tracker](docs/project/task-tracker.md)
- [Project requirements](docs/project/requirements.md)
- [Development standards](docs/project/development.md)
- [Roadmap](docs/project/roadmap.md)
- [Day 1 status](docs/project/day1-status.md)

## CI/CD

A repository-level CI foundation runs on GitHub Actions (see [.github/workflows/](.github/workflows/)). Application-specific CI is added when the frontend/backend stack is selected.

## Development Setup

```bash
# Backend (Flask, port 5000)
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # edit SECRET_KEY, JWT_SECRET_KEY, DATABASE_URL
export FLASK_APP=wsgi.py
flask db upgrade
flask run

# Frontend (Vite, port 5173), in a second terminal
cd frontend
npm install
cp .env.example .env.local   # set VITE_API_BASE_URL=http://localhost:5000/api, VITE_USE_MOCKS=false
npm run dev
```

See [backend/README.md](backend/README.md) and [frontend/README.md](frontend/README.md) for full details.

## License

Not yet decided.