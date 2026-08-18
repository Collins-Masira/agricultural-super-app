# Database Direction

This document establishes the data-model direction for the **Agricultural Super App**. It is intentionally high-level for Day 1.

> No database schema, migrations, or code exist yet. The concrete schema is designed alongside the stack selection on Day 2 and recorded here as it evolves.

---

## Table of Contents

- [Design Principles](#design-principles)
- [Core Entities](#core-entities)
- [Entity Relationships](#entity-relationships)
- [Key Relationships Diagram](#key-relationships-diagram)
- [Conventions](#conventions)
- [Open Questions](#open-questions)

---

## Design Principles

1. **Relational by default.** Transactional data (users, farms, orders, payments) is best served by a relational database with strong integrity guarantees.
2. **Entity names over roles.** A user's role is a property, not a separate identity. A farmer, buyer, and supplier may all be the same underlying user.
3. **Auditability.** Entities that change over time (orders, payments) track status and timestamps.
4. **Referential integrity.** Relationships are enforced in the database where practical.
5. **Money as exact values.** Currency amounts are stored with sufficient precision for financial operations.
6. **Plenty of room to evolve.** The Day 1 model is a starting point, refined per module as each is implemented.

## Core Entities

The initial data model centres on these entities:

| Entity | Description |
| --- | --- |
| **User** | A platform account. Carries identity, contact details, and role(s). |
| **Farmer** | Agricultural producer; linked to a user and to farms. |
| **Farm** | A managed agricultural operation belonging to a farmer. |
| **FarmPlot** | A subdivision of a farm. |
| **Crop** | A crop record, optionally linked to a farm/plot and season. |
| **Livestock** | Livestock inventory records for a farm. |
| **Product** | A sellable item — produce from farms or inputs from suppliers. |
| **Listing** | A marketplace listing offering a product for sale. |
| **Order** | A buyer's order of one or more listing items. |
| **Payment** | A payment recorded against an order. |
| **Supplier** | A seller of agricultural inputs; linked to a user. |
| **Buyer** | A purchaser; linked to a user. |
| **Notification** | A communication delivered to a user (in-app, email, SMS). |
| **Role / Permission** | Role definitions and their permissions. |

## Entity Relationships

| Relationship | Cardinality | Notes |
| --- | --- | --- |
| User → Farmer | 1 to 0..1 | A user may or may not be a farmer |
| User → Buyer | 1 to 0..1 | A user may or may not be a buyer |
| User → Supplier | 1 to 0..1 | A user may or may not be a supplier |
| User → Roles | M to N | Users can hold multiple roles |
| Farmer → Farm | 1 to many | A farmer manages many farms |
| Farm → FarmPlot | 1 to many | Farms consist of plots |
| Farm → Crop | 1 to many | Crops are grown on farms |
| FarmPlot → Crop | 1 to many | Plots carry crop records |
| Farm → Livestock | 1 to many | Livestock inventory per farm |
| Product → Listing | 1 to many | A product can be listed repeatedly |
| Listing → OrderItem | 1 to many | Orders reference specific listings |
| Order → OrderItem | 1 to many | An order contains items |
| Order → Payment | 1 to many | Payments against an order |
| User → Notification | 1 to many | Notifications belong to a user |

## Key Relationships Diagram

```text
Role ──────< UserRole >────── User
                              │ 1
                       ┌──────┼────────┐
                       │1     │1       │1
                 ┌─────▼─┐ ┌──▼──┐ ┌────▼────┐
                 │Farmer │ │Buyer│ │Supplier │
                 └─────┬─┘ └─────┘ └─────────┘
                       │1
                       │
                 ┌─────▼────┐
                 │   Farm   │──1:N──► FarmPlot
                 └─────┬────┘
                       │1:N
                ┌──────┼───────┐
                ▼      ▼       ▼
             Crop  Livestock  Product ──1:N──► Listing ──1:N──► OrderItem
                                                                   │
                                            Order ◄──1:N───────────┘
                                              │1:N
                                            Payment
```

## Conventions

- Table and column names use `snake_case`.
- Primary keys are integer or UUID columns named after the table (`users.id`).
- Foreign keys follow `<table_singular>_id`.
- Timestamps: `created_at`, `updated_at`; soft delete where required.
- Enum-like values (roles, statuses) are modelled as lookup values; the concrete choice (enum vs lookup table) is decided per module.
- Financial amounts are stored as decimal with defined precision — never floating point.

## Open Questions

| Topic | Question | Decided |
| --- | --- | --- |
| Primary keys | Integer vs UUID | Day 2 |
| Database engine | Which relational engine | Day 2 |
| Geography | How farm/plot locations are stored | Day 4 |
| Order history | Full order snapshotting vs reference-only | Day 7 |
| Auditing | Soft deletes vs audit tables | Day 9 |

These will be recorded here as decisions are made.