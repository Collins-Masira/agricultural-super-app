# Frontend

## Purpose

The frontend is the user-facing application for the **Agricultural Super App**. It presents the MVP features to users following the official Figma design (see `docs/design.md`).

## Stack

| Item | Choice |
| --- | --- |
| Build tool | Vite 5 |
| Framework | React 18 (SPA) |
| Language | JavaScript (ES modules) |
| State management | Redux Toolkit (`@reduxjs/toolkit`) + `react-redux` |
| Routing | React Router v6 |
| Styling | Plain CSS with design tokens (`src/styles/tokens.css`) — no UI framework |
| Package manager | npm |

The stack was selected at the start of Stage 2 (see `docs/project/roadmap.md`). The frontend is a client-side SPA that consumes the backend API; it does not render server-side.

## Getting Started

```bash
cd frontend
npm install
npm run dev
```

Commands:

- `npm run dev` — start the Vite dev server (default http://localhost:5173)
- `npm run build` — build for production
- `npm run preview` — preview the production build

## Folder Structure

```text
frontend/
├── src/
│   ├── components/ui/        # Reusable UI primitives (Button, Input, Card, Modal, …)
│   ├── components/icons.jsx  # Inline SVG icons
│   ├── config/env.js         # Runtime config from environment variables
│   ├── features/             # Feature modules, each with pages/ and components/
│   │   ├── auth/             # Login, registration, password reset, auth context, protected routes
│   │   ├── layout/           # App shell: header nav, mobile bottom nav
│   │   ├── posts/            # Feed, post detail, create post, likes, comments
│   │   ├── experts/          # Expert discovery, expert profiles, follow/unfollow, messaging entry point
│   │   ├── communities/      # Community discovery, creation, membership
│   │   ├── messaging/        # Conversations list + thread view
│   │   ├── assistant/        # AI Farming Assistant chat page
│   │   └── profile/          # Current user profile, edit profile
│   ├── lib/                  # HTTP client, normalize.js (backend<->frontend shape mapping), formatting helpers
│   ├── services/             # API service layer (auth, posts, experts, profiles, communities, messages, ai)
│   ├── store/                # Redux store and slices (auth, posts, experts, profile, communities, messages)
│   ├── styles/               # Design tokens and global styles
│   └── types/domain.js       # Domain shapes (JSDoc) mirroring docs/schema.dbml
├── .env.example              # Documented environment variables
├── index.html
├── vite.config.js
└── package.json
```

## State Management

State is managed with Redux Toolkit:

- `src/store/store.js` — the configured Redux store.
- `src/store/slices/` — slices for auth, posts, experts, profile, communities, and messaging.
- `src/store/hooks.js` — typed hooks `useAppDispatch` / `useAppSelector`.
- The auth layer (`src/features/auth/AuthContext.jsx`) sits on top of the `auth` slice and keeps the same `useAuth()` API the pages rely on.

Slices call the service layer (`src/services`), which talks to the real Flask API by default.

## Backend API Integration

The frontend talks to the real backend (`backend/docs/API.md` is the authoritative contract). Set `VITE_API_BASE_URL` in `.env.local` to the backend's `/api` URL (defaults to `http://localhost:5000/api`, matching `flask run`'s default port).

- `src/services/*.js` — service functions (the boundary the UI uses), one per backend resource (auth, users/profile, posts, experts, communities, messages, AI assistant).
- `src/lib/normalize.js` — maps the backend's snake_case JSON shapes onto the frontend's camelCase `{user, profile}`-style domain shapes (see `src/types/domain.js`), so components never touch raw API responses directly.
- `src/lib/http.js` — the fetch client; reads the JWT from `localStorage`, throws a normalized `{status, message, details}` error on non-2xx responses, and force-logs-out the session on a 401 from an authenticated request.
- `src/services/mocks/` — an isolated, optional in-repo mock data layer for UI work without a running backend. Set `VITE_USE_MOCKS=true` to use it for auth/posts/profile/experts (communities, messaging, and the AI assistant always call the real API, since they were built directly against it).

## Design

The Figma file (https://www.figma.com/make/HqRJlUNybCkDNSuy0TMeQj/Agricultural-Super-App-Development) could not be verified from the automation environment (HTTP 403). The current UI uses an accessible, mobile-first baseline derived from `docs/design.md`:

- Design tokens (colour, spacing, type, radii) in `src/styles/tokens.css`.
- Desktop: top header with horizontal navigation.
- Mobile: bottom navigation bar.
- Verification badges, cards, empty/loading/error states per the design documentation.

## Scope

Routing, layout, auth (register/login/logout/forgot-reset password/change-password, strong
password policy with live feedback), role-based admin dashboard (stats, user management, content
moderation — UX-only hiding; the real security boundary is backend-enforced), profiles, expert
discovery/profiles, posts (feed/create/detail/likes/comments) with real device image uploads
(file picker, not URL paste), follow/unfollow, communities (discovery/create/join/leave), direct
messaging (conversations + threads), an AI Farming Assistant, and the shared UI
component/design-token system.

## Development Status

| Item | Status |
| --- | --- |
| Technology stack | React + JS + Redux Toolkit + Vite |
| Application code | Full MVP implemented and wired to the real backend |
| Real API integration | Done — see `backend/docs/API.md` for the contract |
| Admin dashboard (`/admin/*`, role-gated) | Implemented — `src/features/admin/` |
| Real image uploads | Implemented — `src/components/ui/ImageUploader.jsx`, `src/services/uploads.service.js` |
| Mock API layer | Present (optional, dev-only; `VITE_USE_MOCKS=true`) |
| Figma verification | Not verified (HTTP 403 in the automation environment); current UI is an original accessible, mobile-first design system |
| Tests | None on the frontend — see `backend/` for the automated test suite |
| Frontend CI | Not yet configured |
