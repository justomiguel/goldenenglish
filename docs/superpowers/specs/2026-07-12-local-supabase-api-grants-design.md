# Mini-spec: Local Supabase API role grants

**Date:** 2026-07-12  
**Status:** Approved  
**Related:** `2026-07-11-e2e-local-supabase-stack-design.md`

## Intent

After `supabase db reset`, PostgREST roles (`anon` / `authenticated` / `service_role`) must have table DML privileges on `public.*` so RLS can apply. Today migrations run as `postgres` whose default privileges only grant `Dxtm` (no SELECT/INSERT/UPDATE), so the isolated E2E app cannot load profiles or cohorts.

## Done when

- [x] Migration restores `GRANT ALL` on existing public tables/sequences/routines to API roles and fixes `ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public`.
- [x] E2E seed includes a minimal current academic cohort so `admin-academic-board-tabs` mounts.
- [x] `npm run test:e2e:precommit` passes against local stack (with `dev:nago` stopped).
- [x] Runbook notes the grants root cause briefly.

## Out of scope

- Changing RLS policies.
- Softening E2E assertions or tour contracts.
