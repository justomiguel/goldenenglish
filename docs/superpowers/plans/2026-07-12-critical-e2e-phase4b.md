# Plan — Critical E2E Phase 4b

**Spec:** `docs/superpowers/specs/2026-07-12-critical-e2e-phase4b-design.md`

## Tasks

1. Extend `supabase/seeds/e2e/seed-admin.sql` with `e2e-paid-event` (+ translations, bank transfer instructions if required).
2. `e2e/critical-paid-event.spec.ts` — anon transfer + receipt.
3. `e2e/critical-parent-payments.spec.ts` — parent upload → admin approve → settled.
4. Register Playwright projects; reseed + `test:e2e:precommit`.
