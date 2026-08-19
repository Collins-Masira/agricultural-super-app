# Design Documentation

This document establishes the design and UX direction for the **Agricultural Super App** (Moringa School group project).

## Official Figma Design

> **Figma is the visual source of truth for frontend implementation.**

The official product/UI/UX design lives in Figma:

> https://www.figma.com/make/HqRJlUNybCkDNSuy0TMeQj/Agricultural-Super-App-Development

### Purpose of the UI Design

The Figma design defines the screens, flows, and visual language for the Agricultural Super App MVP: how users register and log in, view and edit profiles, browse agricultural posts, follow experts and communities, comment, like, and message — and how experts and verified accounts are presented.

### MVP Scope

The UI design covers the Agricultural Super App MVP:

- Registration / login
- User profiles (view/update)
- Agricultural blog posts with images
- Comments and likes
- Communities and community membership
- Following agricultural experts/users and communities
- Messaging experts and communities
- Expert profile/verification representation

### Relationship Between UI and Database

Every user-facing feature has a corresponding data requirement:

| UI / MVP feature | Database support |
| --- | --- |
| Registration / login | `users` |
| Profiles + expert verification | `profiles` (incl. `is_verified`) |
| Blog posts | `posts` |
| Post images | `post_images` |
| Comments | `comments` |
| Likes | `likes` |
| Communities | `communities` |
| Community membership | `community_members` |
| Following experts/users | `user_follows` |
| Following communities | `community_follows` |
| Messaging | `conversations`, `conversation_participants`, `messages` |

The full mapping is in [requirements-to-design.md](project/requirements-to-design.md) and the data model in [docs/database.md](database.md).

### Verification Status

> **Access update (re-attempted twice):** Razia has confirmed Collins was added as **owner** of the Figma project. The design was re-attempted from the automation environment on the official link, the `/file/` URL, the Figma REST API, and the embed endpoint:
>
> - Direct page (`/make/...`) and `/file/...` URL: **HTTP 403**.
> - Figma REST API (`api.figma.com/v1/files/...`): **HTTP 403** (requires a personal access token).
> - Embed endpoint: returns only Figma's loading shell — the config reports `is_public: false` and `requires_cookies: true`, and the page contains **no design content** (screens are loaded client-side by an authenticated session).
>
> A second, newly-provided link (`?t=ezpX8GbsHaYiw3AF-1`) was also re-tested. It resolves to the **same file key** (`HqRJlUNybCkDNSuy0TMeQj`) and returns the identical result (403; auth-gated loading shell). The access constraint is on the file/session, not on the share link.
>
> **No Figma screens, components, or visual tokens were verified from the actual file in this environment.** The owner access applies to Collins's Figma account, not to this automation environment. Collins must inspect the design in the browser (where his owner access works) and record the verified results here before this section can be marked verified.

### VERIFIED FROM FIGMA vs INFERRED FROM REQUIREMENTS

To avoid mixing evidence:

- **VERIFIED FROM FIGMA:** *None yet.* No screens, flows, or UI patterns have been confirmed against the actual file from this environment (access requires an authenticated Figma session/token).
- **INFERRED FROM REQUIREMENTS:** Everything below (Product Design Purpose, Target Users, User Journeys, Main Screens, Design Principles, Accessibility, Components, Responsive direction) describes the *intended* design direction derived from the MVP requirements. These are **NOT** confirmed Figma content.

When the Figma is inspected (by Collins, as owner), each entry must be re-labelled to **VERIFIED FROM FIGMA** with the matching screen/page reference.

## Product Design Purpose

The design must make the agricultural community experience feel simple and trustworthy: a farmer finding an expert, an expert publishing advice, and users exchanging knowledge — through one consistent, accessible interface.

## Target Users

- **Farmers** — read/write agricultural posts, follow experts and communities, message them.
- **Agricultural experts** — verified profiles, publish posts, answer questions.
- **General users** — browse content, follow, comment, like, message.

## Main User Journeys

| Journey | Steps |
| --- | --- |
| Onboard & log in | Register → verify → log in |
| Discover content | Browse posts → follow experts/communities |
| Publish | Create a post → attach images |
| Engage | Comment → like |
| Communicate | Open conversation → message an expert/community |
| Profile | View/edit profile → view verification status |

> Journey screens are **not verified** against the actual Figma until access is provided.

## Main Screens (intended MVP scope)

- Landing/home, login, registration
- Profile view/edit
- Posts feed, post detail, create post (with image upload)
- Comments and likes on posts
- Communities list/detail, membership, following
- Experts directory, expert profile with verification badge
- Conversations / messages
- Notifications (if present in the UI — not confirmed)

## Design Principles

1. **Simple over clever.** Complex features are presented as simple steps.
2. **Local and familiar.** Language and content reflect the target agricultural community.
3. **Efficient.** Common tasks (post, follow, message) are reachable in few taps.
4. **Consistent.** Recurring patterns behave the same everywhere.
5. **Trustworthy.** Verification badges and actions are shown clearly.
6. **Inclusive.** Works for varying technical literacy, device quality, and connectivity.

## Mobile-First Considerations

- Most users will interact on phones, often on slow or intermittent connections.
- Design is phone-first, scaling up to larger screens.
- Offline resilience is considered for data capture where practical (e.g. draft posts).
- Media and downloads are kept light.

## Accessibility

- Sufficient contrast and readable default text size.
- Large touch targets for field use.
- Screen-reader and keyboard/screen navigation support.
- Colour is never the only signal (verification status also uses text/icons).
- Labels accompany every input, not just placeholders.

## Low-Literacy Usability

- The UI must not assume prior app experience.
- Plain, non-technical language for actions and confirmations.
- Icons and imagery support text, never replace it.

## Reusable Components (expected, pending Figma confirmation)

- Buttons, inputs, forms with validation states
- Cards (posts, communities, expert profiles)
- Status/verification badges, empty/loading/error states
- Lists, tables, modals, bottom sheets
- Navigation (bottom tabs on mobile, sidebar on desktop)

## Responsive Design Direction

- Layouts adapt across phones, tablets, and desktops.
- Tables become readable lists on small screens.
- Navigation reorganises rather than shrinking.
- Images and media scale without breaking layout.

## Related Documents

- [Requirements → Design traceability](project/requirements-to-design.md)
- [Project requirements](project/requirements.md)
- [Database documentation](database.md)