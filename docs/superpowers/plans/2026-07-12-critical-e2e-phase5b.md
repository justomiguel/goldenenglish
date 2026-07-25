# Plan: Critical E2E Phase 5b

**Spec:** `docs/superpowers/specs/2026-07-12-critical-e2e-coverage-roadmap-design.md` (approved)  
**Date:** 2026-07-12

## Goal

Ship three precommit Playwright journeys:

1. Monthly receipt **reject** (ledger inverse of approve)
2. Parent **ward email change** with password step-up
3. Admin **create cohort** full UI path

## Defaults (from approval)

- All three in Phase 5b
- Budget bump documented (~≤9 min warm)
- Ward path = email change + parent password

## Tasks

### 1. Seed — third due month

- In `supabase/seeds/e2e/seed-admin.sql`, add `v_reject_month` distinct from current + parent months; upsert pending payment without receipt.
- Document in runbook.

### 2. `e2e/critical-payment-reject.spec.ts`

- Student upload (first remaining due after payments/parent consume earlier months — project order after those two, or click a due that is still pending).
- Prefer: run project **after** payments + parent so `clickFirstPendingMonthlyDue` hits reject month; OR click by period label if stable.
- Admin finance inbox → **Rejected** / **Rechazado** button (dict `admin.payments.reject`).
- Student payments shows unpaid/rejected/due again (not settled).

### 3. `e2e/critical-parent-ward-email.spec.ts`

- Parent storage → `/dashboard/parent` → open ward edit link.
- Change email to unique `e2e-ward-{suffix}@example.test`.
- Fill `#ward-parent-pw` with `E2E_USER_PASSWORD`.
- Submit → expect `Guardado` / saved copy.
- Optional: wrong password shows invalid message (nice-to-have if cheap).

### 4. `e2e/critical-create-cohort.spec.ts`

- Academic hub → new cohort control → `#nc-name` unique → submit.
- Assert URL `/academic/{uuid}` + cohort name / tour `cohortDetail`.
- Product fix: drop `router.refresh()` after `push` in `AcademicNewCohortModal` (same race as create-section).

### 5. Wire + docs

- `playwright.config.ts` projects
- Runbook table + budget note
- Update roadmap / parent suite follow-ups as done for 5b

## Verification

```bash
docker exec -i supabase_db_goldenenglish psql … < supabase/seeds/e2e/seed-admin.sql
npm run test:e2e:precommit
```

Expect exit 0; ~29 tests.
