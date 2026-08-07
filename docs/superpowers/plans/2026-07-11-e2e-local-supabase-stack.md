# Plan: Local Supabase E2E stack

**Spec:** `docs/superpowers/specs/2026-07-11-e2e-local-supabase-stack-design.md`

1. Ensure Docker runtime (Colima preferred for CLI).
2. Add `supabase/config.toml` via `supabase init` (keep migrations).
3. Pure helper `mapSupabaseStatusEnvToE2eFile` + Vitest.
4. `scripts/e2e-stack-up.mjs`: start → migrate → seed admin → write `.env.local.e2e`.
5. Seed SQL `supabase/seeds/e2e/seed-admin.sql` (disposable credentials).
6. npm scripts `e2e:stack:up` / `e2e:stack:down` + runbook.
