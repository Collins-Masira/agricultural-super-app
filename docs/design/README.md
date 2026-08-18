# Design Foundation

This document establishes the design and UX direction for the **Agricultural Super App**. It describes principles and goals, not a finished interface.

> No UI exists yet. Concrete visual design (colours, typography, components) begins when the frontend stack is selected on Day 2.

---

## Table of Contents

- [Design Principles](#design-principles)
- [User Experience Goals](#user-experience-goals)
- [Accessibility](#accessibility)
- [Responsive Design](#responsive-design)
- [Mobile-First Considerations](#mobile-first-considerations)
- [Navigation Philosophy](#navigation-philosophy)
- [Dashboard Philosophy](#dashboard-philosophy)
- [Agricultural User Considerations](#agricultural-user-considerations)
- [Open Questions](#open-questions)

---

## Design Principles

1. **Simple over clever.** The interface favours clarity. Complex features are presented as simple steps.
2. **Local and familiar.** Language, units, crops, and conventions reflect the target agricultural community.
3. **Efficient on field conditions.** Common tasks (recording a farm, listing produce, placing an order) are reachable in few taps.
4. **Consistent.** Recurring patterns — lists, forms, statuses, actions — behave the same everywhere.
5. **Trustworthy.** Financial and order actions are shown clearly with confirmations, so users know what happened.
6. **Inclusive.** The app must work for users with varying technical literacy, device quality, and connectivity.

## User Experience Goals

| Goal | Description |
| --- | --- |
| Fast core tasks | Recording produce, placing an order, checking a payment — under a minute. |
| Learnable | A first-time farmer can complete core tasks without help. |
| Reassuring | Every important action gives clear, immediate feedback. |
| Low effort | Forms are short; data entry is optional wherever possible. |
| Progressive | Advanced features never block basic ones. |

## Accessibility

- Text has sufficient contrast and a readable default size.
- Touch targets are large enough for field use.
- The interface works with screen readers and keyboard/screen navigation.
- Colour is never the only signal (statuses also use text/icons).
- Labels accompany every input, not just placeholders.

## Responsive Design

- Layouts adapt across phones, tablets, and desktops.
- Tables become readable lists on small screens.
- Navigation reorganises rather than shrinking (e.g. bottom navigation on mobile, sidebar on desktop).
- Images and media scale without breaking layout.

## Mobile-First Considerations

- Most farmers will interact on phones, often on slow or intermittent connections.
- Design assumes phone-first, then scales up to larger screens.
- Offline resilience is considered for data capture where practical (e.g. draft listings).
- Downloads and media are kept light.

## Navigation Philosophy

- **Few, clear destinations.** Users should not have to understand the whole system to find their next action.
- **Task-oriented paths.** Common journeys (sell produce → list it → receive order → get paid) are connected end to end.
- **Context-appropriate menus.** A farmer sees farming/marketplace actions; a buyer sees marketplace/order actions; an admin sees management tools.
- **Predictable back paths.** Users always know where they are and how to return.

## Dashboard Philosophy

- Dashboards answer: *What happened? What needs my attention? What do I do next?*
- Show actionable summaries, not raw tables — pending orders, recent sales, alerts.
- Every metric links to the detail view behind it.
- Keep dashboards role-specific: farmer, buyer, supplier, admin, advisory officer.

## Agricultural User Considerations

- Technical literacy varies widely; the UI must not assume prior app experience.
- Units are shown in familiar local measures (bags, kilograms, hectares, acres) with clear conversions.
- Common local crops and livestock types are supported from the start.
- Language support is planned for the target audience.
- Payment and order flows are explained in plain, non-technical language.
- Offline-friendly patterns reduce frustration on unreliable networks.

## Open Questions

| Topic | Question | Decided |
| --- | --- | --- |
| Language(s) | Which languages are first-class at launch | Day 2 |
| Visual identity | Brand, colours, typography | Day 2 |
| Units | Default units and conversions | Day 4 |
| Mobile framework | Native vs cross-platform implications for UX | Day 2 |