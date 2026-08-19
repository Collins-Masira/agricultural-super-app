# Frontend

## Purpose

The frontend is the user-facing application for the **Agricultural Super App**. It will present the platform's MVP features to users and provide the experience defined by the official Figma design.

> **Frontend implementation: NOT STARTED.** No application code, dependencies, or technology stack exist yet. Everything below is a plan for when implementation begins.

## Planned Frontend Responsibilities

- Present the MVP screens and flows defined by the official Figma design.
- Let users register, log in, and manage their profiles.
- Let users browse and publish agricultural posts, comment, and like.
- Let users discover and follow experts and communities.
- Let users message experts and communities.
- Communicate with the backend through its API; never store authoritative data locally.

## Relationship with Backend

- The frontend consumes the backend API for all data and business logic.
- The backend is the single source of truth; the frontend only renders and submits user actions.
- Both live in the same repository but as separate application folders (`frontend/` and `backend/`).
- A shared, documented API contract will be agreed when the stack is selected.

## Figma Reference

The official UI/UX design (the visual source of truth for the frontend):

> https://www.figma.com/make/HqRJlUNybCkDNSuy0TMeQj/Agricultural-Super-App-Development

> **Note:** the Figma could not be verified from the automation environment (HTTP 403). Screens and components must be confirmed by the design owner before implementation. See `docs/design.md`.

## Planned User Experience

- Simple onboarding: registration and login.
- A content feed of agricultural posts with images.
- Profiles, including expert profiles with verification badges.
- Communities with membership and following.
- Conversations for messaging experts and communities.
- Clear, consistent patterns for common actions (post, follow, comment, like, message).

## Responsive / Mobile Direction

- Design is mobile-first: most users interact on phones, often on slow or intermittent connections.
- Layouts must adapt across phones, tablets, and desktops.
- Media and downloads should stay light for low-bandwidth conditions.
- Touch targets and text sizes must suit field use.

## Development Status

| Item | Status |
| --- | --- |
| Technology stack | Not selected |
| Application code | **NOT STARTED** |
| Screens/UI | None — planned (per Figma) |
| Figma verification | Blocked — not accessible (HTTP 403) |
| Tests | None — planned |
| CI for this folder | Planned, added after scaffolding |