# Local Supabase for isolated E2E (option 2)

**Status:** Approved (user chose option 2 — Docker + `supabase start` → `.env.local.e2e`)  
**Date:** 2026-07-11  
**Related:** `docs/runbooks/e2e-isolated-harness.md`, precommit E2E gate (option A)

## Intent

Provision an **isolated** E2E stack on the developer machine via **Supabase CLI + Docker** (not tenant cloud DBs, not a SQLite rewrite). Automate writing `.env.local.e2e` from `supabase status` so precommit Playwright can run.

## Done when

- [x] `supabase/config.toml` exists and works with existing `supabase/migrations/`.
- [x] Script(s): start local stack, apply migrations, seed e2e admin, write/update `.env.local.e2e`.
- [x] Runbook documents: install Docker/Colima, `npm run e2e:stack:up`, then `npm run test:e2e:precommit`.
- [x] Fail-closed precommit still requires isolation; local URLs (`127.0.0.1` API) satisfy guards.
- [x] Vitest covers pure helpers that map `supabase status -o env` → e2e env keys (no Docker in unit tests).

## Out of scope

- Rewriting the app to SQLite / PGlite.
- Softening the precommit gate back to skip-by-default.
- Installing Docker Desktop GUI interaction for the user if brew/cask cannot finish unattended — document manual open step.

## Notes

- Prefer **Colima** or Docker Desktop; agent attempts install when possible.
- Seed admin: `e2e-admin@example.test` + password in generated `.env.local.e2e`.
- `NEXT_PUBLIC_APP_URL` / Playwright remain on **:3100**.
