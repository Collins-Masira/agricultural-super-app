# Requirements → Database Traceability

This document maps every requirement module to the actual entities in the official database diagram.

> **RESOLVED (final Day 1):** The official MVP was confirmed as a **social agricultural community platform**. The diagram's community/social schema therefore matches the MVP and is the correct foundation. The "critical finding" below is retained for historical accuracy; the earlier marketplace-style requirements are **out of MVP scope**. The current verified MVP schema is [schema.dbml](../schema.dbml).
>
> dbdiagram link (verified): https://dbdiagram.io/d/Agricultural-Super-App-6a841d04fd15a881e5a6b86a

---

## Table of Contents

- [Verified Tables in the Official Diagram](#verified-tables-in-the-official-diagram)
- [Traceability Map](#traceability-map)
- [Gap Analysis](#gap-analysis)
- [Summary](#summary)
- [Open Questions](#open-questions)

---

## Verified Tables in the Official Diagram

These 12 tables are the complete contents of the official dbdiagram. They were extracted from the diagram's actual data (not guessed).

| Table | Purpose | Key attributes |
| --- | --- | --- |
| `users` | Platform account | `id` (PK), `username` (unique), `email` (unique), `password_hash`, `role` (default `'farmer'`), `is_active`, timestamps |
| `profiles` | User profile details | `user_id` (FK, unique → users), `first_name`, `last_name`, `bio`, `location`, `profile_image_url`, `phone_number`, timestamps |
| `posts` | User-generated posts | `user_id` (FK → users), `title`, `content`, timestamps |
| `post_images` | Images attached to posts | `post_id` (FK → posts), `image_url` |
| `comments` | Comments on posts | `user_id` (FK → users), `post_id` (FK → posts), `content`, timestamps |
| `likes` | Likes on posts | `user_id` (FK), `post_id` (FK), unique `(user_id, post_id)` |
| `communities` | User-created communities | `name` (unique), `description`, `image_url`, `created_by` (FK → users), timestamps |
| `community_members` | Membership in communities | `user_id` (FK), `community_id` (FK), unique `(user_id, community_id)` |
| `user_follows` | Follow relationships | `follower_id` (FK), `following_id` (FK), unique `(follower_id, following_id)` |
| `conversations` | Private conversations | `timestamps` (refined in [schema.dbml](../schema.dbml) with `community_id` for community threads and `created_by` for the initiating user) |
| `conversation_participants` | Conversation membership | `conversation_id` (FK), `user_id` (FK), unique `(conversation_id, user_id)` |
| `messages` | Messages within conversations | `conversation_id` (FK), `sender_id` (FK), `content`, `is_read`, `created_at` |

**Relationships in the diagram:**

- `profiles.user_id` ⟷ `users.id` (one-to-one)
- `posts.user_id` → `users.id`
- `post_images.post_id` → `posts.id`
- `comments.user_id` → `users.id`; `comments.post_id` → `posts.id`
- `likes.user_id` → `users.id`; `likes.post_id` → `posts.id`
- `communities.created_by` → `users.id`
- `community_members.user_id` → `users.id`; `community_members.community_id` → `communities.id`
- `user_follows.follower_id` → `users.id`; `user_follows.following_id` → `users.id`
- `conversation_participants.conversation_id` → `conversations.id`; `conversation_participants.user_id` → `users.id`
- `messages.conversation_id` → `conversations.id`; `messages.sender_id` → `users.id`
- `conversations.created_by` → `users.id` (refinement in [schema.dbml](../schema.dbml); the initiator of the conversation)

---

## Traceability Map

For each requirement: **Requirement → Database entity/entities → Relationship → Purpose → Gaps**.

### 1. User Accounts & Authentication

| Item | Content |
| --- | --- |
| **Requirement** | FR-1.x — registration, login, roles, profiles |
| **Database entities** | `users`, `profiles` |
| **Relationship** | `profiles.user_id` ⟷ `users.id` |
| **Purpose** | Account identity and profile details; `role` column with default `'farmer'` |
| **Missing data requirements** | Role management/permissions tables; refresh tokens; no `users.profiles` separation defined for RBAC |
| **Unresolved issues** | Role is a single string column — no role/permission tables exist for full RBAC (FR-1.5, FR-1.6) |

### 2. Farmer Management

| Item | Content |
| --- | --- |
| **Requirement** | FR-2.x — farmer records, contact/location, linked farms |
| **Database entities** | None |
| **Relationship** | None |
| **Purpose** | — |
| **Missing data requirements** | A `farmers` entity (or role-based representation) with contact and location |
| **Unresolved issues** | No farmer entity exists in the official diagram |

### 3. Farm Management

| Item | Content |
| --- | --- |
| **Requirement** | FR-3.x — farms, plots, plot usage |
| **Database entities** | None |
| **Relationship** | None |
| **Purpose** | — |
| **Missing data requirements** | `farms`, `farm_plots` entities |
| **Unresolved issues** | No farm entities exist in the official diagram |

### 4. Crop Management

| Item | Content |
| --- | --- |
| **Requirement** | FR-4.x — crops per farm/plot, seasons, produce links |
| **Database entities** | None |
| **Relationship** | None |
| **Purpose** | — |
| **Missing data requirements** | `crops`, crop-season records, link to produce |
| **Unresolved issues** | No crop entities exist in the official diagram |

### 5. Livestock Management

| Item | Content |
| --- | --- |
| **Requirement** | FR-5.x — livestock inventory, type/count/health |
| **Database entities** | None |
| **Relationship** | None |
| **Purpose** | — |
| **Missing data requirements** | `livestock` entity |
| **Unresolved issues** | No livestock entity exists in the official diagram |

### 6. Agricultural Inputs

| Item | Content |
| --- | --- |
| **Requirement** | FR-6.x — supplier input listings, categories, pricing |
| **Database entities** | None |
| **Relationship** | None |
| **Purpose** | — |
| **Missing data requirements** | Input/product catalogue, categories, supplier linkage |
| **Unresolved issues** | No input entities exist in the official diagram |

### 7. Marketplace

| Item | Content |
| --- | --- |
| **Requirement** | FR-7.x — produce listings, search, listing lifecycle |
| **Database entities** | None |
| **Relationship** | None |
| **Purpose** | — |
| **Missing data requirements** | `listings`, product/produce, listing status |
| **Unresolved issues** | No marketplace entities exist in the official diagram |

### 8. Produce Management

| Item | Content |
| --- | --- |
| **Requirement** | FR-8.x — produce type/quantity/unit/condition, stock adjustment |
| **Database entities** | None |
| **Relationship** | None |
| **Purpose** | — |
| **Missing data requirements** | Produce/inventory entities with quantity and unit |
| **Unresolved issues** | No produce/inventory entities exist in the official diagram |

### 9. Buyers & Suppliers

| Item | Content |
| --- | --- |
| **Requirement** | FR-9.x — buyer and supplier profiles/catalogues |
| **Database entities** | None |
| **Relationship** | None |
| **Purpose** | — |
| **Missing data requirements** | Buyer/supplier entities or role representation |
| **Unresolved issues** | No buyer/supplier entities exist in the official diagram |

### 10. Orders & Payments

| Item | Content |
| --- | --- |
| **Requirement** | FR-10.x — orders, status lifecycle, payments, providers, history |
| **Database entities** | None |
| **Relationship** | None |
| **Purpose** | — |
| **Missing data requirements** | `orders`, `order_items`, `payments`, payment-provider records |
| **Unresolved issues** | No order/payment entities exist in the official diagram |

### 11. Agricultural Information

| Item | Content |
| --- | --- |
| **Requirement** | FR-11.x — agricultural articles and advisories |
| **Database entities** | None (*partial similarity only:* `posts` could carry content, but there is no agriculture-specific content model or categorisation) |
| **Relationship** | None |
| **Purpose** | — |
| **Missing data requirements** | Advisory/article entities with categories |
| **Unresolved issues** | `posts` is a generic social post; no agriculture content model exists |

### 12. Notifications

| Item | Content |
| --- | --- |
| **Requirement** | FR-12.x — in-app/email/SMS notifications, preferences |
| **Database entities** | None (*partial:* `messages`/`conversations` cover chat, not platform notifications) |
| **Relationship** | None |
| **Purpose** | — |
| **Missing data requirements** | `notifications`, `notification_preferences` entities |
| **Unresolved issues** | No notification entities exist; `messages` are conversation chat only |

### 13. Administration

| Item | Content |
| --- | --- |
| **Requirement** | FR-13.x — user/role/permission management, moderation, audit |
| **Database entities** | None |
| **Relationship** | None |
| **Purpose** | — |
| **Missing data requirements** | RBAC tables, moderation tables, audit log |
| **Unresolved issues** | No administration entities exist in the official diagram |

### 14. Reporting & Analytics

| Item | Content |
| --- | --- |
| **Requirement** | FR-14.x — reports, dashboards, exports |
| **Database entities** | None |
| **Relationship** | None |
| **Purpose** | — |
| **Missing data requirements** | Reporting relies on transactional entities that do not yet exist |
| **Unresolved issues** | No analytics foundation in the official diagram |

---

## Gap Analysis

### A. Requirements represented in the database

Only **User Accounts & Authentication (FR-1.x)** has partial representation:

- `users` and `profiles` cover registration, login (via `password_hash`), and profile details.
- The `role` column (default `'farmer'`) is the only agricultural-related attribute in the entire diagram.

### B. Database entities not currently represented in the requirements

The official diagram models a **community/social platform**. None of these capabilities appear in the current requirements:

- `posts`, `post_images`, `comments`, `likes` — social content feed
- `communities`, `community_members` — community groups
- `user_follows` — follow/follower network
- `conversations`, `conversation_participants`, `messages` — direct messaging/chat

This may indicate an intended **community/social module** for the platform (farmers sharing knowledge, following each other, messaging). This is documented as a discrepancy rather than silently added to the requirements.

### C. Requirements without database representation

**All agricultural modules lack database representation:**

- Farmer Management, Farm Management, Crop Management, Livestock Management
- Agricultural Inputs, Marketplace, Produce Management
- Buyers & Suppliers, Orders & Payments
- Agricultural Information, Notifications, Administration, Reporting & Analytics

### D. Conflicting relationships and assumptions

1. The previous `docs/database.md` described agricultural entities (farmer, farm, plot, crop, livestock, product, listing, order, payment, supplier, buyer, notification, role/permission). **These do not exist in the official diagram.** The documentation is being corrected to reflect the verified diagram.
2. The diagram's `role` string column conflicts with the requirements' role-based access control (FR-1.5/FR-1.6), which implies separate role/permission structures.
3. If the diagram is genuinely the intended Agricultural Super App schema, it is **incomplete or incorrect** relative to the product requirements.

---

## Summary

| Requirement module | Database coverage |
| --- | --- |
| User Accounts & Authentication | Partial (`users`, `profiles`) |
| Farmer Management | None |
| Farm Management | None |
| Crop Management | None |
| Livestock Management | None |
| Agricultural Inputs | None |
| Marketplace | None |
| Produce Management | None |
| Buyers & Suppliers | None |
| Orders & Payments | None |
| Agricultural Information | None |
| Notifications | None |
| Administration | None |
| Reporting & Analytics | None |

## Open Questions

1. Is the shared dbdiagram the intended Agricultural Super App schema, or was the wrong diagram/account shared?
2. The verified schema is a community/social model. Should the product include a community/social module (posts, communities, messaging)?
3. Should the agricultural data model (farms, crops, livestock, orders, payments, etc.) be added to the diagram, or does the mentor have a separate intended schema?