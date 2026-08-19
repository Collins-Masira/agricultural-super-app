# Architecture Overview

This document describes the architectural direction of the **Agricultural Super App**.

> **Technology stack is NOT selected yet.** Concrete technology decisions land on Day 2 of the [roadmap](project/roadmap.md). This document describes layers and direction, not a concrete stack.

---

## Table of Contents

- [Architecture Principles](#architecture-principles)
- [High-Level System View](#high-level-system-view)
- [Layered Architecture](#layered-architecture)
  - [1. Clients](#1-clients)
  - [2. API Layer](#2-api-layer)
  - [3. Application Services](#3-application-services)
  - [4. Business / Domain Logic](#4-business--domain-logic)
  - [5. Database](#5-database)
- [Future Integrations](#future-integrations)
- [External Services & Adapters](#external-services--adapters)
- [Planned Components](#planned-components)
- [Deployment Direction](#deployment-direction)
- [Product & Data Flows](#product--data-flows)
- [Decisions & Open Questions](#decisions--open-questions)

---

## Architecture Principles

1. **Client-server separation.** Web and mobile clients communicate with a shared backend API. Business logic lives in the backend, never duplicated in clients.
2. **Modular services.** The application is organised into modules aligned with requirements (accounts, farms, marketplace, orders, payments, etc.).
3. **Stateless where possible.** Services can be scaled horizontally without shared local state.
4. **External dependencies isolated.** Payment, SMS, email, maps, and other external providers sit behind replaceable adapters/interfaces.
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
                     │          BUSINESS / DOMAIN LOGIC          │
                     │  Rules · Workflows · Calculations ·       │
                     │  Idempotency · Status transitions         │
                     └────────────────────┬─────────────────────┘
                                          │
                     ┌────────────────────▼─────────────────────┐
                     │            RELATIONAL DATABASE            │
                     └──────────────────────────────────────────┘
```

## Layered Architecture

### 1. Clients

- **Web application** — administrative, marketplace, and management interface.
- **Mobile application** — farmer- and buyer-facing experience for field use.
- Both clients consume the same API; platform behaviour stays consistent.
- The **Figma design is the visual source of truth** for frontend implementation (see [docs/design.md](design.md)).

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

### 4. Business / Domain Logic

A distinct layer where the rules of the platform live:

- Status transitions (order lifecycle, listing lifecycle).
- Financial calculations and monetary precision.
- Idempotency guarantees for critical operations (orders, payments).
- Permissions and role checks.
- Validation rules that cannot be expressed purely at the API boundary.

This layer is kept independent of the API transport and the database so rules can be tested in isolation.

### 5. Database

- A relational database is the primary store for transactional data.
- The data model follows the official diagram: see [docs/database.md](database.md).
- **Important:** the current official diagram models a community/social schema and does not yet represent the agricultural requirements. Resolving this is a Day One blocker documented in the database docs.

## Future Integrations

These services will be integrated as features are built:

```text
Payment Providers  → orders and payments
SMS / Email        → notifications and communication
Maps / Location    → farm locations and delivery
Agricultural APIs  → weather, market prices, advisories
Notification
Services           → in-app and push notifications
```

## External Services & Adapters

All external services are designed behind **replaceable adapters/interfaces**:

- Each integration defines an interface (e.g. `PaymentProvider`, `EmailSender`, `SmsSender`, `Geocoder`, `PushNotifier`).
- Concrete implementations wrap a specific provider.
- Swapping a provider only requires a new implementation of the interface — no changes to business logic.
- Fallback behaviour is defined for provider outages (queue, retry, degrade gracefully).

## Planned Components

| Component | Purpose | Stage |
| --- | --- | --- |
| Backend API | Serves all clients | 2 |
| Frontend application | Web interface (per Figma) | 2 |
| Mobile application | Field/mobile interface (per Figma) | 2+ |
| Database | Primary data store | 2 |
| Job/queue system | Background work | 5+ |
| Object storage | Produce photos, documents | 6 |
| Payment integration | Order payments (adapter) | 7 |
| Notification services | Email/SMS/push (adapters) | 8 |
| Analytics/reporting | Dashboards | 9 |

## Deployment Direction

- The API and database are deployable independently.
- Environments: development, staging, production.
- CI/CD will build, test, and deploy automatically (plan in [`.github/workflows/ci-cd.md`](../.github/workflows/ci-cd.md)).
- Configuration is environment-driven via environment variables.

## Product & Data Flows

The connection between requirements, user flows, and the database is documented in [product-data-flow.md](product-data-flow.md).

## Decisions & Open Questions

| Topic | Decision / Question | Status |
| --- | --- | --- |
| Technology stack | Not yet selected | Open — Day 2 |
| Database engine | Relational, exact engine to be selected | Open — Day 2 |
| Mobile approach | Native vs cross-platform | Open — Day 2 |
| Payment providers | Depends on target market | Open — Day 7 |
| Hosting | To be decided | Open — Day 10 |
| Database schema vs requirements | Official diagram does not represent agricultural data | **Blocking — mentor clarification** |

Decisions will be recorded here as they are made.