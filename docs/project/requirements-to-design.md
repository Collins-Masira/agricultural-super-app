# Requirements → Design Traceability

This document maps each major requirement to its intended design representation.

> **IMPORTANT VERIFICATION NOTE:** The official Figma design **could not be inspected from the automation environment.**
>
> **Access update (re-attempted):** Razia confirmed Collins as **owner** of the Figma project. Re-attempts from this environment on the official `/make/` link, the `/file/` URL, the Figma REST API, and the embed endpoint all still fail: the page and API return `HTTP 403`, and the embed returns only Figma's loading shell (`is_public: false`, `requires_cookies: true`) with no design content. Design content loads client-side only via an authenticated Figma session.
>
> **No Figma screens, flows, or components were observed or verified.** Nothing in this document claims to describe the actual Figma content. Every design reference below is marked **Not verified** and must be confirmed by Collins (now an owner) against the actual Figma file in the browser.
>
> Figma link (official, unverified): https://www.figma.com/make/HqRJlUNybCkDNSuy0TMeQj/Agricultural-Super-App-Development

---

## Table of Contents

- [Status Legend](#status-legend)
- [Traceability Map](#traceability-map)
- [Requirement Coverage Summary](#requirement-coverage-summary)
- [Open Questions](#open-questions)

---

## Status Legend

| Status | Meaning |
| --- | --- |
| **Verified** | Confirmed against the actual Figma design |
| **Not verified** | Not confirmed — Figma could not be inspected |
| **Needs clarification** | Representation is ambiguous and must be confirmed by the mentor |

Because the Figma file is inaccessible from this environment, **no requirement can be marked Verified yet.**

---

## Traceability Map

For each requirement the following chain is documented:

```text
Requirement
    ↓
Figma screen/flow
    ↓
User action
    ↓
Expected system capability
```

### 1. User Accounts & Authentication (FR-1.x)

| Item | Content |
| --- | --- |
| **Requirement** | Users register, log in, log out, recover password, manage profile, roles and permissions |
| **Figma screen/flow** | **Not verified** — expected: registration, login, password recovery, profile, role-based navigation |
| **User action** | Register → verify → log in → access role-appropriate features |
| **Expected system capability** | Secure authentication and role-based access control |
| **Status** | Not verified — needs clarification |

### 2. Farmer Management (FR-2.x)

| Item | Content |
| --- | --- |
| **Requirement** | Farmer records create/view/update/deactivate, contact + location, link to farms |
| **Figma screen/flow** | **Not verified** — expected: farmer registration, farmer list, farmer detail |
| **User action** | Register as farmer → record profile → manage farms |
| **Expected system capability** | Farmer lifecycle management |
| **Status** | Not verified — needs clarification |

### 3. Farm Management (FR-3.x)

| Item | Content |
| --- | --- |
| **Requirement** | Farm registration, plots, plot usage |
| **Figma screen/flow** | **Not verified** — expected: farm form, farm list/detail, plot management |
| **User action** | Add farm → add plots → view farm overview |
| **Expected system capability** | Farm and plot management |
| **Status** | Not verified — needs clarification |

### 4. Crop Management (FR-4.x)

| Item | Content |
| --- | --- |
| **Requirement** | Crop records per farm/plot, seasons, link to produce listings |
| **Figma screen/flow** | **Not verified** — expected: crop list, crop form, season tracking |
| **User action** | Record crop → track season → list produce |
| **Expected system capability** | Crop lifecycle tracking |
| **Status** | Not verified — needs clarification |

### 5. Livestock Management (FR-5.x)

| Item | Content |
| --- | --- |
| **Requirement** | Livestock inventory per farm, type/count/health |
| **Figma screen/flow** | **Not verified** — expected: livestock list, inventory form |
| **User action** | Add livestock record → update status |
| **Expected system capability** | Livestock inventory tracking |
| **Status** | Not verified — needs clarification |

### 6. Agricultural Inputs (FR-6.x)

| Item | Content |
| --- | --- |
| **Requirement** | Supplier input listings, categories, pricing, sourcing |
| **Figma screen/flow** | **Not verified** — expected: input catalogue, supplier listing form |
| **User action** | Browse inputs → order from supplier |
| **Expected system capability** | Input catalogue and sourcing |
| **Status** | Not verified — needs clarification |

### 7. Marketplace (FR-7.x)

| Item | Content |
| --- | --- |
| **Requirement** | Produce listings, search/filter, listing lifecycle |
| **Figma screen/flow** | **Not verified** — expected: marketplace feed, listing detail, search/filter |
| **User action** | Farmer lists produce → buyer searches → views listing |
| **Expected system capability** | Marketplace discovery and listing management |
| **Status** | Not verified — needs clarification |

### 8. Produce Management (FR-8.x)

| Item | Content |
| --- | --- |
| **Requirement** | Produce type/quantity/unit/condition, inventory adjustment on orders |
| **Figma screen/flow** | **Not verified** — expected: produce list, produce form, stock views |
| **User action** | Record produce → view stock → adjust after order |
| **Expected system capability** | Produce inventory tracking |
| **Status** | Not verified — needs clarification |

### 9. Buyers & Suppliers (FR-9.x)

| Item | Content |
| --- | --- |
| **Requirement** | Buyer profiles, supplier profiles and catalogues |
| **Figma screen/flow** | **Not verified** — expected: buyer registration, supplier catalogue management |
| **User action** | Register buyer/supplier → maintain profile |
| **Expected system capability** | Buyer and supplier account management |
| **Status** | Not verified — needs clarification |

### 10. Orders & Payments (FR-10.x)

| Item | Content |
| --- | --- |
| **Requirement** | Order creation, status lifecycle, payment recording, provider integration, history |
| **Figma screen/flow** | **Not verified** — expected: checkout, order list/detail, payment screen, history |
| **User action** | Create order → pay → track fulfilment → view history |
| **Expected system capability** | Reliable ordering and payment flows |
| **Status** | Not verified — needs clarification |

### 11. Agricultural Information (FR-11.x)

| Item | Content |
| --- | --- |
| **Requirement** | Agricultural articles and advisories, categorised content |
| **Figma screen/flow** | **Not verified** — expected: content feed, article detail, categories |
| **User action** | Browse articles → read advisory |
| **Expected system capability** | Content publishing and consumption |
| **Status** | Not verified — needs clarification |

### 12. Notifications (FR-12.x)

| Item | Content |
| --- | --- |
| **Requirement** | Notifications for events, in-app/email/SMS, preferences |
| **Figma screen/flow** | **Not verified** — expected: notification centre, preference settings |
| **User action** | Receive notification → act → configure preferences |
| **Expected system capability** | Multi-channel notification delivery |
| **Status** | Not verified — needs clarification |

### 13. Administration (FR-13.x)

| Item | Content |
| --- | --- |
| **Requirement** | User/role/permission management, moderation, audit logging |
| **Figma screen/flow** | **Not verified** — expected: admin dashboard, user management, moderation queues |
| **User action** | Admin manages users → moderates content → views audit trail |
| **Expected system capability** | Platform administration |
| **Status** | Not verified — needs clarification |

### 14. Reporting & Analytics (FR-14.x)

| Item | Content |
| --- | --- |
| **Requirement** | Reports, dashboards, analytics exports |
| **Figma screen/flow** | **Not verified** — expected: analytics dashboard, report views, export controls |
| **User action** | View metrics → open report → export |
| **Expected system capability** | Reporting and analytics |
| **Status** | Not verified — needs clarification |

---

## Requirement Coverage Summary

| Requirement module | Design status |
| --- | --- |
| User Accounts & Authentication | Not verified |
| Farmer Management | Not verified |
| Farm Management | Not verified |
| Crop Management | Not verified |
| Livestock Management | Not verified |
| Agricultural Inputs | Not verified |
| Marketplace | Not verified |
| Produce Management | Not verified |
| Buyers & Suppliers | Not verified |
| Orders & Payments | Not verified |
| Agricultural Information | Not verified |
| Notifications | Not verified |
| Administration | Not verified |
| Reporting & Analytics | Not verified |

## Open Questions

1. Collins now has owner access to the Figma project. Once the design is inspected in the browser, record the verified screens/flows here. A Figma personal access token or a view-only share link would also enable programmatic verification.
2. Which screens does the Figma actually contain for each requirement module above?
3. Does the Figma design include mobile, web, or both layouts?
4. Does the Figma define reusable components, colours, typography, and spacing tokens that should be referenced in `docs/design.md`?