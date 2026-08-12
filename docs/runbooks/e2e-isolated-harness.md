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

Also seeded: current cohort `e2e-cohort`, section `E2E Section A` (Mon 10:00–11:00 schedule + fee plan), **four** due monthly payments without receipt (current / parent-month / reject-month / record-month for admin record-payment-without-receipt), free `e2e-free-event`, paid `e2e-paid-event`, a **pending billing receipt** for the finance receipt-detail tour (`E2E_RECEIPT_ID`), `inscriptions_enabled=true`.  
`E2E_COHORT_ID` / `E2E_SECTION_ID` / `E2E_STUDENT_ID` / `E2E_RECEIPT_ID` are written into `.env.local.e2e`.

`auth.setup.ts` writes storage for admin, student, parent, and teacher → `e2e/.auth/{admin,student,parent,teacher}.json` (paths from `e2eAuthPaths()`).

`seed-admin.sql` restores fixture logins by **email or DNI** (ward-email E2E changes the student address; reseed must not insert a second auth user with the same `dni_or_passport`). Fixture students use an **adult** `birth_date` so `is_minor` stays false and `/dashboard/student/payments` remains reachable. Section A has `allow_advance_monthly_payment` so future due months (parent + reject + record) stay payable on the strip.

### Outbound email (no real Resend)

Isolated e2e **must not** call Resend. The Next process uses `RecordingEmailProvider` when `GE_DEV_TARGET=e2e` (and `.env.local.e2e` sets `EMAIL_PROVIDER=recording`). `test:e2e:precommit` also **unsets** `RESEND_API_KEY` / `RESEND_FROM_EMAIL` so tenant shell keys cannot leak.

- Assert calls (optional): `GET /api/e2e/recorded-emails` → `{ ok, emails }` (404 outside recording mode).
- Clear between specs: `DELETE /api/e2e/recorded-emails`.
- ADR: `docs/adr/2026-07-12-e2e-recording-email-provider.md`.

### How the gate runs (`run-e2e-precommit.mjs`)

1. **Reseeds fixtures** (`seed-admin.sql`, ~1s). Specs mutate shared fixtures and do not
   restore them — `critical-parent-ward-email` renames `e2e-student@example.test` — so
   without this the *second* run in a row fails in `auth.setup.ts`. Escape: `E2E_SKIP_SEED=1`.
2. **Builds `.next-e2e`** (`next build` with `GE_DEV_TARGET=e2e` → `distDir=.next-e2e`, so it
   never fights tenant `dev:*` over `.next`). Skipped when `.next-e2e` is newer than every
   build input (`src`, `public`, configs, `.env.local.e2e`). Escape: `E2E_SKIP_BUILD=1`.
3. **Serves it with `next start`** — *not* `next dev`. Dev compiled routes on demand at
   ~17s per first hit, which blew the 3-minute `auth.setup.ts` timeout and aborted
   navigations with `ECONNRESET`; the whole suite was blocked behind setup.

Warm budget target: **≤15 min** for the full precommit suite (seed + Playwright on a warm `.next-e2e`). Measured warm wall-clock after Phase 6: about **2.0 min** / 114 tests (exit 0). A cold run adds the `next build` (~7 min).
Serwist is disabled for e2e builds so they cannot rewrite the `public/sw.js` that precommit
already staged.

If warm wall-clock exceeds 15 min, the escape hatch is to move `portal-smoke-hubs`,
`critical-scholarship`, and `critical-collections-bulk` behind `E2E_SUITE=extended`
(implement in `run-e2e-precommit.mjs` / Playwright config when needed). That filter is
**not** wired today — all Phase 6 projects stay on default precommit while the suite
stays under budget.

Filter projects (args forwarded by `run-e2e-precommit.mjs`):

```bash
npm run test:e2e:precommit -- --project=setup --project=chromium-critical-payments
```

### Playwright projects (precommit)

| Project | Spec | Focus |
|---------|------|--------|
| setup | `auth.setup.ts` | Admin + student + parent + teacher storage |
| chromium-admin-tours | `admin-tours.spec.ts` | Tour `data-tour` anchors |
| chromium-parent-tours | `parent-tours.spec.ts` | Parent tour `data-tour` anchors |
| chromium-critical-auth | `critical-auth.spec.ts` | Role redirects + authz |
| chromium-critical-teacher-auth | `critical-teacher-auth.spec.ts` | Teacher hub + admin finance deny |
| chromium-critical-academic | `critical-academic.spec.ts` | Hub + cohort sections |
| chromium-critical-registration | `critical-registration.spec.ts` | Public register → accept → login |
| chromium-critical-payments | `critical-payments.spec.ts` | Upload receipt → admin approve → paid |
| chromium-critical-parent-payments | `critical-parent-payments.spec.ts` | Parent receipt → approve |
| chromium-critical-payment-reject | `critical-payment-reject.spec.ts` | Upload → admin reject → rejected |
| chromium-critical-parent-ward-email | `critical-parent-ward-email.spec.ts` | Ward email + password step-up |
| chromium-critical-create-cohort | `critical-create-cohort.spec.ts` | New cohort modal |
| chromium-critical-create-user | `critical-create-user.spec.ts` | Create teacher |
| chromium-critical-create-section | `critical-create-section.spec.ts` | New section modal |
| chromium-critical-users-import | `critical-users-import.spec.ts` | ImportUsers CSV |
| chromium-critical-events | `critical-events.spec.ts` | Free public event register |
| chromium-critical-paid-event | `critical-paid-event.spec.ts` | Paid event + transfer receipt |
| chromium-critical-section-enroll | `critical-section-enroll.spec.ts` | Enroll student-b |
| chromium-critical-section-unenroll | `critical-section-unenroll.spec.ts` | Drop student-b from roster |
| chromium-critical-attendance | `critical-attendance.spec.ts` | Mark attendance → persist after refresh |
| chromium-critical-section-enrollment-link-privileges | `critical-section-enrollment-link-privileges.spec.ts` | Anon link privilege bounds (no setup) |
| chromium-section-enrollment-link | `section-enrollment-link.spec.ts` | Admin enrollment invite link flow |
| chromium-critical-anon-privilege-hardening | `critical-anon-privilege-hardening.spec.ts` | Anon key surface bounds (no setup) |
| chromium-critical-student-care | `critical-student-care.spec.ts` | Student care notes |
| chromium-critical-event-payment-approve | `critical-event-payment-approve.spec.ts` | Paid register → admin OK |
| chromium-critical-event-attendee-remove | `critical-event-attendee-remove.spec.ts` | Remove pending attendee |
| chromium-critical-record-payment | `critical-record-payment.spec.ts` | Admin record payment (fourth due month) |
| chromium-critical-scholarship | `critical-scholarship.spec.ts` | Assign % scholarship on enrollment |
| chromium-critical-messaging | `critical-messaging.spec.ts` | Admin compose → student inbox |
| chromium-critical-forgot-password | `critical-forgot-password.spec.ts` | Reset via recorded-email link |
| chromium-critical-collections-bulk | `critical-collections-bulk.spec.ts` | Collections bulk preview / degrade |
| chromium-portal-smoke-hubs | `portal-smoke-hubs.spec.ts` | Parent/student/teacher hub smokes |

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

#### The gate manages its own stack

You do not need to run `e2e:stack:up` by hand before committing. The gate brings up whatever
is missing and then stops **only what it started** — a stack you left running is never killed.

| Situation | What the gate does | Cost |
|---|---|---|
| Stack already up | Uses it, leaves it up | — |
| Colima / Supabase down | `colima start` + `supabase start`, then stops both at the end | ~78 s |
| Missing `.env.local.e2e`, or migrations pending | Full `e2e:stack:up` (reset + seed + rewrites the env) | minutes |

Restarting does not need a `db reset`: the Docker volume keeps the schema and fixtures, so
only a genuinely stale schema pays the expensive path. Whole-run cost measured from cold,
everything off: **2m12s** (78 s of startup + 1.2 min of Playwright).

Escapes: `E2E_STACK_KEEP=1` leaves the stack up when you are about to commit several times in
a row; `E2E_SKIP_BUILD=1` reuses `.next-e2e`; `E2E_SKIP_SEED=1` skips the fixture reseed.

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
- Spec: `docs/superpowers/specs/2026-08-04-e2e-precommit-production-server.md`
- Spec: `docs/superpowers/specs/2026-08-04-e2e-gate-manages-its-own-stack.md`
- Rules: `33-admin-tutorials-contract.mdc`, `34-precommit-e2e.mdc`
