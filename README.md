# Agricultural Super App

> **Status:** Moringa School group project — Day 1 (Week 1) foundation. No application code exists yet.

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
| User registration & login | Planned (schema ready) |
| User profiles + expert verification | Planned (schema ready) |
| Agricultural posts with images | Planned (schema ready) |
| Comments & likes | Planned (schema ready) |
| Communities & membership | Planned (schema ready) |
| Following experts & communities | Planned (schema ready) |
| Messaging | Planned (schema ready) |

None of these are implemented yet. The database schema that supports them is complete (see [Database](#database)).

## Repository Structure

```text
agricultural-super-app/
├── frontend/                 # Frontend application (empty — stack not yet selected)
│   └── README.md             # Frontend purpose and plan
├── backend/                  # Backend application (empty — stack not yet selected)
│   └── README.md             # Backend purpose and plan
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

Not applicable yet — no application code or dependencies exist. Setup instructions will be added when the stack is selected.

## License

Not yet decided.