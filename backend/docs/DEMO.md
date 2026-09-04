# Showcasing This Project

A guide for presenting this backend to classmates and your technical
mentor — what to show, in what order, and why each piece is convincing
to that specific audience.

The core idea: **don't just say it works — run something live that
proves it, and run something automated that proves it more rigorously
than a live demo ever could.** Those are two different kinds of proof,
and a mixed audience needs both.

## Before class: a 2-minute setup check

Run this once beforehand so you're not debugging environment issues live:

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements-dev.txt

cp .env.example .env
# .env's defaults work fine for a local demo -- no real secrets needed

export FLASK_APP=wsgi.py
flask db init && flask db migrate -m "initial schema" && flask db upgrade
```

If that all runs clean, you're ready. Do this before class, not during it.

## The 5-minute version (if you're short on time)

1. Run the test suite (30 seconds, very convincing): `pytest`
2. Run the live demo script (60 seconds): `flask run` in one terminal,
   `python scripts/demo.py` in another
3. Point at `docs/API.md` and mention the security fix (see below)

That alone tells a complete story: it's tested, it works live, and you
found and fixed a real bug. Expand into the sections below if you have
more time or the mentor asks follow-up questions.

## Part 1 — the live demo (for the room)

This is the part classmates actually watch. It's satisfying because
it's visibly a *real* server responding to *real* requests, not slides.

**Terminal 1** (leave running, visible on screen):
```bash
flask run
```

**Terminal 2** (the actual demo):
```bash
python scripts/demo.py
```

Narrate as it scrolls — it's already structured as a story: register two
users, one tries to register as an admin and gets blocked, they create
a post together, comment, like, form a community, message each other,
and the last step proves errors come back clean instead of crashing.
Each step prints the real request, the real response, and a checkmark —
you don't need slides duplicating this.

**The one moment to slow down and explain** is Step 3 (the blocked admin
registration) — see "The one story worth telling well" below.

## Part 2 — the automated proof (for the mentor)

A live demo proves the happy path works *once, today, on your machine*.
It doesn't prove the edge cases, the security boundaries, or that it'll
still work after someone changes something next week. That's what the
test suite is for, and it's the stronger piece of evidence — lead with
this if your mentor is more interested in engineering rigor than a
product demo.

```bash
pytest
```

Point out, while it runs:
- **169 tests, 99% coverage** — not just "it runs," but every ownership
  rule, every conflict case, every auth failure mode is independently
  verified.
- **Unit vs. integration split** (`tests/unit/`, `tests/integration/`) —
  business logic is tested in isolation from HTTP, so a mentor asking
  "how do you know the *logic* is right, not just the *response code*"
  has a direct answer.
- Open `htmlcov/index.html` (generated automatically by `pytest`) if
  they want to see exactly which lines are and aren't covered, and why.

## The one story worth telling well

If you only prepare one talking point in depth, make it this one — it's
the difference between "I built an app" and "I engineered a system,"
and it's a true story, not a rehearsed one:

> While building the auth system, I realized my own authorization logic
> — the code that lets an admin override ownership checks — trusted the
> `role` field on the user. But at that point, `role` was still an
> unrestricted string on registration. That meant anyone could register
> with `{"role": "admin"}` and grant themselves admin privileges through
> the sign-up form. I found this by tracing through my own design, not
> because anyone told me to look for it, fixed it by restricting the
> field with schema-level validation, and then wrote a test
> (`test_self_registering_as_admin_is_rejected`) specifically so it can
> never silently regress.

That's `docs/TECHNICAL_DEBT.md`'s resolved items and
`app/schemas/user_schema.py`'s security comment, in narrative form. It
demonstrates the thing mentors actually want to see: not "I followed
instructions," but "I reviewed my own work critically and caught
something real."

## If asked "how do you know it's not just working by luck?"

Three concrete answers, all demonstrable on the spot:

1. **Run `pytest -v` and let them pick a test file** to read through —
   every test's name states exactly what it verifies and why (see the
   comments in `tests/unit/test_message_service.py` for the most
   detailed example — the participant-authorization tests explain their
   own reasoning).
2. **Show a coverage gap being closed live**: `docs/TECHNICAL_DEBT.md`
   documents the ones still open (e.g. no JWT revocation) — pointing at
   what's *not* done yet is more credible than claiming everything is
   perfect.
3. **Run the migration from scratch** (`flask db migrate` against a
   fresh empty database) and show that Alembic's autogenerated diff
   matches the models exactly — proof the schema isn't hand-waved, it's
   derived mechanically from the same model code the app runs on.

## If something breaks live

It will happen to someone in class, on some project — plan for it
instead of hoping it won't:

- **Demo script can't reach the server**: confirm `flask run` is
  actually running in the other terminal and printed `Running on
  http://127.0.0.1:5000` with no errors above it.
- **`ModuleNotFoundError`**: you're not in the `venv`, or forgot
  `pip install -r requirements-dev.txt`.
- **Registration fails with 409 on a second run**: the demo script
  reuses fixed usernames (`amina_demo`, `brian_demo`) — either delete
  the SQLite file and re-run migrations, or just say so out loud
  ("that 409 is actually the app correctly rejecting a duplicate, which
  is itself a small proof it's working") and move on. A live demo
  hiccup you can explain in one sentence is not a crisis.
