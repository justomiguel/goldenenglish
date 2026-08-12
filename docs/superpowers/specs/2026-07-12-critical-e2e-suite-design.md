# Critical E2E suite — design

**Date:** 2026-07-12  
**Status:** Shipped through Phase 6 — Phase 7 (nightly) still open  
**Related:**
- `docs/runbooks/e2e-isolated-harness.md`
- `docs/superpowers/specs/2026-07-11-e2e-local-supabase-stack-design.md`
- `docs/superpowers/specs/2026-07-11-precommit-e2e-gate-design.md`
- `docs/superpowers/specs/2026-07-12-critical-e2e-coverage-roadmap-design.md`
- `docs/superpowers/specs/2026-08-12-critical-e2e-phase6-full-coverage-design.md`
- Rule `.cursor/rules/34-precommit-e2e.mdc`

## Intent

Define and implement a **business-critical Playwright suite** on the isolated local Supabase stack, beyond the current admin-tour **anchor smoke**. Vitest already covers payment math and many action contracts; E2E must prove **session/cookies, role gates, multi-page redirects, and post-mutation UI**.

## Current state

| Layer | Coverage |
|-------|----------|
| Vitest | Heavy: billing cores, admin actions, tour L1/L2, import parsers |
| Playwright today | Auth setup (admin) + `admin-tours` — visible `data-tour` only |
| Seed | Admin + one current cohort (`e2e-cohort`) |

**Not covered by browser E2E:** student/parent portals, payments, registration accept, enrollment mutations, import jobs, events, CMS, auth redirect matrix.

## Risk ranking (journeys)

| Rank | Journey | Why |
|------|---------|-----|
| 1–2 | Student / parent monthly pay (MP/Flow) | Revenue + misattribution |
| 3–4 | Admin approve receipt / record payment | Ledger truth |
| 5–6 | Public register → admin accept → login | Identity provisioning |
| 7 | Bulk import long job | Mass data |
| 8 | Admin create user | Auth + role |
| 9 | Section enroll / move | Billing + attendance |
| 10 | Paid event register | Capacity + money |
| 11 | Login + role routing + admin gate | Authz UX |
| 12 | Parent ward credential change | Cross-account |
| 13 | Collections bulk messaging | Mass email |
| 14 | Site-setup / CMS publish | Public brand |
| 15 | Event attendee destructive ops | Data loss |

## Approaches

### A — Big bang (all ranks 1–15 in one PR)
- **Pros:** Full safety net immediately.  
- **Cons:** Weeks of seed/fixture work; precommit becomes very slow; gateway sandboxes hard.  
- **Reject** for first delivery.

### B — Phased critical path (recommended)
- **Phase 1 (this PR):** auth matrix + registration accept + academic enroll smoke + keep tours; extend seed with student/parent/section.  
- **Phase 2:** billing receipt upload → admin approve → student sees paid (no live MP/Flow; stub or receipt-only path).  
- **Phase 3:** create-user + create-section full path; event register free path.  
- **Phase 4 (nightly / optional):** gateway sandbox, import long job, CMS.  
- **Pros:** Ship value fast; keep precommit bounded (~2–4 min).  
- **Cons:** Money paths wait until Phase 2.

### C — Precommit tours only; critical suite nightly only
- **Pros:** Fast local commits.  
- **Cons:** Critical bugs slip until CI night; weaker than current fail-closed culture.  
- **Reject** as sole strategy; may use for Phase 4 only.

**Recommendation: B.**

## Phase 1 scope (implement after approval)

### Seed (`supabase/seeds/e2e/`)

Idempotent fixtures (local only):

| Fixture | Purpose |
|---------|---------|
| Admin (existing) | Staff |
| Current cohort + **one section** (teacher = admin or seeded teacher) | Academic |
| Student `e2e-student@example.test` enrolled in section | Student portal |
| Parent `e2e-parent@example.test` linked as tutor of student | Parent portal |
| Export `E2E_COHORT_ID` / section id into `.env.local.e2e` (or discover via API in setup) | Unblock `task:create-section` |

Password convention: same strength as admin (`E2eLocal!Stack1`) unless env overrides.

### Playwright projects

| Project | Specs | Auth storage |
|---------|-------|--------------|
| `setup` | `auth.setup.ts` — admin (+ student/parent states if needed) | `e2e/.auth/*.json` |
| `chromium-admin-tours` | existing | admin |
| `chromium-critical-auth` | **new** `e2e/critical-auth.spec.ts` | per-test login or multi storage |
| `chromium-critical-academic` | **new** `e2e/critical-academic.spec.ts` | admin |
| `chromium-critical-registration` | **new** `e2e/critical-registration.spec.ts` | admin + anon |

### Phase 1 scenarios (must pass on precommit)

1. **Auth — admin login** lands on `/dashboard/admin` (already partly in setup; assert once in critical-auth).  
2. **Auth — student login** lands on `/dashboard/student` (or role hub).  
3. **Auth — parent login** lands on `/dashboard/parent`.  
4. **Authz — student cannot open** `/dashboard/admin/finance` (redirect away / not finance UI).  
5. **Registration — public submit** on `/register` when inscriptions enabled (or enable in seed settings) → admin registrations list shows pending row.  
6. **Registration — admin accept** one pending → accepted user can log in (or profile exists).  
7. **Academic — create section** on seeded cohort (or assert enroll button / open new-section modal with anchors) — prefer **create section via UI** if stable; else enroll existing student already seeded and assert UI list.  
8. Keep **admin-tours** matrix (enable `create-section` via seeded cohort id in env).

### Explicit Phase 1 out of scope

- Live MercadoPago / Flow checkout.  
- Admin approve payment / receipt upload.  
- Bulk import long job.  
- CMS / site-setup wizard.  
- Event paid registration.  
- Parent ward email change step-up.  
- Expanding explain-tours to all sidebar screens.

## Precommit / timing budget

- Target **≤ 4 minutes** for full Playwright precommit on a warm machine.  
- If Phase 1 exceeds budget: split `chromium-critical-registration` behind `E2E_SUITE=full` and keep auth+academic+tours on default precommit — **document in runbook**; prefer keeping all Phase 1 on by default first and measure.

## Architecture notes

- Reuse isolation guards (`e2e/env.ts`, `run-e2e-precommit.mjs`).  
- Prefer dictionary keys / roles / stable selectors (`data-testid` or existing `data-tour` / accessible names) — no brittle CSS.  
- New `data-testid` only where no stable hook exists (mini follow-up in same PR if required).  
- Seed SQL remains **local-only**; never run against nago/golden.  
- Post-mutation: assert UI update without full reload where the product already refreshes (rule 27).  
- Manual QA (user): gateway and tenant-specific register surfaces.

## Done when

- [x] Spec approved.  
- [x] Seed extended; `e2e:stack:up` writes student/parent credentials (+ cohort/section ids).  
- [x] Phase 1 specs green via `npm run test:e2e:precommit`.  
- [x] Also green on precommit: payments inbox approve + create-user (pulled forward from Phase 2/3).  
- [x] Runbook updated with fixture users and suite map.  
- [x] Vitest for any new pure seed/env helpers.  
- [x] Phase 2+ listed as follow-up in this spec (not implemented yet).

## Out of scope (whole initiative unless later phases)

- Rewriting Vitest suites.  
- Softening fail-closed E2E gate.  
- Cloud-only e2e project (local Supabase remains source of truth).

## Follow-ups

- **Phase 2:** receipt upload → admin approve → paid — **done** (`critical-payments`; see also `2026-07-12-critical-e2e-phase2b3b-design.md`). Remaining: live MP/Flow → Phase 7.  
- **Phase 3:** create-teacher + free event register — **done**. Remaining: paid event / transfer → Phase 4.  
- **Phase 4:** import job; optional nightly gateway sandbox — users import + paid event + parent payments **done** (`phase4a` / `phase4b`).  
- **Phase 5a:** section enroll + event payment approve — **done**.  
- **Phase 5b:** reject payment + ward email + create cohort — **done**.  
- **Phase 6:** teacher auth, attendance, unenroll, event attendee remove, record-payment, scholarship, messaging, collections-bulk, forgot-password, portal smokes — **done** (`2026-08-12-critical-e2e-phase6-full-coverage-design.md`).  
- **Phase 7 (nightly / open):** live MP/Flow sandbox, CMS / site-setup, coupons/promotions, multi-locale, assistant fixture — do **not** block default precommit.
