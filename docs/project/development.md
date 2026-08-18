# Development Standards

This document defines the engineering conventions every contributor must follow. It will be extended as the concrete stack is selected on Day 2.

---

## Table of Contents

- [Code Conventions](#code-conventions)
- [Naming Conventions](#naming-conventions)
- [Folder Conventions](#folder-conventions)
- [Git Conventions](#git-conventions)
- [Commit Message Conventions](#commit-message-conventions)
- [Branch Strategy](#branch-strategy)
- [Environment Variable Practices](#environment-variable-practices)
- [Error Handling Expectations](#error-handling-expectations)
- [Testing Expectations](#testing-expectations)
- [Documentation Expectations](#documentation-expectations)
- [Code Review Expectations](#code-review-expectations)

---

## Code Conventions

- All code must follow the linting and formatting rules configured for the selected stack.
- Formatting is enforced by tools (e.g. Prettier/Black/etc.), not by preference.
- No dead code, commented-out code, or debug leftovers are merged.
- Prefer small, focused, well-named functions and modules.
- Favour explicit behaviour over clever/obscure constructs.

## Naming Conventions

Language-specific naming will be defined when the stack is selected. General principles:

- Use descriptive names that state intent.
- Be consistent within a file, module, and the whole codebase.
- Follow the idiomatic case convention of the language (e.g. `snake_case`, `camelCase`, `PascalCase`).
- Database table and column names use `snake_case`.
- Environment variables use `SCREAMING_SNAKE_CASE`.

## Folder Conventions

- `backend/` — backend API, services, and background jobs.
- `frontend/` — web and/or mobile client(s).
- `docs/` — all project documentation:
  - `docs/project/` — requirements, roadmap, standards, traceability.
  - `docs/architecture.md` — architecture overview and decisions.
  - `docs/database.md` — data model documentation.
  - `docs/design.md` — design and UX documentation.
- `.github/workflows/` — CI/CD configuration and plan.

Each application folder will define its own internal structure when the stack is chosen. Internal structure must be documented before it grows.

## Git Conventions

- Commit early and often; keep commits focused on a single logical change.
- Never commit secrets, credentials, or local environment files.
- Never commit generated or build output.
- Reference related requirements/issue numbers in commit or PR descriptions where useful.
- Keep the working tree clean at the end of a work session.

## Commit Message Conventions

Use the [Conventional Commits](https://www.conventionalcommits.org/) style:

```text
feat: add farmer registration endpoint
fix: correct order total calculation
docs: document database direction
refactor: simplify order status flow
test: add tests for payment idempotency
chore: update dependencies
```

Format:

```text
<type>[optional scope]: <description>

[optional body]

[optional footer]
```

Allowed types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `ci`, `style`, `build`.

## Branch Strategy

- `main` — production-ready code. Protected. Merged only via pull request.
- `develop` — integration branch for ongoing development. Default working branch.
- Feature branches — created from `develop` for each piece of work:

```text
main
 └── develop
      └── feat/<short-description>
      └── fix/<short-description>
      └── docs/<short-description>
```

- Branch names are lowercase, hyphen-separated, and prefixed by type.

## Environment Variable Practices

- All configuration and secrets come from environment variables.
- A `.env.example` template is committed documenting every variable with a placeholder value and a short description.
- Real `.env` files are never committed (see `.gitignore`).
- Variables are grouped and named clearly, e.g. `DATABASE_URL`, `JWT_SECRET`, `PAYMENT_API_KEY`.
- No secrets are hard-coded, defaulted, or logged.

## Error Handling Expectations

- Fail fast and loudly in development; degrade gracefully in production.
- Errors are logged with enough context to be reproduced (but never secrets or personal data).
- API error responses use consistent status codes and a consistent response shape.
- External service failures are treated as expected cases, with retries/timeouts where appropriate.
- Critical financial operations are idempotent and guarded against double-processing.

## Testing Expectations

- Automated tests cover critical business logic and regression-prone paths.
- Unit tests target individual modules in isolation.
- Integration tests verify interactions with the database and external services.
- New features are merged only with passing tests.
- Test names describe expected behaviour, not implementation details.
- CI runs the full test suite on every pull request (once CI is configured).

## Documentation Expectations

- Every major feature has a requirements entry in `docs/project/requirements.md`.
- Architectural decisions are captured in `docs/architecture.md`.
- Data model changes are reflected in `docs/database.md` and `docs/schema.dbml`.
- Documentation is updated in the same change as the code it describes.
- Documentation describes reality; planned items are explicitly marked as planned.

## Code Review Expectations

- Every pull request is reviewed before merging into `develop` or `main`.
- Reviewers check: correctness, security, consistency with these standards, test coverage, and documentation.
- Review comments are constructive and specific.
- No one merges their own pull request without a review.
- CI checks must pass before merge.