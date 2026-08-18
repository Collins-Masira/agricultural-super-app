# Product & Data Flows

This document connects the product requirements to user flows and to the database. It shows how a user action moves through the system.

> **VERIFICATION NOTES:**
>
> - **Figma:** The official design could not be inspected from this environment (`HTTP 403`). User flows below are derived from the **requirements** and marked **not design-verified**.
> - **Database:** The official dbdiagram was inspected. Its current schema is a **community/social model** and does **not** contain the agricultural entities used in the flows below. Every flow that needs database entities not present in the official diagram is marked **missing database support**.

---

## Table of Contents

- [Flow Legend](#flow-legend)
- [1. Onboarding & Authentication](#1-onboarding--authentication)
- [2. Farmer Farm & Crop Management](#2-farmer-farm--crop-management)
- [3. Marketplace & Selling](#3-marketplace--selling)
- [4. Ordering & Payment](#4-ordering--payment)
- [5. Communication & Notifications](#5-communication--notifications)
- [6. Administration & Reporting](#6-administration--reporting)
- [Traceability Matrix](#traceability-matrix)

---

## Flow Legend

| Marker | Meaning |
| --- | --- |
| ✅ Requirement | The step is backed by a requirement in `docs/project/requirements.md` |
| 🎨 Not design-verified | The step's screen/flow has not been verified against Figma |
| 🗄️ DB missing | The step needs database entities that do not exist in the official diagram |

---

## 1. Onboarding & Authentication

```text
User
 ↓
Registration / Login            ✅ FR-1.1, FR-1.2   🎨 not design-verified
 ↓
Profile setup                   ✅ FR-1.4           🎨 not design-verified
 ↓
Role-based home/dashboard       ✅ FR-1.5, FR-1.6   🎨 not design-verified
```

| Step | Requirement | Database |
| --- | --- | --- |
| Registration / Login | FR-1.1, FR-1.2 | `users` ✅ present |
| Profile setup | FR-1.4 | `profiles` ✅ present |
| Role-based dashboard | FR-1.5, FR-1.6 | `users.role` ✅ present (but no RBAC tables — see gap) |

## 2. Farmer Farm & Crop Management

```text
Farmer
 ↓
Register farmer record          ✅ FR-2.1   🎨 not design-verified   🗄️ DB missing
 ↓
Register farm                   ✅ FR-3.1   🎨 not design-verified   🗄️ DB missing
 ↓
Add farm plot                  ✅ FR-3.2   🎨 not design-verified   🗄️ DB missing
 ↓
Record crop / season           ✅ FR-4.1–4.2   🎨 not design-verified   🗄️ DB missing
 ↓
Record livestock               ✅ FR-5.1–5.2   🎨 not design-verified   🗄️ DB missing
```

No database entity exists for farmer, farm, plot, crop, or livestock in the official diagram.

## 3. Marketplace & Selling

```text
Farmer
 ↓
Record produce                  ✅ FR-8.1   🎨 not design-verified   🗄️ DB missing
 ↓
Create marketplace listing      ✅ FR-7.1   🎨 not design-verified   🗄️ DB missing
 ↓
Activate/deactivate listing     ✅ FR-7.3   🎨 not design-verified   🗄️ DB missing
 ↓
Buyer searches & filters        ✅ FR-7.2   🎨 not design-verified   🗄️ DB missing
 ↓
Buyer views listing detail      ✅ FR-7.2   🎨 not design-verified   🗄️ DB missing
```

No database entity exists for product, produce, listing, buyer, or supplier in the official diagram.

## 4. Ordering & Payment

```text
Buyer
 ↓
Create order from listing       ✅ FR-10.1   🎨 not design-verified   🗄️ DB missing
 ↓
Order status tracking           ✅ FR-10.2   🎨 not design-verified   🗄️ DB missing
 ↓
Payment recorded / paid         ✅ FR-10.3, FR-10.4   🎨 not design-verified   🗄️ DB missing
 ↓
Stock adjusted                  ✅ FR-8.2   🎨 not design-verified   🗄️ DB missing
 ↓
Order & payment history         ✅ FR-10.5   🎨 not design-verified   🗄️ DB missing
```

No database entity exists for order, order item, or payment in the official diagram.

## 5. Communication & Notifications

```text
User / Farmer
 ↓
Platform event occurs            ✅ FR-12.1   🎨 not design-verified   🗄️ DB missing
 ↓
Notification generated          ✅ FR-12.1   🎨 not design-verified   🗄️ DB missing
 ↓
Delivered (in-app/email/SMS)    ✅ FR-12.2   🎨 not design-verified   🗄️ DB missing
 ↓
User manages preferences        ✅ FR-12.3   🎨 not design-verified   🗄️ DB missing
```

The official diagram has `conversations`/`messages` (chat) but **no notification entities**.

**Separate note — community/social flow (found in the database but not in requirements):**

```text
User
 ↓
Create/join community           🗄️ communities, community_members ✅ present
 ↓
Create post / comment / like    🗄️ posts, post_images, comments, likes ✅ present
 ↓
Follow users                    🗄️ user_follows ✅ present
 ↓
Direct message                  🗄️ conversations, messages ✅ present
```

These flows exist only in the database today. They are documented as a discrepancy and **not** added to the requirements without mentor confirmation.

## 6. Administration & Reporting

```text
Administrator
 ↓
Manage users, roles, permissions  ✅ FR-13.1   🎨 not design-verified   🗄️ DB missing
 ↓
Moderate listings/content         ✅ FR-13.2   🎨 not design-verified   🗄️ DB missing
 ↓
View dashboards & reports         ✅ FR-14.1–14.2   🎨 not design-verified   🗄️ DB missing
 ↓
Export reports                    ✅ FR-14.3   🎨 not design-verified   🗄️ DB missing
```

No database entity exists for roles/permissions, moderation, audit, or reporting in the official diagram.

---

## Traceability Matrix

| Module | Requirement | Figma status | Database status |
| --- | --- | --- | --- |
| Onboarding & Authentication | FR-1.x | Not verified | `users`, `profiles` present |
| Farmer & Farm Management | FR-2.x, FR-3.x | Not verified | Missing |
| Crop & Livestock | FR-4.x, FR-5.x | Not verified | Missing |
| Inputs | FR-6.x | Not verified | Missing |
| Marketplace & Produce | FR-7.x, FR-8.x | Not verified | Missing |
| Buyers & Suppliers | FR-9.x | Not verified | Missing |
| Orders & Payments | FR-10.x | Not verified | Missing |
| Agricultural Information | FR-11.x | Not verified | Missing |
| Notifications | FR-12.x | Not verified | Missing (chat only) |
| Administration | FR-13.x | Not verified | Missing |
| Reporting & Analytics | FR-14.x | Not verified | Missing |
| *Community/social (not a requirement)* | — | Not verified | Present (posts, communities, messaging) |