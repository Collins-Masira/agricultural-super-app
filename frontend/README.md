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
│   │   ├── auth/             # Login, registration, auth context, protected routes
│   │   ├── layout/           # App shell: header nav, mobile bottom nav
│   │   ├── posts/            # Feed, post detail, create post, likes, comments
│   │   ├── experts/          # Expert discovery, expert profiles, follow/unfollow
│   │   └── profile/          # Current user profile, edit profile
│   ├── lib/                  # HTTP client, formatting helpers
│   ├── services/             # API service layer (auth, posts, experts, profiles)
│   ├── store/                # Redux store and slices (auth, posts, experts, profile)
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
- `src/store/slices/` — slices for auth (session + current user), posts (feed, post detail, user posts, likes, comments), experts (expert discovery, profiles, follow/unfollow), and profile (viewing/editing a profile).
- `src/store/hooks.js` — typed hooks `useAppDispatch` / `useAppSelector`.
- The auth layer (`src/features/auth/AuthContext.jsx`) sits on top of the `auth` slice and keeps the same `useAuth()` API the pages rely on (`status`, `user`, `login`, `register`, `logout`, `refreshProfile`).

Slices call the existing service layer (`src/services`), which routes to the mock API by default and to the real Flask API once the backend contract is confirmed.

## Backend API Integration

The backend is being developed separately. To avoid inventing production APIs, the frontend uses an **isolated mock data layer** by default:

- `src/services/*.js` — service functions (the boundary the UI uses).
- `src/services/mocks/` — mock implementations, clearly marked as development-only.
- `VITE_USE_MOCKS=true` (default) routes the services to the mock layer; set it to `false` (and `VITE_API_BASE_URL`) once the backend API contract is confirmed.

Service endpoint paths are conventional placeholders and must be reconciled with the backend team's actual API contract before they are enabled. See `src/services/experts.service.js` and `src/services/posts.service.js` for the expected shapes.

## Design

The Figma file (https://www.figma.com/make/HqRJlUNybCkDNSuy0TMeQj/Agricultural-Super-App-Development) could not be verified from the automation environment (HTTP 403). The current UI uses an accessible, mobile-first baseline derived from `docs/design.md`:

- Design tokens (colour, spacing, type, radii) in `src/styles/tokens.css`.
- Desktop: top header with horizontal navigation.
- Mobile: bottom navigation bar.
- Verification badges, cards, empty/loading/error states per the design documentation.

**Reconcile tokens/components with the verified Figma file when the design is inspected and recorded in `docs/design.md`.**

## Scope

Owned by this frontend: foundation, routing, layout, auth UI, profiles, expert discovery/profiles, posts, likes, comments, follow/unfollow, reusable UI components, loading/empty/error states.

Communities and messaging are owned by a separate frontend developer and are not implemented here.

## Development Status

| Item | Status |
| --- | --- |
| Technology stack | Selected (React + JS + Redux Toolkit + Vite) |
| Application code | Foundation + core MVP screens implemented |
| Mock API layer | Present (development only) |
| Real API integration | Blocked — backend API contract not yet available |
| Figma verification | Blocked — not accessible (HTTP 403) |
| Tests | None — planned |
| Frontend CI | Planned — add `frontend-ci.yml` after stack review |