# Architecture Overview

This document describes the architectural direction of the **Agricultural Super App**. It is a high-level plan; concrete technology decisions land on Day 2 of the [roadmap](../project/roadmap.md).

---

## Table of Contents

- [Architecture Principles](#architecture-principles)
- [High-Level System View](#high-level-system-view)
- [Layered Architecture](#layered-architecture)
  - [1. Clients](#1-clients)
  - [2. API Layer](#2-api-layer)
  - [3. Application Services](#3-application-services)
  - [4. Database](#4-database)
- [Future Integrations](#future-integrations)
- [Planned Components](#planned-components)
- [Deployment Direction](#deployment-direction)
- [Decisions & Open Questions](#decisions--open-questions)

---

## Architecture Principles

1. **Client-server separation.** Web and mobile clients communicate with a shared backend API. Business logic lives in the backend, never duplicated in clients.
2. **Modular services.** The application is organised into modules aligned with requirements (accounts, farms, marketplace, orders, payments, etc.).
3. **Stateless where possible.** Services can be scaled horizontally without shared local state.
4. **External dependencies isolated.** Payment, SMS, email, maps, and other external providers are behind thin adapters so they can be swapped.
5. **Data-driven.** A well-designed database is the foundation of reliable reports and analytics.
6. **Keep it simple.** Prefer the simplest architecture that meets today's requirements while leaving clear extension points.

## High-Level System View

```text
                     ┌─────────────────────────────────────────┐
                     │                USERS                     │
                     │  Farmers · Buyers · Suppliers · Admins   │
                     └─────────────────────────────────────────┘
                                          │
                    ┌─────────────────────┴─────────────────────┐
                    │                                           │
              Web Client                                  Mobile Client
                    │                                           │
                    └─────────────────────┬─────────────────────┘
                                          │  HTTPS
                     ┌────────────────────▼─────────────────────┐
                     │               API LAYER                   │
                     │   Routing · Auth · Validation · Errors    │
                     └────────────────────┬─────────────────────┘
                                          │
                     ┌────────────────────▼─────────────────────┐
                     │          APPLICATION SERVICES             │
                     │  Accounts · Farms · Marketplace · Orders  │
                     │  Payments · Notifications · Reports       │
                     └────────────────────┬─────────────────────┘
                                          │
                     ┌────────────────────▼─────────────────────┐
                     │                 DATABASE                  │
                     └──────────────────────────────────────────┘
```

## Layered Architecture

### 1. Clients

- **Web application** — administrative, marketplace, and management interface.
- **Mobile application** — farmer- and buyer-facing experience for field use.
- Both clients consume the same API; platform behaviour stays consistent.

### 2. API Layer

Responsibilities:

- Routing requests to the correct service.
- Authenticating users and authorising access by role.
- Validating inputs and returning consistent, well-structured responses.
- Handling errors with appropriate HTTP status codes.

### 3. Application Services

Each domain module provides business services:

| Module | Responsibilities |
| --- | --- |
| Accounts | Registration, login, roles, profiles |
| Farms | Farmers, farms, plots, crops, livestock |
| Marketplace | Produce listings, search, discovery |
| Inputs | Supplier input catalogues |
| Orders & Payments | Order lifecycle, payment recording, provider integration |
| Notifications | In-app, email, SMS delivery |
| Information | Agricultural content and advisories |
| Administration | User management, moderation, audit log |
| Reporting | Dashboards, reports, analytics |

Background jobs (email/SMS delivery, report generation, payment reconciliation) are kept separate from request handling.

### 4. Database

- A relational database is the primary store for transactional data (users, farms, orders, payments).
- Schema follows the direction in [docs/database/README.md](../database/README.md).
- Indexing and query patterns are designed with reporting and mobile-field use in mind.

## Future Integrations

These services will be integrated behind adapters as features are built:

```text
Payment Providers  → orders and payments
SMS / Email        → notifications and communication
Maps / Location    → farm locations and delivery
Agricultural APIs  → weather, market prices, advisories
Notification
Services           → in-app and push notifications
```

Each integration is documented before implementation, with fallback behaviour defined.

## Planned Components

| Component | Purpose | Stage |
| --- | --- | --- |
| Backend API | Serves all clients | 2 |
| Frontend application | Web interface | 2 |
| Mobile application | Field/mobile interface | 2+ |
| Database | Primary data store | 2 |
| Job/queue system | Background work | 5+ |
| Object storage | Produce photos, documents | 6 |
| Payment integration | Order payments | 7 |
| Notification services | Email/SMS/push | 8 |
| Analytics/reporting | Dashboards | 9 |

## Deployment Direction

- The API and database are deployable independently.
- Environments: development, staging, production.
- CI/CD will build, test, and deploy automatically (plan in [`.github/workflows/README.md`](../../.github/workflows/README.md)).
- Configuration is environment-driven via environment variables.

## Decisions & Open Questions

| Topic | Decision / Question | Status |
| --- | --- | --- |
| Technology stack | Not yet selected | Open — Day 2 |
| Database engine | Relational, exact engine to be selected | Open — Day 2 |
| Mobile approach | Native vs cross-platform | Open — Day 2 |
| Payment providers | Depends on target market | Open — Day 7 |
| Hosting | To be decided | Open — Day 10 |

Decisions will be recorded here as they are made.