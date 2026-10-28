# Plan — `{slug}.localhost` and `{slug}.{pulsar-host}`

**Spec:** `docs/superpowers/specs/2026-10-28-slug-localhost-pulsar-registry-design.md`

## Steps

1. Pure helper `tenantSlugFromPulsarSubdomain` + Vitest (`src/__tests__/lib/tenant/pulsarSubdomain.test.ts`).
2. Wire `tenantFromHeaderGet`, `isPulsarRequestFromHeaderGet`, `tenantHostBlockStatus`, `isLocalDevHost` in `tenantRegistry.ts`.
3. `getRequestPublicSiteUrl` keeps `http://nago.localhost:3000` and `https://nago.centrolisto.cl`.
4. `run-dev-with-target.mjs` starts without `TENANTS_CONFIG_JSON`.
5. Next `allowedDevOrigins` for `*.localhost` if the version needs it.
6. Vercel CLI: add `*.centrolisto.cl` on the Pulsar project.
7. Persist `{slug}.{pulsar-apex}` on each `platform_tenants.hosts` (save + load merge + Pulsar SQL backfill). No `*.localhost`.

## Tests

- `npx vitest run src/__tests__/lib/tenant/pulsarSubdomain.test.ts`
- `npx vitest run src/__tests__/lib/tenant/tenantRegistry.test.ts`
- `npx vitest run src/__tests__/lib/tenant/pulsarHostResolution.test.ts`
- `npx vitest run src/__tests__/lib/site/requestPublicUrl.test.ts`
