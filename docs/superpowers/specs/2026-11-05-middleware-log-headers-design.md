# Middleware must not import request headers

## Intent

`next build` fails because the middleware bundle includes `src/lib/logging/readRequestLogHeaders.ts`. That file imports `server-only` and `next/headers`. Middleware is not a Server Component.

## Decision

`serverActionLog` keeps an injected header reader. It does not import `readRequestLogHeaders`. `instrumentation.ts` registers that reader at server boot. An empty reader leaves `host` and `tenantSlug` null. Call sites that already pass `host` in the log meta keep that value.

## Done when

- `middleware.ts` → `proxy.ts` → `serverActionLog` has no edge to `readRequestLogHeaders`.
- `npx next build --webpack` finishes with exit code 0.
- The log-context test expects null host and tenant when no reader is registered.

## Out of scope

- Unit and E2E runs on the commit hook.
- A new product changelog row. Staff do not see this change.
- Reworking tenant resolution in `tenantRequestContext.ts`.
