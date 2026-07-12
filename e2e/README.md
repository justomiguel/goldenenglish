# Playwright E2E

**Isolated local Supabase** (Docker). See [`docs/runbooks/e2e-isolated-harness.md`](../docs/runbooks/e2e-isolated-harness.md).

```bash
# Machine once:
brew install colima docker && colima start

# Generate .env.local.e2e + migrate + seed admin:
npm run e2e:stack:up

# Same gate as husky precommit:
npm run test:e2e:precommit

# WIP escape (ask user first):
SKIP_E2E=1 npm run precommit
```

Default local admin: `e2e-admin@example.test` / `E2eLocal!Stack1`.
