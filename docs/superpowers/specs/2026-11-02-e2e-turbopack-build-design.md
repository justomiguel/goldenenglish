# E2E precommit build uses Turbopack

**Date:** 2026-11-02  
**Status:** blocked — Turbopack build failed. The e2e command stays `next build --webpack`.

## Intent

The isolated e2e gate rebuilds `.next-e2e` with `next build --webpack` whenever `src` is newer than `.next-e2e/BUILD_ID`. That compile was **33 s** on one precommit and **109 s** on another. TypeScript after compile was **25–63 s**. Playwright on a warm server is already **3.3 min** (124 passed). This change shortens only the e2e production compile.

## Surfaces (Web vs PWA)

No screen, route, hook, or server action changes. No PWA tree impact.

## Decision

`scripts/run-e2e-precommit.mjs` runs `next build` with no `--webpack` flag. Next.js 16 then uses Turbopack for that build. `GE_DEV_TARGET=e2e` still sets `distDir` to `.next-e2e` and disables Serwist. `next start` still serves that directory.

`npm run build` and `npm run dev` stay on `--webpack`. Serwist writes `public/sw.js` only on the product webpack build.

## Why webpack is forced today

1. `package.json` script `build` is `next build --webpack`.
2. `scripts/run-e2e-precommit.mjs` spawns `npx next build --webpack`.
3. `scripts/run-dev-with-target.mjs` adds `--webpack` unless the caller passed `--turbo`.
4. `@serwist/next` always installs a `webpack()` hook. When `disable` is true it returns the config unchanged. The e2e build sets `disable` because `GE_DEV_TARGET=e2e`.
5. `next.config.ts` sets `resolve.alias.canvas = false` inside that webpack hook. No source file imports the `canvas` package. The alias exists so a webpack client bundle does not pull the native module.

A Turbopack e2e build does not run that webpack hook. Serwist stays disabled, so the e2e build must not rewrite `public/sw.js`.

## Done when

The failure clause below fired. These checks are not met:

- The e2e rebuild command does not include `--webpack`.
- A Vitest asserts that command.
- One e2e `next build` with `GE_DEV_TARGET=e2e` exits 0.
- The log records the Turbopack compile time next to the webpack baseline (33 s and 109 s).
- `next start` from `.next-e2e` answers HTTP 200 on the e2e base URL.
- `public/sw.js` is unchanged by that build. This one held: the hash stayed `bb073cf1…`.
- If the Turbopack build fails on a `canvas` resolve, add `turbopack.resolveAlias.canvas` to an empty module and rebuild once. The failure was not `canvas`.
- If the Turbopack build fails for another reason, stop. Leave `--webpack` on the e2e command. Write the error in this spec. Do not ship a red gate. **This is the outcome.** See Result.

## Out of scope

- `npm run build` and local `dev` stay on webpack.
- Playwright `workers`, retries, and tour reloads.
- The `[ge:server] supabase.request_env_missing` lines during static generation.
- Removing webpack comments in `e2e/helpers/gotoIsolated.ts`.

## Plan

1. Add a pure function that returns the e2e production build args: `["build"]`.
2. Add a Vitest that fails if those args contain `--webpack`.
3. Call that function from `scripts/run-e2e-precommit.mjs`.
4. Run one e2e build. Record compile time. Confirm `public/sw.js` is unchanged.
5. Start `next start` on the e2e port and request the base URL.
6. Update one sentence in `docs/runbooks/e2e-isolated-harness.md`.

## Risks

| Risk | Mitigation |
|---|---|
| Turbopack cannot build this app | Keep `--webpack`. Record the error here. |
| `canvas` resolve fails without the webpack alias | Add `turbopack.resolveAlias` only after that error. |
| Serwist still emits `public/sw.js` | Fail the change. E2e must keep Serwist disabled. |
| A warm webpack `.next-e2e` is reused | The mtime check already rebuilds when `src` is newer. Today `src` is newer than `BUILD_ID`, so the next gate rebuilds. |

## Result (2026-11-02)

The e2e command stays `next build --webpack`. No product file changed.

Two Turbopack attempts, both exit 1. `public/sw.js` did not change.

1. `next build` with `GE_DEV_TARGET=e2e` and no `--webpack` flag stopped in 3.3 s. Next.js 16.2.3 refused the build: a `webpack` config is present (Serwist always installs that hook) and `turbopack` was unset.
2. The same build with `turbopack: {}` on the e2e config compiled for 35 s, then failed with 20 errors. Every error is `Cormorant_Garamond` from `src/components/organisms/LioraFontRoot.tsx`. Turbopack reports `next/font/google queries have exactly one entry` and cannot resolve `@vercel/turbopack-next/internal/font/google/font`. The font call uses four weights and two subsets. The webpack build already accepts that call.

The half-written `.next-e2e` from the failed Turbopack compile was removed so the next webpack e2e build starts clean.

## Tests

- New Vitest on the build-arg function. Self-contained. No Playwright and no Next process.
- The timed `next build` is a manual check during implementation, not a unit test.
