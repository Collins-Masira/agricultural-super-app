# Git Workflow

This document defines the Git workflow for the **Agricultural Super App** (Moringa School group project).

## Branch Strategy

```text
main
  └── develop
        └── feature/<short-description>
```

| Branch | Purpose |
| --- | --- |
| `main` | Production/release branch. Receives only reviewed, tested changes. |
| `develop` | Integration branch. Receives completed feature branches. |
| `feature/<short-description>` | Created from `develop` for individual tasks; merged back through Pull Requests. |

### Branch Naming

Feature branches are prefixed with the type and use lowercase, hyphen-separated descriptions:

- `feature/auth`
- `feature/posts`
- `feature/communities`
- `feature/messaging`
- `feature/frontend`
- `feature/database`

## Workflow

1. Create a feature branch from `develop`:

   ```bash
   git checkout develop
   git checkout -b feature/<short-description>
   ```

2. Commit work in small, focused commits (see [Commit Conventions](#commit-conventions)).

3. Push the branch and open a **Pull Request** into `develop`.

4. Request a code review (see [Code Review](#code-review)).

5. After approval and passing CI, merge the Pull Request into `develop`.

6. `develop` is periodically reviewed and merged into `main` for releases.

## Pull Request Process

- Every feature lands via a Pull Request — never by direct push to `develop` or `main`.
- PR title and description summarise the change and reference the relevant task from [task-tracker.md](task-tracker.md) where useful.
- The PR must include the relevant tests and documentation updates.
- A PR is merged only after:
  - at least one approving review from a team member who did not author the change, and
  - all CI checks pass.

## Code Review

- Reviewers check: correctness, security, consistency with the [development standards](development.md), test coverage, and documentation.
- Review comments are constructive and specific.
- Fixes requested in review are made in follow-up commits on the same feature branch.
- No one merges their own Pull Request without a review.

## Merge Rules

- Merging into `develop`: via Pull Request with approval and green CI.
- Merging into `main`: only from `develop` after team review; `main` is for production-ready releases.
- Do not force push to shared branches.
- Do not rewrite published history.
- Keep the working tree clean at the end of a work session.

## Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

```text
<type>: <short description>
```

Allowed prefixes:

| Prefix | Use |
| --- | --- |
| `feat:` | A new feature |
| `fix:` | A bug fix |
| `docs:` | Documentation only |
| `test:` | Adding or updating tests |
| `refactor:` | Code change that neither fixes a bug nor adds a feature |
| `chore:` | Maintenance, tooling, dependencies |

Examples:

```text
feat: add community_follows table
docs: document git workflow
fix: prevent self-follow on user_follows
test: add tests for profile verification
refactor: extract message service
chore: update .gitignore
```

## Related Documents

- [Development standards](development.md)
- [Task tracker](task-tracker.md)
- [CI/CD plan](../../.github/workflows/ci-cd.md)