# Critical E2E suite — Implementation Plan

> **For agentic workers:** Execute task-by-task. Spec: `docs/superpowers/specs/2026-07-12-critical-e2e-suite-design.md`.

**Goal:** Full critical Playwright suite on local Supabase — auth, academic, registration, payments (receipt), create-user — plus existing tours.

**Architecture:** Extend `supabase/seeds/e2e/`, multi storage-state auth setup, new `e2e/critical-*.spec.ts` projects in `playwright.config.ts`, env writer emits fixture credentials + cohort/section IDs.

## File map

| File | Responsibility |
|------|----------------|
| `supabase/seeds/e2e/seed-admin.sql` → split or extend `seed-fixtures.sql` | Users, cohort, section, enrollment, tutor link, inscriptions on |
| `e2e/buildE2eLocalEnvFile.ts` | Emit student/parent emails + cohort/section ids |
| `scripts/e2e-write-env-from-status.mts` / stack-up | Apply expanded seed; query ids into env |
| `e2e/auth.setup.ts` | Admin + student + parent storage states |
| `e2e/critical-auth.spec.ts` | Login redirects + student blocked from admin |
| `e2e/critical-academic.spec.ts` | Section/cohort visibility; create-section when possible |
| `e2e/critical-registration.spec.ts` | Public register → accept → login |
| `e2e/critical-payments.spec.ts` | Student receipt path → admin approve |
| `e2e/critical-create-user.spec.ts` | Admin creates staff user |
| `playwright.config.ts` | Projects + dependencies |
| `docs/runbooks/e2e-isolated-harness.md` | Fixture map |

## Tasks

1. Seed fixtures (SQL) + env keys  
2. Auth setup multi-role  
3. critical-auth  
4. critical-academic + tours E2E_COHORT_ID  
5. critical-registration  
6. critical-payments (receipt)  
7. critical-create-user  
8. Wire config/runbook; `test:e2e:precommit` green  

**Out of this PR if blocked:** live MP/Flow sandbox (document stub); import long-job (Phase 4 note).
