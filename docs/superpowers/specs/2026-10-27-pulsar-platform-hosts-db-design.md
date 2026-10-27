# Pulsar platform hosts in database (`platform_settings.pulsar_hosts`)

## Intent

Move the Pulsar platform host list out of environment-only configuration (`PULSAR_HOSTS`) into the Pulsar control-plane database (`public.platform_settings.pulsar_hosts`). Staff can add or remove Pulsar domains from `/[locale]/admin` without a Vercel redeploy, while `DEFAULT_PULSAR_HOSTS` and `PULSAR_HOSTS` remain as bootstrap and fallback values.

## Context and references

- Base control-plane spec: `docs/superpowers/specs/2026-10-25-pulsar-control-plane-and-admin-design.md`
- Base ADR: `docs/adr/2026-10-25-pulsar-control-plane-registry.md` (to be updated once approved)
- Note on client institutes: institute domains already live in `public.platform_tenants.hosts` in the Pulsar DB and already update without redeploy. This spec covers the domains of the Pulsar platform itself (`pulsarlab.cl`, `www.pulsarlab.cl`, `pulsarlab.vercel.app`, and any new Pulsar domain).

## Surfaces (Web vs PWA)

- **Tier B — desktop-only (no PWA tree)** per `.cursor/rules/05-pwa-mobile-native.mdc` and `.cursor/rules/43-pwa-surface-spec-check.mdc`.
- `/[locale]/admin` is the Pulsar staff control-plane back-office. It has no `useAppSurface()` or `src/components/pwa/` tree.
- No shared Tier A hooks, molecules, or actions are modified.

## Architecture

### 1. Database schema (`supabase/pulsar-migrations/003_platform_settings_pulsar_hosts.sql`)

- Create table `public.platform_settings`:
  - `id text primary key default 'default' check (id = 'default')`
  - `pulsar_hosts text[] not null default array['pulsarlab.cl', 'www.pulsarlab.cl', 'pulsarlab.vercel.app'] check (coalesce(array_length(pulsar_hosts, 1), 0) >= 1)`
  - `updated_at timestamptz not null default now()`
- Seed the singleton row `'default'` with `on conflict (id) do nothing`.
- Enable RLS on `public.platform_settings` with zero `anon` or `authenticated` policies. Only the server using `PULSAR_SUPABASE_SERVICE_ROLE_KEY` accesses the table.

### 2. Runtime cache and host resolution

- `src/lib/tenant/tenantRegistry.ts`:
  - Add `dynamicPulsarHosts: string[] | null` and `setDynamicPulsarHostsCache(hosts: string[] | null): void`.
  - `getPulsarHosts()` returns normalized hosts from `dynamicPulsarHosts` when loaded and non-empty (replaces the list completely when DB is active). Falls back to `PULSAR_HOSTS` env var, then `DEFAULT_PULSAR_HOSTS`, only when `dynamicPulsarHosts` is not loaded.
- `src/lib/pulsar/pulsarTenantStore.ts`:
  - `ensureTenantRegistryLoaded()` queries `platform_tenants` and `platform_settings` in parallel (`Promise.all`) within the existing 60-second TTL cache.
  - Expose `loadPulsarPlatformHostsForAdmin(): Promise<string[]>` and `applyLocalMemoryPulsarHosts(hosts: string[]): string[]` for local dev without `PULSAR_SUPABASE_URL`.
- `src/lib/tenant/tenantRequestContext.ts`:
  - `isPulsarPlatformRequest()` awaits `ensureTenantRegistryLoaded()` before calling `isPulsarRequestFromHeaderGet()` so Server Components always read the DB-backed host list.

### 3. Validation, server action, and audit

- New pure validator `validatePulsarPlatformHostsInput(rawHosts, existingTenants)` in `src/lib/pulsar/pulsarTenantSchema.ts`:
  - Normalizes hostnames via `normalizeHost`.
  - Rejects empty list (`missing_hosts`), invalid hostnames (`invalid_host`), or any hostname already assigned to a client institute in `platform_tenants.hosts` (`duplicate_host`).
- New server action `savePulsarPlatformHostsAction` in `src/app/[locale]/admin/actions.ts`:
  - Guards with `getPulsarStaffSession()` and `mustChangePassword` check.
  - Upserts `public.platform_settings` (`id = 'default'`), writes a `platform_audit_log` row (`action = 'platform.hosts_update'`, `tenant_slug = 'pulsar'`, `changed_fields = ['pulsar_hosts']`), calls `invalidateTenantRegistryCache()`, `revalidatePath`, and returns `{ ok: true, hosts }`.

### 4. Admin UI and i18n

- Add `PulsarAdminPlatformHostsCard.tsx` under `src/components/organisms/pulsar/` rendered in `PulsarAdminFleetScreen.tsx`:
  - Displays active Pulsar domains and allows staff to edit and save them with a leading-icon `Button` (`16-admin-buttons-icons.mdc`) and `router.refresh()` (`27-post-mutation-ui-refresh.mdc`).
- Add copy keys under `dict.pulsar.admin.platformHosts` in `src/dictionaries/es.json`, `src/dictionaries/en.json`, and `src/dictionaries/pt.json`.

## Risks and mitigation

- **Lockout risk if staff clear all Pulsar domains:** Validator requires at least one valid host, and `DEFAULT_PULSAR_HOSTS` remains as fallback if DB row is missing or query fails.
- **Collision between Pulsar host and institute host:** Both `validatePulsarTenantInput` and `validatePulsarPlatformHostsInput` cross-check against each other.
- **Node vs Middleware memory separation:** Both `src/proxy.ts` and `isPulsarPlatformRequest()` call `ensureTenantRegistryLoaded()` (60s TTL per runtime instance).

## Done when

- `supabase/pulsar-migrations/003_platform_settings_pulsar_hosts.sql` defines `public.platform_settings` with RLS enabled.
- `ensureTenantRegistryLoaded()` loads and caches `platform_settings.pulsar_hosts` alongside `platform_tenants`.
- `isPulsarPlatformRequest()` loads the registry cache before checking the request host.
- `savePulsarPlatformHostsAction` validates, persists, audits, invalidates cache, and revalidates paths.
- `PulsarAdminFleetScreen` renders `PulsarAdminPlatformHostsCard` so staff can edit Pulsar domains without redeploy.
- Self-contained Vitest tests cover DB host loading, fallback to `PULSAR_HOSTS` / `DEFAULT_PULSAR_HOSTS`, collision validation, and UI interaction.
