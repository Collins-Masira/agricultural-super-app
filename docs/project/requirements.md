# Project Requirements

This document defines the requirements for the **Agricultural Super App**. It is a living reference that will be refined as the project evolves.

> **Important:** These are *requirements*, not implemented features. Nothing below is built yet. Functional requirements are organised into modules that will be implemented incrementally across the development roadmap.

---

## Table of Contents

- [Scope](#scope)
- [Functional Requirements](#functional-requirements)
  - [1. User Accounts & Authentication](#1-user-accounts--authentication)
  - [2. Farmer Management](#2-farmer-management)
  - [3. Farm Management](#3-farm-management)
  - [4. Crop Management](#4-crop-management)
  - [5. Livestock Management](#5-livestock-management)
  - [6. Agricultural Inputs](#6-agricultural-inputs)
  - [7. Marketplace](#7-marketplace)
  - [8. Produce Management](#8-produce-management)
  - [9. Buyers & Suppliers](#9-buyers--suppliers)
  - [10. Orders & Payments](#10-orders--payments)
  - [11. Agricultural Information](#11-agricultural-information)
  - [12. Notifications](#12-notifications)
  - [13. Administration](#13-administration)
  - [14. Reporting & Analytics](#14-reporting--analytics)
- [Non-Functional Requirements](#non-functional-requirements)
- [Out of Scope (Day 1)](#out-of-scope-day-1)
- [Priority & Status Legend](#priority--status-legend)

---

## Scope

The platform serves the agricultural value chain: farmers, buyers, suppliers, administrators, and advisory services. It must eventually be available on the **web** and **mobile**, backed by a shared **API** and **database**.

## Functional Requirements

### 1. User Accounts & Authentication

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| FR-1.1 | Users can register an account with their basic details. | High | Planned |
| FR-1.2 | Users can log in and log out securely. | High | Planned |
| FR-1.3 | Users can recover/reset their password securely. | Medium | Planned |
| FR-1.4 | Users have a profile with editable personal details. | Medium | Planned |
| FR-1.5 | The system supports roles: farmer, buyer, supplier, admin, advisory officer. | High | Planned |
| FR-1.6 | Access to features is controlled by role-based permissions. | High | Planned |

### 2. Farmer Management

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| FR-2.1 | Farmer records can be created, viewed, updated, and deactivated. | High | Planned |
| FR-2.2 | Farmer profiles include contact details and location information. | High | Planned |
| FR-2.3 | Farmers can be linked to one or more farms. | High | Planned |

### 3. Farm Management

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| FR-3.1 | Farms can be registered with name, size, and location. | High | Planned |
| FR-3.2 | Farms can be divided into plots. | Medium | Planned |
| FR-3.3 | Farm records can track plot usage over time. | Low | Planned |

### 4. Crop Management

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| FR-4.1 | Crops can be recorded per farm or plot. | High | Planned |
| FR-4.2 | Crop records track planting, expected harvest, and actual harvest. | Medium | Planned |
| FR-4.3 | Crop records can link to produce listings in the marketplace. | Medium | Planned |

### 5. Livestock Management

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| FR-5.1 | Livestock inventory can be recorded per farm. | Medium | Planned |
| FR-5.2 | Livestock records track type, count, and health status. | Low | Planned |

### 6. Agricultural Inputs

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| FR-6.1 | Suppliers can list agricultural inputs (seeds, fertilisers, equipment). | High | Planned |
| FR-6.2 | Inputs have categories, descriptions, and pricing. | High | Planned |
| FR-6.3 | Farmers can browse and source inputs from suppliers. | Medium | Planned |

### 7. Marketplace

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| FR-7.1 | Farmers can list produce for sale with quantity, price, and photos. | High | Planned |
| FR-7.2 | Buyers can search and filter produce listings. | High | Planned |
| FR-7.3 | Listings can be activated and deactivated. | Medium | Planned |

### 8. Produce Management

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| FR-8.1 | Produce records track product type, quantity, unit, and condition. | High | Planned |
| FR-8.2 | Produce inventory can be adjusted when orders are placed. | Medium | Planned |

### 9. Buyers & Suppliers

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| FR-9.1 | Buyers can register and maintain a profile. | High | Planned |
| FR-9.2 | Suppliers can register and manage their product catalogue. | High | Planned |

### 10. Orders & Payments

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| FR-10.1 | Buyers can create orders from marketplace listings. | High | Planned |
| FR-10.2 | Orders track status through the fulfilment lifecycle. | High | Planned |
| FR-10.3 | Payments can be recorded against orders. | High | Planned |
| FR-10.4 | The platform can integrate with external payment providers. | Medium | Planned |
| FR-10.5 | Users can view their order and payment history. | Medium | Planned |

### 11. Agricultural Information

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| FR-11.1 | The platform can publish agricultural articles and advisories. | Medium | Planned |
| FR-11.2 | Content can be categorised (crops, livestock, weather, markets). | Low | Planned |

### 12. Notifications

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| FR-12.1 | Users receive notifications for relevant events (orders, messages, advisories). | Medium | Planned |
| FR-12.2 | Notifications can be delivered via in-app, email, and SMS channels. | Medium | Planned |
| FR-12.3 | Users can manage their notification preferences. | Low | Planned |

### 13. Administration

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| FR-13.1 | Administrators can manage users, roles, and permissions. | High | Planned |
| FR-13.2 | Administrators can moderate listings and content. | Medium | Planned |
| FR-13.3 | The platform supports audit logging of administrative actions. | Medium | Planned |

### 14. Reporting & Analytics

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| FR-14.1 | Reports cover marketplace activity, orders, and payments. | Medium | Planned |
| FR-14.2 | Dashboards provide high-level platform metrics. | Medium | Planned |
| FR-14.3 | Analytics support export of reports. | Low | Planned |

---

## Non-Functional Requirements

### Security

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| NFR-1.1 | Passwords are stored using a strong, modern hashing algorithm. | High | Planned |
| NFR-1.2 | Authentication uses secure, short-lived tokens with refresh support. | High | Planned |
| NFR-1.3 | All production traffic is served over HTTPS. | High | Planned |
| NFR-1.4 | Secrets are stored in environment variables or a secret manager — never in code. | High | Planned |
| NFR-1.5 | Input validation and sanitisation are applied at the API boundary. | High | Planned |
| NFR-1.6 | Role-based access control is enforced server-side. | High | Planned |
| NFR-1.7 | Sensitive data is encrypted at rest where required. | Medium | Planned |

### Scalability

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| NFR-2.1 | The backend is structured so it can scale horizontally (stateless services). | High | Planned |
| NFR-2.2 | The database design supports indexing of common query patterns. | High | Planned |
| NFR-2.3 | The architecture supports separation of background jobs from request handling. | Medium | Planned |

### Performance

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| NFR-3.1 | API responses are fast and paginated for list endpoints. | High | Planned |
| NFR-3.2 | The application remains responsive on low-end devices and slow networks. | Medium | Planned |
| NFR-3.3 | Caching is used where it reduces repeated expensive work. | Low | Planned |

### Reliability

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| NFR-4.1 | The system degrades gracefully when external services are unavailable. | Medium | Planned |
| NFR-4.2 | Critical operations (orders, payments) are handled idempotently. | High | Planned |
| NFR-4.3 | Data is backed up and restorable. | High | Planned |

### Maintainability

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| NFR-5.1 | Code follows consistent, documented conventions. | High | Planned |
| NFR-5.2 | Automated tests cover critical logic and regression-prone paths. | High | Planned |
| NFR-5.3 | Documentation is kept in sync with the codebase. | Medium | Planned |

### Observability

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| NFR-6.1 | Structured logging is used across the backend. | High | Planned |
| NFR-6.2 | Application metrics (error rates, latencies) are collected. | Medium | Planned |
| NFR-6.3 | Errors are captured and reported centrally. | Medium | Planned |

### Data Privacy

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| NFR-7.1 | Personal data is collected only for defined purposes. | High | Planned |
| NFR-7.2 | Users can request deletion or export of their data. | Low | Planned |
| NFR-7.3 | Data access follows the principle of least privilege. | High | Planned |

### Availability

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| NFR-8.1 | The platform targets high availability for core services. | Medium | Planned |
| NFR-8.2 | Planned maintenance windows are communicated to users. | Low | Planned |

---

## Verification Status & Discrepancies

This section records what has been verified against the official design references on Day One.

### Database (verified)

The official database diagram was inspected and its actual schema verified:

- **Reference:** https://dbdiagram.io/d/Agricultural-Super-App-6a841d04fd15a881e5a6b86a
- **Finding:** the diagram is named "Agricultural Super App" but its schema is a **community/social model** (`users`, `profiles`, `posts`, `post_images`, `comments`, `likes`, `communities`, `community_members`, `user_follows`, `conversations`, `conversation_participants`, `messages`).
- **Coverage:** only **User Accounts & Authentication (FR-1.x)** is partially represented (via `users` and `profiles`).
- **Gap:** all agricultural modules (farmers, farms, crops, livestock, inputs, marketplace, produce, orders, payments, notifications, administration, reporting) have **no database representation** in the official diagram.

Full analysis: [requirements-to-database.md](requirements-to-database.md)

### Design (unverified)

- **Reference:** https://www.figma.com/make/HqRJlUNybCkDNSuy0TMeQj/Agricultural-Super-App-Development
- **Finding:** the Figma design **could not be inspected from the automation environment** (HTTP 403 on page and API; the embed returns an auth-gated loading shell only). Owner access was granted to Collins (confirmed by Razia), so inspection is possible from his browser but has not been performed/recorded yet.
- **Implication:** design traceability is documented but every entry is marked **Not verified** until the Figma can be reviewed.

Full analysis: [requirements-to-design.md](requirements-to-design.md)

### Community/social tables present in the database but absent from requirements

The official diagram contains community/social tables (`posts`, `comments`, `likes`, `communities`, `user_follows`, `conversations`, `messages`) that do not correspond to any current requirement. Per project rules, this is **documented as a discrepancy** rather than silently added as requirements. If the product is intended to include a community/social module, it must be confirmed and then added to this document with defined requirements.

### Open items requiring mentor clarification

1. Is the shared dbdiagram the intended Agricultural Super App schema, or was the wrong diagram shared?
2. Should the product include a community/social module (posts, communities, messaging)?
3. How should the agricultural data model (farms, crops, orders, payments, etc.) be represented in the official diagram?
4. Collins now has Figma owner access (per Razia); he must inspect the design in the browser and record the verified screens. A Figma personal access token or view-only share link would also enable programmatic verification.

---

## Out of Scope (Day 1)

During Day 1 the following are explicitly **not** in scope:

- Selecting the concrete technology stack.
- Writing application source code.
- Creating database schemas or migrations.
- Building UI or API endpoints.
- Configuring CI beyond documenting the plan.

These items begin on Day 2 of the [roadmap](roadmap.md).

## Priority & Status Legend

| Value | Meaning |
| --- | --- |
| **Priority** | High / Medium / Low — relative importance of the requirement |
| **Status** | Planned / In Progress / Completed |