# Technical Debt Register

Each entry: description, impact, recommended solution, priority, target milestone.
Do not delete resolved items — move them to a "Resolved" section with the
resolving commit/PR reference so history isn't lost.

---

## Open

### 3. `role` has no database-level enforcement

**Description:** `UserSchema.role` is now restricted to `farmer`/`expert`
via `validate.OneOf(...)` (added while building auth — see
`app/schemas/user_schema.py`), which closes the privilege-escalation
path through the registration API. But the `users.role` column itself is
still a free-text `varchar(30)` with no `CheckConstraint` or enum type at
the database level. Any code path that writes to this column outside
the schema (a future admin script, a bulk import, a bug in a new
endpoint) is not protected by that validation.

**Impact:** Low today (registration is currently the only write path to
`role`), but the protection is API-layer-only, not defense-in-depth.

**Recommended solution:** Add `db.CheckConstraint("role IN ('farmer', 'expert', 'admin')", name="valid_role")` (or a native Postgres `ENUM` type) at the model level, via migration.

**Priority:** Medium.

**Target milestone:** Before any second write path to `role` is built (e.g. an admin-promotion endpoint).

### 4. No admin bootstrap mechanism

**Description:** `role == "admin"` is checked throughout the service
layer as an authorization override, but there is currently no way to
create an admin account except direct database access
(`UPDATE users SET role = 'admin' WHERE id = ...`).

**Impact:** Low — expected for MVP — but worth having a deliberate answer
before this goes anywhere near production.

**Recommended solution:** A CLI command (`flask create-admin`) or a
one-time seed script, not an HTTP endpoint (an admin-promotion endpoint
would just recreate the same privilege-escalation risk closed in item 3
above, one layer up).

**Priority:** Low.

**Target milestone:** Before production deployment.

### 5. JWTs cannot be revoked

**Description:** Access tokens are stateless and signed, verified only
against `JWT_SECRET_KEY` and their own `exp` claim — there is no
server-side token store, so there is no way to invalidate a specific
token before it expires. `is_active` is re-checked on every request
(see `app/auth/decorators.py`), which handles *account* deactivation,
but a stolen-but-still-valid token for an active account cannot be
individually revoked, and there is no logout endpoint (logout is purely
a client-side "discard the token" action).

**Impact:** Medium — bounded by `JWT_ACCESS_TOKEN_EXPIRES_SECONDS`
(currently 24h), but a real "log out everywhere" or "I think my token
leaked" story requires either short-lived tokens + refresh tokens, or a
server-side blocklist.

**Recommended solution:** Add a refresh-token flow (short-lived access
token, longer-lived refresh token stored server-side and revocable) when
the mobile/SPA client needs "stay logged in" behavior beyond 24h.

**Priority:** Medium.

**Target milestone:** Before this ships with real user accounts.

### 6. Production config has no startup validation

**Description:** `ProductionConfig` accepts `SECRET_KEY`/`JWT_SECRET_KEY`
falling back to the insecure `dev-secret-key-change-me` default if the
environment variables are simply forgotten at deploy time — there's
nothing that stops the app from booting in that state.

**Impact:** High *if* it happens (tokens signed with a known default
secret are forgeable), but requires an operational mistake to trigger.

**Recommended solution:** In `create_app()`, when `config_name ==
"production"`, assert `SECRET_KEY`/`JWT_SECRET_KEY` are set and don't
match their dev defaults; raise on startup rather than serving traffic
insecurely.

**Priority:** Medium — cheap to fix, worth doing before first deploy.

**Target milestone:** Before production deployment.

### 7. `Message.is_read` has no `read_at` timestamp

*(Carried over from the original schema-layer review — still open.)*
A boolean captures *that* a message was read, not *when*. Fine for an
unread-count badge; insufficient for "seen 2 hours ago" UI, which the
messaging feature will likely want eventually.

**Priority:** Low. **Target milestone:** When read receipts UI is built.

### 8. `datetime.utcnow()` is deprecated (Python 3.12+)

**Found during:** Running the test suite — surfaced as a `DeprecationWarning`
on every single test that touches a timestamped row (370+ warnings in
the unit suite alone).

**Description:** Every model's `default=datetime.utcnow` (12 models) and
`message_service.py`'s manual `conversation.updated_at =
datetime.utcnow()` use naive (non-timezone-aware) datetimes. Python 3.12
deprecated `datetime.utcnow()` in favor of `datetime.now(timezone.utc)`,
which is timezone-aware. Notably, `app/auth/jwt.py` already does this
correctly (`datetime.now(timezone.utc)`) — the models are the
inconsistent ones.

**Impact:** None today (it still works, just emits a warning). Real risk
is comparing a naive and an aware datetime somewhere down the line,
which raises `TypeError` at runtime rather than failing predictably —
and the warning is currently just noise in the test output, which makes
it easy to stop noticing a *new*, unrelated deprecation warning once
this one is expected background noise.

**Recommended solution:** Replace `default=datetime.utcnow` with
`default=lambda: datetime.now(timezone.utc)` (or equivalent) across all
12 models and `message_service.py`, consistent with `app/auth/jwt.py`'s
existing pattern. Requires a migration if columns need to change from
`TIMESTAMP` to `TIMESTAMP WITH TIME ZONE` to actually store the tzinfo
rather than silently dropping it.

**Priority:** Low — cosmetic today, but cheap to fix and gets more
annoying to retrofit the longer timestamped data accumulates.

**Target milestone:** Next time any model file is touched for an
unrelated change; not urgent enough to justify a dedicated pass across
12 files on its own.

---

## Resolved

### R1. Inconsistent `nullable` on timestamp columns — RESOLVED 2026-08-20

Added `nullable=False` to every `created_at` / `updated_at` / `joined_at`
column across `Profile`, `Post`, `PostImage`, `Comment`, `Like`,
`Community`, `CommunityMember`, `UserFollow`, `Conversation`,
`ConversationParticipant`, and `Message`, matching the pattern `User`
already used. Safe to apply directly (no migration/backfill needed) since
no `migrations/` directory existed yet and no database had been created
against the prior schema.

**Verified by:** introspecting `Model.<column>.property.columns[0].nullable`
for all 18 affected columns (confirmed `False` on every one), and by a raw
`sqlalchemy.insert()` bulk-insert test that bypasses the ORM's Python-side
default — before the fix this would have silently written `NULL`; after
the fix it raises `IntegrityError` at the database level, as intended.

See original write-up below for full context on why this mattered.

### R2. Asymmetric relationship declaration on `ConversationParticipant.user` — RESOLVED 2026-08-20

Added `back_populates="conversation_participations"` on
`ConversationParticipant.user`, and added the matching
`User.conversation_participations` relationship (with
`cascade="all, delete-orphan"`, consistent with the other join-table
back-references like `community_memberships`).

**Verified by:** confirming the relationship resolves in both directions
(`user.conversation_participations[0]` and
`conversation_participant.user`), and confirming the cascade actually
deletes the child row when removed from the parent's collection — not
just that the attribute exists.

See original write-up below for full context.

---

## Original findings (for reference)

## 1. Inconsistent `nullable` on timestamp columns

**Found during:** Marshmallow schema layer review (models vs. `docs/schema.dbml`),
2026-08-20.

**Description:**
`User.created_at` and `User.updated_at` are declared `nullable=False`. Every
other model's timestamp columns are not:

- `Profile.created_at` / `updated_at`
- `Post.created_at` / `updated_at`
- `PostImage.created_at`
- `Comment.created_at` / `updated_at`
- `Like.created_at`
- `Community.created_at` / `updated_at`
- `CommunityMember.joined_at`
- `UserFollow.created_at`
- `Conversation.created_at` / `updated_at`
- `ConversationParticipant.joined_at`
- `Message.created_at`

All of these rely solely on `default=datetime.utcnow`, which is a
**Python-side** default applied by SQLAlchemy's ORM unit-of-work — it does
**not** translate into a `DEFAULT` clause or `NOT NULL` constraint at the
database level.

**Impact:**
Any write path that bypasses the ORM's normal `session.add()` /
autogenerated-INSERT flow — bulk inserts via `Table.insert()`, raw SQL,
data migrations, or a future seed/import script — can silently persist
`NULL` into these columns. Downstream code (e.g. sorting posts by
`created_at`, computing "joined X days ago") would then have to handle
`None`, or fail unexpectedly. `users` is the only table currently
protected against this at the schema level.

**Recommended solution:**
Add `nullable=False` to every timestamp column listed above, matching the
`users` table's pattern, via an Alembic migration (`ALTER COLUMN ... SET
NOT NULL`, after backfilling any existing `NULL` rows if migrating a
populated database). Consider also moving to `server_default=func.now()`
for `created_at` columns so the default is enforced by PostgreSQL itself
regardless of write path, with `default=datetime.utcnow` kept as a
Python-side convenience for pre-flush access to the value.

**Priority:** Medium — not a correctness bug today (the ORM always
supplies these values in the app's current single write path), but it's
a latent data-integrity gap that gets more expensive to fix the more rows
accumulate.

**Target milestone:** Before the first bulk-import, admin tooling, or
background job that writes to these tables outside a normal request/ORM
flow.

---

## 2. Asymmetric relationship declaration on `ConversationParticipant.user`

**Found during:** Same review as #1.

**Description:**
`ConversationParticipant.user = db.relationship("User")` has no
`back_populates`, unlike every other FK relationship in the codebase,
which is declared bidirectionally (e.g. `Post.user` /
`User.posts`).

**Impact:**
Low today — the relationship still works one-directionally. Risk is that
someone later adds a `User.conversation_participations` back-reference
with a different attribute name or `back_populates` target, silently
diverging from the pattern used everywhere else, rather than the mismatch
being caught immediately by SQLAlchemy's configuration checks.

**Recommended solution:**
Add `back_populates="participant_memberships"` (or similar) on both
sides, matching the existing convention.

**Priority:** Low — style/consistency only.

**Target milestone:** Next time `ConversationParticipant` or `User` is
touched for an unrelated change.
