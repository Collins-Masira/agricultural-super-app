# CI / CD Plan

This document describes the continuous integration plan for the **Agricultural Super App**.

> **Why this is a plan, not a workflow yet:** The technology stack has not been selected, so there are no package manifests, lint commands, or test commands to reference. Writing a workflow against a non-existent stack would create a CI config that cannot pass. The workflow is created on Day 2, immediately after the stack is chosen.

---

## Table of Contents

- [Goals](#goals)
- [Timing](#timing)
- [Proposed Workflow](#proposed-workflow)
- [Workflow Requirements](#workflow-requirements)
- [Later Additions](#later-additions)

---

## Goals

CI must, on every pull request and push to protected branches:

1. Install dependencies.
2. Run formatting and lint checks (as configured by the chosen stack).
3. Run tests.
4. Run build and/or type checks.
5. Fail loudly on any breakage so the team never merges broken code.

## Timing

| Milestone | CI Action |
| --- | --- |
| Day 1 (now) | Document this plan. No workflow yet — no stack. |
| Day 2 | Create the first real workflow alongside the stack scaffold. |
| Continuous | Extend workflows as modules and commands are added. |

## Proposed Workflow

When the stack is selected, a workflow such as the following will be created in this directory:

```yaml
# Placeholder outline — commands will be filled with the real stack's commands.
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # 1. Install dependencies   (e.g. npm ci / pip install / composer install)
      # 2. Lint / format check    (e.g. npm run lint, ruff, black --check)
      # 3. Type check             (e.g. npm run typecheck, mypy)
      # 4. Test                   (e.g. npm test, pytest)
      # 5. Build                  (e.g. npm run build)
```

The exact steps, commands, and versions are defined when the stack is known.

## Workflow Requirements

- Runs on `main`, `develop`, and all pull requests.
- Uses pinned dependency versions for reproducible installs (e.g. lockfiles).
- Fails the build on lint, formatting, type, test, or build errors.
- Secrets are passed to the workflow only via GitHub Secrets — never inline.
- Fast feedback: the full check suite stays under a few minutes where possible.

## Later Additions

| Stage | Addition |
| --- | --- |
| Day 7 | Payment-related tests behind mocked providers |
| Day 9 | Seed/DB verification in CI |
| Day 10 | Deployment pipeline (build, image, deploy to staging/production), dependency security scanning |