# Project Roadmap

This roadmap breaks the Agricultural Super App into logical development stages. It is a living plan and will be adjusted as the project evolves.

> The stage numbers are planning aids, not calendar days. A stage is complete only when its deliverables are implemented and verified.

---

## Table of Contents

- [Stage 1 — Product & Technical Foundation](#stage-1--product--technical-foundation)
- [Stage 2 — Technology Selection & Application Scaffolding](#stage-2--technology-selection--application-scaffolding)
- [Stage 3 — Authentication & User Management](#stage-3--authentication--user-management)
- [Stage 4 — Farmer & Farm Management](#stage-4--farmer--farm-management)
- [Stage 5 — Agricultural Inventory & Inputs](#stage-5--agricultural-inventory--inputs)
- [Stage 6 — Marketplace & Produce](#stage-6--marketplace--produce)
- [Stage 7 — Orders & Payments](#stage-7--orders--payments)
- [Stage 8 — Notifications & Communication](#stage-8--notifications--communication)
- [Stage 9 — Analytics & Administration](#stage-9--analytics--administration)
- [Stage 10 — Production Readiness](#stage-10--production-readiness)
- [Current Status](#current-status)
- [Milestone Checklist](#milestone-checklist)

---

## Stage 1 — Product & Technical Foundation

**Status:** In progress

- [x] Establish project identity and repository structure.
- [x] Establish documentation structure.
- [x] Document functional and non-functional requirements.
- [x] Reference the official **Figma** product design.
- [x] Reference and inspect the official **dbdiagram** database design.
- [x] Document architecture direction.
- [x] Document design foundation and design traceability.
- [x] Document database foundation and database traceability.
- [x] Document product/data flows.
- [x] Document development standards.
- [x] Configure `.gitignore`.
- [x] Document the CI plan.
- [x] Create baseline commit on `develop`.
- [ ] Resolve database diagram discrepancy (schema does not represent agricultural requirements).
- [ ] Verify the Figma design (currently not accessible from this environment).

**Exit criteria:** A clean, documented, version-controlled foundation with no application code and no unresolved contradictions between the requirements, Figma, database, architecture, and roadmap.

## Stage 2 — Technology Selection & Application Scaffolding

**Status:** Not started

- Select the technology stack (backend, frontend, database, tooling).
- Scaffold the backend application with a minimal runnable service.
- Scaffold the frontend application shell.
- Establish linting, formatting, and type-checking configuration.
- Set up the database connection and migration tooling.
- Configure CI workflows to run checks, tests, and builds.
- Commit a clean baseline for both applications.

**Exit criteria:** Both applications run locally, checks pass, CI is green.

## Stage 3 — Authentication & User Management

- Implement user registration and login.
- Implement password hashing and reset flows.
- Implement role-based access control (farmer, buyer, supplier, admin, advisory officer).
- Implement user profile management.
- Cover authentication with unit and integration tests.

**Exit criteria:** Users can register, log in, and access role-appropriate features.

## Stage 4 — Farmer & Farm Management

- Implement farmer registration and farmer records.
- Implement farm records and plots.
- Link farmers to their farms.
- Cover with tests.

**Exit criteria:** Farmers can be registered and manage their farms and plots.

## Stage 5 — Agricultural Inventory & Inputs

- Implement crop records and seasons.
- Implement livestock inventory.
- Implement agricultural input catalogues from suppliers.
- Cover with tests.

**Exit criteria:** Farmers and suppliers can record crops, livestock, and inputs.

## Stage 6 — Marketplace & Produce

- Implement produce listings.
- Implement search and filtering for buyers.
- Implement listing lifecycle (active/deactivated).
- Cover with tests.

**Exit criteria:** Farmers can list produce and buyers can discover it.

## Stage 7 — Orders & Payments

- Implement order creation and status tracking.
- Implement payment recording and provider integration.
- Ensure idempotency of financial operations.
- Implement order and payment history.
- Cover with tests.

**Exit criteria:** Buyers can order produce and pay, with reliable records.

## Stage 8 — Notifications & Communication

- Implement in-app notifications.
- Integrate email and SMS channels.
- Implement notification preferences.
- Cover with tests.

**Exit criteria:** Users receive timely, manageable notifications.

## Stage 9 — Analytics & Administration

- Implement administration features (users, roles, moderation).
- Implement audit logging.
- Implement dashboards and reporting.
- Implement analytics exports.
- Cover with tests.

**Exit criteria:** Administrators can manage the platform and view reports.

## Stage 10 — Production Readiness

- Complete security review and hardening.
- Add load testing and performance tuning.
- Configure deployment and environment management.
- Implement backups, monitoring, and alerting.
- Final documentation review.
- Soft launch and release.

**Exit criteria:** The platform is deployable, observable, and ready for real users.

---

## Current Status

| Stage | Status |
| --- | --- |
| Stage 1 — Product & Technical Foundation | **In progress** |
| Stage 2 — Technology Selection & Application Scaffolding | Not started |
| Stage 3 — Authentication & User Management | Not started |
| Stage 4 — Farmer & Farm Management | Not started |
| Stage 5 — Agricultural Inventory & Inputs | Not started |
| Stage 6 — Marketplace & Produce | Not started |
| Stage 7 — Orders & Payments | Not started |
| Stage 8 — Notifications & Communication | Not started |
| Stage 9 — Analytics & Administration | Not started |
| Stage 10 — Production Readiness | Not started |

## Milestone Checklist

Cross-cutting requirements that apply across all stages:

- [ ] Requirements updated in `docs/project/requirements.md` for every implemented feature.
- [ ] Data model changes reflected in `docs/database.md` and `docs/schema.dbml`.
- [ ] Tests written and passing for every implemented feature.
- [ ] CI passing on every pull request.
- [ ] No secrets or local configuration committed.