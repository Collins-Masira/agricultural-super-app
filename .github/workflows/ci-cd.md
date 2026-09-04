# CI / CD Plan

This document describes the continuous integration setup for the **Agricultural Super App**.

## Current State

Three workflows run in this repository:

- [`repository-ci.yml`](repository-ci.yml) — repository-level foundation checks (documentation
  structure, `docs/schema.dbml` table coverage, a secret-pattern scan, and that `frontend/` and
  `backend/` both exist). Runs on pushes to `develop` and on all pull requests.
- [`backend-ci.yml`](backend-ci.yml) — installs backend dependencies
  (`pip install -r requirements-dev.txt`), applies Alembic migrations to a clean PostgreSQL
  service container (`flask db upgrade`), verifies the models match the migration history
  (`flask db check`), runs the pytest suite (`pytest`), and verifies the app boots with Flasgger
  enabled and serves `/apidocs/` and `/apispec.json`. Runs on pushes to `main`/`develop` and on
  pull requests, only when `backend/` changes.
- [`frontend-ci.yml`](frontend-ci.yml) — installs frontend dependencies (`npm ci`), runs the
  Vitest suite (`npm test`), and builds for production (`npm run build`). Runs on pushes to
  `main`/`develop` and on pull requests, only when `frontend/` changes.

None of the three use `continue-on-error`; any failing step fails the workflow. No real secrets
are used — `backend-ci.yml` sets CI-only placeholder values for `SECRET_KEY`, `JWT_SECRET_KEY`,
and the PostgreSQL service credentials, none of which are valid outside the ephemeral CI runner.

## Continuous Deployment

No deployment platform is currently configured anywhere in this repository (no `Dockerfile`,
`Procfile`, `render.yaml`, `fly.toml`, or similar was found). Deployment is intentionally **not**
implemented — see the root `README.md` for what a future `deploy.yml` (triggered on `main` after
`backend-ci`/`frontend-ci` succeed) would still need: a chosen hosting platform for the Flask API
and the built frontend, that platform's deploy credentials stored as GitHub Actions secrets, and
a real `DATABASE_URL`/`SECRET_KEY`/`JWT_SECRET_KEY`/AI provider key set for that environment.

## Branch Protection (configure in GitHub, not in this repository)

GitHub branch protection rules live in repository settings, not in workflow files, and were not
changed by this repository's automation. For `main` (and `develop`, if desired), enable:

- Require a pull request before merging (no direct pushes).
- Require status checks to pass before merging, selecting the `Repository Foundation CI`,
  `Backend CI / Test, migrations, and API docs`, and `Frontend CI / Test and build` checks.
- Require branches to be up to date before merging.

## Workflow Requirements

- Runs on `main`/`develop` and all pull requests.
- Uses pinned dependency versions for reproducible installs (lockfiles: `requirements.txt` /
  `requirements-dev.txt`, `package-lock.json`).
- Fails on test, migration-integrity, or build errors.
- Secrets passed only via GitHub Secrets — never inline. CI itself needs none, since it only ever
  talks to the ephemeral PostgreSQL service container it starts.

## Later Additions

| Stage | Addition |
| --- | --- |
| Production | Deployment pipeline once a hosting platform is chosen, dependency security scanning |
