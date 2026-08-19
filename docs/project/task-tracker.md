# Project Tracker & Task Allocation

This document is the project tracker for the **Agricultural Super App** (Moringa School group project).

## Team

| Member | Email |
| --- | --- |
| Collins Ondieki | collinsmasiraondieki@gmail.com |
| Evans Muthomi | muthomyevans@gmail.com |
| Razia Munyua | wambuirazia004@gmail.com |
| Bravel Kimani | kimanibravel@gmail.com |

## Statuses

| Status | Meaning |
| --- | --- |
| TODO | Not started |
| IN PROGRESS | Being worked on |
| IN REVIEW | Completed work pending review |
| DONE | Completed and verified |

## Day 1 Tasks

| # | Task | Status | Owner |
| --- | --- | --- | --- |
| 1 | UI Design (Figma) | IN REVIEW | Razia |
| 2 | Database / ERD | IN PROGRESS | Evans |
| 3 | Repository Setup | IN REVIEW | Collins |
| 4 | Git Workflow | IN REVIEW | Collins |
| 5 | Project Tracker | IN REVIEW | Collins |
| 6 | Task Allocation | IN PROGRESS | Collins |
| 7 | CI/CD | IN PROGRESS | Collins / Bravel |

> Statuses above reflect the in-repository evidence at the time of writing. Update this table as work progresses. Do not mark tasks DONE without verifiable evidence.

## Proposed Team Allocation

> **Proposed team allocation — pending group confirmation.** The group has not formally agreed to these assignments in this repository. Confirm and record agreement before treating them as fixed.

| Member | Assigned Work |
| --- | --- |
| Collins Ondieki | Repository setup, Git workflow, CI/CD, documentation, project coordination |
| Evans Muthomi | Backend/API, database implementation, backend testing |
| Razia Munyua | UI/Figma, frontend implementation, frontend documentation |
| Bravel Kimani | Backend support, testing, integration, code review |

## Day 1 Task Descriptions

1. **UI Design** — Razia confirms/owns the Figma design (https://www.figma.com/make/HqRJlUNybCkDNSuy0TMeQj/Agricultural-Super-App-Development) covering the MVP screens; Collins cannot verify the Figma from the automation environment (HTTP 403).
2. **Database / ERD** — Evans applies the current verified schema in `docs/schema.dbml` to dbdiagram.io and confirms it matches the MVP.
3. **Repository Setup** — frontend/ and backend/ in the same repository with docs and CI scaffolding (completed in-repo).
4. **Git Workflow** — documented in [git-workflow.md](git-workflow.md); `main` and `develop` branches must be enforced with protection.
5. **Project Tracker** — this file plus the recommended GitHub Project (below).
6. **Task Allocation** — record the confirmed allocation above after group agreement.
7. **CI/CD** — `.github/workflows/repository-ci.yml` foundation exists; application-specific CI is added when frontend/backend are scaffolded.

## Recommended GitHub Project Structure

The repository automation token **does not have permission to create a GitHub Project** (missing `project` scope). Collins must create it manually. Recommended setup:

- GitHub Project (Projects v2) for the repository: `Agricultural Super App`
- Columns: `BACKLOG`, `TODO`, `IN PROGRESS`, `IN REVIEW`, `DONE`
- Add the Day 1 tasks above as issues/items and move them through the columns.
- Create backlog issues for the MVP modules:

| Issue | Owner (confirm before assigning) |
| --- | --- |
| Authentication (register/login) | Evans |
| User profiles + expert verification | Evans / Razia |
| Posts, images, comments, likes | Evans / Bravel |
| Communities, membership, following | Evans |
| Messaging (conversations, messages) | Bravel |
| Frontend implementation (per Figma) | Razia |
| Backend API foundation | Evans |
| CI/CD workflows | Collins / Bravel |

> Assign issues only after the collaborator accounts are confirmed. Verified collaborators: `Collins-Masira` (admin), `muthomi-labs`, `kimanibravel1806` (write). **Razia's account is not yet a collaborator — Collins must invite her.**

## Related Documents

- [Git workflow](git-workflow.md)
- [Development standards](development.md)
- [Day 1 status](day1-status.md)