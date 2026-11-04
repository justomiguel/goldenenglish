# Plan: task, shop catalog, parent attendance E2E

1. Add the open learning task reset to `supabase/seeds/e2e/seed-admin.sql`.
2. Add Playwright projects for the three specs.
3. Write the three specs. Reuse `gotoIsolated`, isolation skip, and existing storage states.
4. Run the three specs on the isolated stack.
5. Commit spec, plan, seed, config, and specs together. Push `main`.
