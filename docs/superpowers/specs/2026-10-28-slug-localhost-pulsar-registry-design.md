# `{slug}` on Pulsar hosts and `{slug}.localhost`

## Intent

One Next process serves Centro Listo **and** every institute.

Staff create a tenant with a new `slug` in Pulsar `/[locale]/admin`. That institute is live at once on `{slug}.{pulsar-host}` (for example `nago.centrolisto.cl` or `acme.pulsarlab.cl`) until they attach a real extra domain on the tenant `hosts` row.

Local is the same rule. You start Centro Listo (`npm run dev:pulsar` → `http://localhost:3000`). Then `http://nago.localhost:3000` is Nagô on that same process. No second compile. No `TENANTS_CONFIG_JSON`.

Registry at runtime: Pulsar `public.platform_tenants` via `ensureTenantRegistryLoaded`.

## Surfaces (Web vs PWA)

Request-time tenant binding only (`tenantFromHeaderGet`, `isLocalDevHost`, `isPulsarRequestFromHeaderGet`, `resolveTenantByHost`, `getRequestPublicSiteUrl`). No screen tree change.

- **Web and PWA:** existing landings, register, login, dashboards. `useAppSurface` / `SurfaceMountGate` unchanged. The Host picks the institute; those trees wear that theme.
- **Tier A / Tier B:** no shared hook or prop break.

## Why not `TENANTS_CONFIG_JSON`

ADR `docs/adr/2026-10-25-pulsar-control-plane-registry.md` already made Pulsar the canonical registry. Local `run-dev-with-target.mjs` still lists slugs from the JSON. That is the wrong source.

Product and local runtime:

1. `PULSAR_SUPABASE_URL` + `PULSAR_SUPABASE_SERVICE_ROLE_KEY` required.
2. `ensureTenantRegistryLoaded` fills `setDynamicTenantsCache` from enabled `platform_tenants`.
3. `{slug}.localhost` and `{slug}.{pulsar-host}` → `getTenantBySlug(slug)`.
4. Extra custom domains on the tenant `hosts` column → `resolveTenantByHost` (unchanged).

`TENANTS_CONFIG_JSON` stays only for Vitest in-process fixtures, isolated E2E, and the one-shot seed script. Not for picking a tenant in local or production.

## Host map

Pulsar apex hosts today: `centrolisto.cl`, `www.centrolisto.cl`, `pulsarlab.cl`, `www.pulsarlab.cl`, `pulsarlab.vercel.app` (plus any row in `platform_settings.pulsar_hosts`).

| Host | Result |
|---|---|
| `centrolisto.cl`, `www.centrolisto.cl`, `pulsarlab.cl`, … | Centro Listo (platform) |
| `nago.centrolisto.cl` | Institute `nago` |
| `acme.centrolisto.cl` | New institute `acme` as soon as the row exists |
| `nago.pulsarlab.cl` | Institute `nago` (any Pulsar host works as the suffix) |
| `capoeiranago.cl` (tenant `hosts`) | Institute `nago` (real extra domain, same as today) |
| `localhost:3000` with `DEV_TENANT_SLUG=pulsar` | Centro Listo |
| `pulsar.localhost:3000` | Centro Listo |
| `nago.localhost:3000` | Institute `nago` on the **same** local process |
| Unknown `{slug}.…` with no enabled row | 404 |

Reserved first labels (never a tenant): `www`, `pulsar`, and any label that would make the full host itself a Pulsar apex.

One label only. `foo.nago.centrolisto.cl` is out of scope.

## New tenant journey

1. Staff create slug `acme` in Pulsar admin. Keys, brand, theme go on that row.
2. DNS wildcard already points `*.centrolisto.cl` (and later other Pulsar apexes) at the same Vercel project.
3. `https://acme.centrolisto.cl` serves Acme. No Vercel env edit. No JSON.
4. When Acme buys `acme.cl`, add that host on the tenant row. Both URLs work. The subdomain can stay as a fallback.

## Resolver rules (`src/lib/tenant/tenantRegistry.ts`)

Add a pure helper, e.g. `tenantSlugFromPulsarSubdomain(host, pulsarHosts)`:

1. Normalize host (strip port).
2. If the host **is** a Pulsar apex → platform. Stop.
3. If host is `{label}.localhost` → local. `pulsar` → platform. Else `getTenantBySlug(label)`.
4. If host is `{label}.{pulsarApex}` where `{pulsarApex}` is in `getPulsarHosts()` (treat `www.` apex and bare apex as the same suffix family) → `getTenantBySlug(label)`.
5. Else `resolveTenantByHost` (custom domains).
6. Bare `localhost` / `127.0.0.1` → `DEV_TENANT_SLUG` / `x-ge-tenant`. With `dev:pulsar` that is Centro Listo.

`isLocalDevHost`: `localhost`, loopback, and `*.localhost`.

`getRequestPublicSiteUrl`:

- Local `*.localhost` → `http://{host}` including port.
- `{slug}.{pulsar-host}` → `https://{that host}` (not the tenant `publicUrl`, so the preview subdomain stays itself until they set a canonical extra domain).
- Custom domain on `hosts` → tenant `publicUrl` as today.

## Local how-to (after implementation)

1. `.env.local` has Pulsar keys. Start **Centro Listo**: `npm run dev:pulsar` → `http://localhost:3000`.
2. Keep that process. Open `http://nago.localhost:3000/es`. Same origin family, other tenant.
3. Repeat for `mozarthitos`, `mimundo`, `liora`, `golden`, `espaciozenit`, or any new slug already in Pulsar.
4. CentroListo flow videos record those real URLs.

`run-dev-with-target.mjs` must not require `TENANTS_CONFIG_JSON`. `--target` only sets `DEV_TENANT_SLUG` for bare localhost.

## Ops (user)

- Vercel: attach `*.centrolisto.cl` (wildcard) to the Pulsar project. Repeat per Pulsar apex you want as a preview suffix.
- DNS: `CNAME *` → Vercel for `centrolisto.cl`.
- Manual QA (user): `localhost:3000` is Centro Listo; `nago.localhost:3000/es` is Nagô without restarting.

## Preview hosts on each institute row

Prod today matches `platform_tenants.hosts`. Persist `{slug}.{pulsar-apex}` on every institute so `nago.centrolisto.cl` resolves even before the slug helper ships.

Rules:

1. Apex family from `getPulsarHosts()` / `platform_settings.pulsar_hosts`. Strip a leading `www.` so the host is `nago.centrolisto.cl`, not `nago.www.centrolisto.cl`.
2. Merge those preview hosts on tenant save and on registry load. Do not write `*.localhost`.
3. Pulsar migration backfills existing rows from current `pulsar_hosts`.
4. Custom domains stay first. Preview hosts are extra.

## Out of scope

- Deleting `TENANTS_CONFIG_JSON` from Vitest or isolated E2E.
- Writing `nago.localhost` into `platform_tenants.hosts`.
- Multi-label hosts (`a.b.centrolisto.cl`).
- Per-tenant Next compiles or extra ports.
- Recording CentroListo videos in this change.

## Done when

- Dynamic cache has `nago`. Host `nago.localhost:3000` → slug `nago`. Host `nago.centrolisto.cl` → slug `nago`. Host `centrolisto.cl` → platform. No JSON on that path.
- Same for any current Pulsar host as suffix (`nago.pulsarlab.cl`).
- New slug `acme` in the cache → `acme.centrolisto.cl` and `acme.localhost:3000` without a custom domain.
- Unknown slug subdomain → 404.
- Custom domain on `hosts` still wins (`capoeiranago.cl` → nago).
- Vitest covers the map with `setDynamicTenantsCache` + `setDynamicPulsarHostsCache`.
- `run-dev-with-target.mjs` starts without the JSON.

## Risks

| Risk | Mitigation |
|---|---|
| No wildcard DNS | Subdomain 404s on the public internet. Local `*.localhost` still works. Document the Vercel/DNS step. |
| `www` as slug | Reserved. `www.centrolisto.cl` stays platform. |
| Cookie / auth mix | Distinct hosts. Nagô cookies do not apply to Centro Listo. |
| Canonical SEO on preview subdomain | `getRequestPublicSiteUrl` uses the request host for `{slug}.{pulsar-host}` until they add `publicUrl` / extra domain. |
| Pulsar cache empty on first request | `proxy.ts` already awaits `ensureTenantRegistryLoaded`. |
