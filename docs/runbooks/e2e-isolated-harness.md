# Isolated E2E harness (Playwright)

## Goal

Run **browser E2E against an isolated stack only** — never against day-to-day tenant DBs (`nago`, `golden`, prod).

| Layer | Tool | Needs DB? | Gate |
|-------|------|-----------|------|
| L1 contracts | Vitest inventory / catalog | No | Precommit (Vitest) |
| L2 DOM | Vitest RTL mounts | No | Precommit (Vitest) |
| L3 app E2E | Playwright | Yes — **local Supabase** (or dedicated cloud e2e) | Precommit fail-closed |

## Recommended: local Supabase (Docker)

This is the supported “isolated DB” path — **not** a SQLite file (the app requires Supabase Auth + PostgREST + RLS).

### One-time machine setup

```bash
brew install colima docker supabase
colima start   # or open Docker Desktop
```

### Bring the e2e stack up (writes `.env.local.e2e`)

```bash
npm run e2e:stack:up
```

What it does:

1. Pins local image tags (avoids broken tags from a linked tenant project).
2. Starts Supabase with migrations **off**, waits until `storage.buckets` exists.
3. Re-enables migrations → `supabase db reset` (all migrations + e2e seed).
4. Writes gitignored **`.env.local.e2e`** with API URL `http://127.0.0.1:54321`, seeded admin, Playwright on **:3100**.

**Grants:** migration `166_public_api_role_grants.sql` restores `GRANT ALL` on `public` tables to `anon` / `authenticated` / `service_role` and fixes `postgres` default privileges. Without it, local reset leaves API roles unable to SELECT/INSERT (RLS never runs). Seed also inserts a minimal current cohort so academic hub tour tabs mount.

Default local fixtures (local only):

```text
e2e-admin@example.test       / E2eLocal!Stack1   (admin)
e2e-student@example.test     / E2eLocal!Stack1   (student, enrolled)
e2e-student-b@example.test   / E2eLocal!Stack1   (student, kept unenrolled for enroll E2E)
e2e-parent@example.test      / E2eLocal!Stack1   (parent, linked tutor)
e2e-teacher@example.test     / E2eLocal!Stack1   (teacher of E2E Section A)
```

Also seeded: current cohort `e2e-cohort`, section `E2E Section A` (Mon 10:00–11:00 schedule + fee plan), **due** monthly payment (no receipt), free `e2e-free-event`, paid `e2e-paid-event`, `inscriptions_enabled=true`.  
`E2E_COHORT_ID` / `E2E_SECTION_ID` are written into `.env.local.e2e`.

Precommit Next uses **`distDir=.next-e2e`** (`GE_DEV_TARGET=e2e`) so it does not fight tenant `dev:*` over `.next`.

### Playwright projects (precommit)

| Project | Spec | Focus |
|---------|------|--------|
| setup | `auth.setup.ts` | Admin + student + parent storage |
| chromium-admin-tours | `admin-tours.spec.ts` | Tour `data-tour` anchors |
| chromium-critical-auth | `critical-auth.spec.ts` | Role redirects + authz |
| chromium-critical-academic | `critical-academic.spec.ts` | Hub + cohort sections |
| chromium-critical-registration | `critical-registration.spec.ts` | Public register → accept → login |
| chromium-critical-payments | `critical-payments.spec.ts` | Upload receipt → admin approve → paid |
| chromium-critical-parent-payments | `critical-parent-payments.spec.ts` | Parent receipt → approve |
| chromium-critical-create-user | `critical-create-user.spec.ts` | Create teacher |
| chromium-critical-create-section | `critical-create-section.spec.ts` | New section modal |
| chromium-critical-users-import | `critical-users-import.spec.ts` | ImportUsers CSV |
| chromium-critical-events | `critical-events.spec.ts` | Free public event register |
| chromium-critical-paid-event | `critical-paid-event.spec.ts` | Paid event + transfer receipt |
| chromium-critical-section-enroll | `critical-section-enroll.spec.ts` | Enroll student-b |
| chromium-critical-event-payment-approve | `critical-event-payment-approve.spec.ts` | Paid register → admin OK |

Stop containers:

```bash
npm run e2e:stack:down
```

### Precommit

```bash
npm run precommit          # includes test:e2e:precommit
# WIP only (ask first):
SKIP_E2E=1 npm run precommit
```

Cursor rule: **`.cursor/rules/34-precommit-e2e.mdc`**.

## Hard guards (`e2e/env.ts`)

- `E2E_STACK=isolated`
- `GE_DEV_TARGET=e2e` (never `nago` / `golden`)
- Local `PLAYWRIGHT_BASE_URL` only
- `E2E_REQUIRE=1` → fail closed (no silent skip)

## Growing full-app E2E

Add specs under `e2e/`; they run automatically on precommit once the stack is up.

## Related

- Spec: `docs/superpowers/specs/2026-07-11-e2e-local-supabase-stack-design.md`
- Spec: `docs/superpowers/specs/2026-07-11-precommit-e2e-gate-design.md`
- Rules: `33-admin-tutorials-contract.mdc`, `34-precommit-e2e.mdc`
