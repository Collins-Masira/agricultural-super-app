# CI / CD Plan

This document describes the continuous integration setup for the **Agricultural Super App**.

## Current State

- A **repository-level foundation workflow** exists: [`repository-ci.yml`](repository-ci.yml).
- It runs on pushes to `develop` and on all pull requests.
- It currently performs **safe, stack-independent checks**:
  1. Verifies the Day 1 documentation structure is present.
  2. Validates `docs/schema.dbml` contains all 13 MVP tables.
  3. Scans tracked files for obvious secret patterns.
  4. Confirms `frontend/` and `backend/` exist in the same repository.
- No secrets, credentials, or environment variables are used.

## Application-Specific CI (future)

The frontend/backend technology stack has **not been selected yet** (frontend/ and backend/ contain no application code). Application-specific CI cannot be written against commands that do not exist — that would create workflows guaranteed to fail.

When the stack is scaffolded (next milestone), add workflows in this directory:

| File | Purpose |
| --- | --- |
| `frontend-ci.yml` | Install frontend dependencies, lint/type-check, test, build |
| `backend-ci.yml` | Install backend dependencies, lint/type-check, test, build |

Both should run on pull requests and pushes to `develop`, use pinned dependency versions, and fail on any error.

## Workflow Requirements

- Runs on `main`/`develop` and all pull requests.
- Uses pinned dependency versions for reproducible installs (e.g. lockfiles).
- Fails on lint, formatting, type, test, or build errors.
- Secrets passed only via GitHub Secrets — never inline.

## Later Additions

| Stage | Addition |
| --- | --- |
| App scaffolding | `frontend-ci.yml` / `backend-ci.yml` |
| Auth & posts | Unit/integration tests in the app workflows |
| Production | Deployment pipeline, dependency security scanning |