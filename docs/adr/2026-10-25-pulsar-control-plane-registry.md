# Pulsar Lab control-plane database for multi-tenant registry and fleet admin

## Context

`docs/adr/2026-10-21-single-vercel-multitenant-compute.md` consolidated all institutes into one Vercel project using `TENANTS_CONFIG_JSON`. That removed duplicate Vercel builds, but every tenant change still required editing the environment variable and redeploying. In addition, the primary domain of the Vercel project will be `pulsarlab.cl`, which must serve the Pulsar Lab company website and a staff-only control plane that monitors and manages every client institute.

## Decision

1. Treat `pulsarlab.cl` (`www.pulsarlab.cl`, `PULSAR_HOSTS`, and `DEV_TENANT_SLUG=pulsar` on `localhost`) as the **Pulsar platform host**, distinct from client institute hosts.
2. Store the canonical tenant registry in a dedicated Pulsar Supabase database (`public.platform_tenants`), guarded by `public.platform_staff` and audited in `public.platform_audit_log`.
3. Cache active rows from `platform_tenants` in server memory for 60 seconds and flush the cache immediately when staff create or update a tenant. Keep `TENANTS_CONFIG_JSON` as the bootstrap seed source and runtime fallback when `PULSAR_SUPABASE_URL` is unset (unit tests and isolated E2E).
4. Keep one Supabase project per client institute. On the Pulsar `/[locale]/admin` screen, query each institute in parallel (`Promise.allSettled` with a 4-second timeout) using its stored `service_role` key to check health (`site_themes` head count) and count 7-day / 30-day visits from `traffic_page_hits`.

## Options considered

- **Keep `TENANTS_CONFIG_JSON` as the only source and use the Vercel REST API to mutate env vars.** Rejected. Updating a Vercel env var still requires a new deployment for running functions to read the new configuration.
- **Vercel Edge Config for the registry.** Rejected. Edge Config has tight size limits for 6+ full credential bags and still needs a separate database for `platform_staff` authentication and `platform_audit_log`.
- **Merge all institutes into the Pulsar Postgres database with `tenant_id`.** Rejected. Each institute already runs its own Supabase Auth, Storage, and RLS boundary.

## Consequences

- **Positive:** Adding or editing a client institute in `/[locale]/admin` takes effect across warm instances within 60 seconds without a Vercel build or deploy.
- **Positive:** Pulsar staff can see live status (`Andando` / `Error`) and 7-day / 30-day visit counts across all institutes on one screen.
- **Risk & mitigation:** `platform_tenants` holds institute `service_role` keys, Resend keys, and payment encryption keys. RLS is enabled with zero `anon`/`authenticated` policies; only server code after `assertPulsarStaffSession()` reads or writes the table through `PULSAR_SUPABASE_SERVICE_ROLE_KEY`.
- **Risk & mitigation:** A slow or unreachable institute database must not break the Pulsar admin screen. Fleet telemetry uses `Promise.allSettled` and a 4-second timeout per institute.
- **Observability & tests:** Mutations log `[ge:server]` breadcrumbs and insert `platform_audit_log` rows listing changed field names (never secret values). Vitest covers host classification, registry cache/fallback, fleet telemetry isolation, and staff authorization.
- **Staff passwords:** `platform_staff.must_change_password` forces a new password before the fleet screens. The server sets the password with the Pulsar service role and clears the flag in the same action. The temporary password is not stored in git.
