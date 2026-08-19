# Database Documentation

This document is the data-model reference for the **Agricultural Super App** (Moringa School group project).

## Purpose of the Database

The database is the single source of truth for the MVP: who users are, their profiles, agricultural posts and images, comments and likes, communities and membership, following (experts and communities), and messaging.

**MVP scope** is a social agricultural community platform:

- User registration and login
- User profiles
- Agricultural blog posts (with images)
- Comments and likes
- Agricultural communities and community membership
- Following agricultural experts/users and communities
- Messaging experts and communities
- Expert verification

Explicitly **out of MVP scope** (no tables for these): farms, crops, livestock, marketplace, products, orders, payments, weather.

## Official Database Diagram

The hosted dbdiagram (reference of record):

> https://dbdiagram.io/d/Agricultural-Super-App-6a841d04fd15a881e5a6b86a

> **Note:** the automation environment cannot modify the hosted dbdiagram. The current verified MVP schema is maintained in [schema.dbml](schema.dbml). Paste that file into dbdiagram.io to update the hosted diagram.

## Tables (13)

| Table | Purpose |
| --- | --- |
| `users` | Accounts: username, email, password hash, role, active flag |
| `profiles` | Public profile details + verification status |
| `posts` | Agricultural blog posts |
| `post_images` | Images attached to posts |
| `comments` | Comments on posts |
| `likes` | Likes on posts |
| `communities` | Agricultural communities/groups |
| `community_members` | Community membership (joined) |
| `community_follows` | Community following (not membership) |
| `user_follows` | Following between users (e.g. experts) |
| `conversations` | Conversations (peer-to-peer or community threads) |
| `conversation_participants` | Users in a conversation |
| `messages` | Messages within conversations |

## Relationships

| Relationship | Cardinality |
| --- | --- |
| `profiles.user_id` → `users.id` | 1:1 |
| `posts.user_id` → `users.id` | 1:N |
| `post_images.post_id` → `posts.id` | 1:N |
| `comments.user_id` → `users.id` | 1:N |
| `comments.post_id` → `posts.id` | 1:N |
| `likes.user_id` → `users.id` | 1:N |
| `likes.post_id` → `posts.id` | 1:N |
| `communities.created_by` → `users.id` | 1:N |
| `community_members.user_id` → `users.id` | N:M via memberships |
| `community_members.community_id` → `communities.id` | N:M via memberships |
| `community_follows.user_id` → `users.id` | N:M via follows |
| `community_follows.community_id` → `communities.id` | N:M via follows |
| `user_follows.follower_id` → `users.id` | N:M (users following users) |
| `user_follows.following_id` → `users.id` | N:M (users following users) |
| `conversations.community_id` → `communities.id` | 1:N (optional community threads) |
| `conversation_participants.conversation_id` → `conversations.id` | 1:N |
| `conversation_participants.user_id` → `users.id` | N:M via participants |
| `messages.conversation_id` → `conversations.id` | 1:N |
| `messages.sender_id` → `users.id` | 1:N |

## Expert Account Explanation

Experts are **not** a separate table or separate authentication system. An expert is a regular user whose `users.role` is set to `'expert'` (allowed values: `'farmer'`, `'expert'`, `'admin'`).

- Login and registration use the same `users` table for all roles.
- `profiles.is_verified` (boolean, default `false`) represents the expert verification badge shown on the profile.
- Following an expert uses `user_follows` exactly like following any user.

## Community Membership vs Community Following

Two distinct relationships exist between a user and a community:

| Concept | Table | Meaning |
| --- | --- | --- |
| **Membership** | `community_members` | The user has joined the community (member/participant). |
| **Following** | `community_follows` | The user follows the community for updates without joining. |

Both are many-to-many relationships with a unique constraint on `(user_id, community_id)`, preventing duplicates. They are separate actions in the UI and therefore separate tables.

## Key Constraints

- `users.username` and `users.email` unique and not null.
- `users.password_hash` not null (passwords never stored in plain text).
- `profiles.user_id` unique (one profile per user).
- Unique composite indexes:
  - `(user_id, community_id)` on `community_members`
  - `(user_id, community_id)` on `community_follows`
  - `(follower_id, following_id)` on `user_follows`
  - `(user_id, post_id)` on `likes`
  - `(conversation_id, user_id)` on `conversation_participants`
- Self-following is not allowed: `user_follows.follower_id != user_follows.following_id`.
- Delete rules (cascade/restrict) are defined in [schema.dbml](schema.dbml).

## Conventions

- Table and column names use `snake_case`; foreign keys follow `<table_singular>_id`.
- Mutable entities carry `created_at` and `updated_at`; immutable relations carry `created_at`/`joined_at`/`followed_at`.
- Accounts are deactivated via `users.is_active` rather than hard-deleted.

## Related Documents

- [Schema (DBML)](schema.dbml) — current verified MVP schema, paste-able into dbdiagram.io
- [Requirements → Database traceability](project/requirements-to-database.md)
- [Project requirements](project/requirements.md)
- [Product & data flows](product-data-flow.md)