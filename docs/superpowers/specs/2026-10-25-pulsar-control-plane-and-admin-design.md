# Pulsar Lab control plane, multi-page landing, and tenant admin

## Intent

Serve `pulsarlab.cl` (`www.pulsarlab.cl`, and `DEV_TENANT_SLUG=pulsar` on `localhost`) as the Pulsar Lab platform host while every other known host continues to serve its institute. Move the tenant registry from `TENANTS_CONFIG_JSON` into a dedicated Pulsar Supabase database so adding or editing an institute does not require a Vercel redeploy. Provide a multi-page Pulsar marketing site and a staff-only admin screen that lists configured institutes, checks whether each institute's Supabase project responds, reads 7-day and 30-day page views from each institute's `traffic_page_hits`, and creates or edits tenant records.

## Context and references

- Supersedes the storage mechanism of [`docs/superpowers/specs/2026-10-21-single-vercel-multitenant-compute-design.md`](2026-10-21-single-vercel-multitenant-compute-design.md) while keeping its fail-closed isolation rules and per-tenant field contract.
- Governance ADR: `docs/adr/2026-10-25-pulsar-control-plane-registry.md` (written during implementation before closing the task, per `10-engineering-governance.mdc`, because Gate 0 hooks only unlock paths outside `docs/superpowers/` after spec approval).

## Architecture

### 1. Two host classes on one Vercel project

| Host | Mode | Database |
|---|---|---|
| `pulsarlab.cl`, `www.pulsarlab.cl` (or `PULSAR_HOSTS`), and `localhost` when `DEV_TENANT_SLUG=pulsar` | Platform (`pulsar`) | Pulsar Supabase project (`PULSAR_SUPABASE_*`) |
| Any hostname in `platform_tenants.hosts` (or `localhost` when `DEV_TENANT_SLUG=<slug>`) | Institute (`tenant`) | That institute's own Supabase project |
| Any other production hostname | Blocked | Returns HTTP 404 |

- Platform routes and institute routes do not share sessions. A cookie or Supabase user from an institute project cannot authenticate against Pulsar Auth, and a Pulsar staff session is not an admin on an institute host unless that person also has an account in that institute's Supabase project.
- On the platform host, institute-only routes (`/dashboard/**`, `/register`, `/clase-prueba`, `/encuesta`, `/pagar/**`, `/i/**`, `/events/**`, `/blog/**`, `/shop/**`) are not served; requests outside the Pulsar public pages and `/admin/**` redirect to the Pulsar home or return 404.
- On an institute host, `/admin` (the Pulsar control plane) returns 404 so the platform surface is never reachable from a client domain.

### 2. Platform environment variables (Vercel and `.env.local`)

Only platform-level variables remain in the environment once the database seed has run:

- `PULSAR_SUPABASE_URL` — Pulsar Supabase project URL.
- `PULSAR_SUPABASE_ANON_KEY` — Pulsar publishable / anon key (used only on the Pulsar host for staff sign-in).
- `PULSAR_SUPABASE_SERVICE_ROLE_KEY` — Server-only key used to read `platform_tenants`, verify `platform_staff`, and write audit rows. Never sent to the browser.
- `PULSAR_DATABASE_URL` — Direct / pooler Postgres URI for applying Pulsar migrations and running the one-time seed script.
- `PULSAR_HOSTS` — Optional comma-separated override; defaults to `pulsarlab.cl,www.pulsarlab.cl`.
- `DEV_TENANT_SLUG` — Local dev selector (`pulsar`, `nago`, `golden`, `liora`, `mimundo`, `espaciozenit`, `mozarthitos`).
- `CRON_SECRET`, `NEXT_PUBLIC_APP_URL` (local), and the existing `.env.local.e2e` variables.

**Bootstrap / fallback:** `TENANTS_CONFIG_JSON` is read by a one-time CLI seed script (`scripts/seed-pulsar-tenants-from-json.mjs`) to populate `platform_tenants` with the six current institutes. At runtime, if `PULSAR_SUPABASE_URL` is unset (for example in unit tests or `.env.local.e2e`), the registry falls back to `TENANTS_CONFIG_JSON` and then to single-tenant env so existing tests and the isolated E2E harness keep working without a second local Supabase instance.

### 3. Pulsar database schema (`supabase/pulsar-migrations/001_pulsar_control_plane.sql`)

Pulsar has its own Supabase project and its own migration folder (`supabase/pulsar-migrations/`) so platform tables are not created inside every institute database.

- **`public.platform_staff`**
  - `user_id uuid primary key references auth.users(id) on delete cascade`
  - `email text not null`
  - `created_at timestamptz not null default now()`
  - RLS enabled. Authenticated user may `select` only their own row (`auth.uid() = user_id`). Inserts and deletes happen with `service_role` or SQL bootstrap.
- **`public.platform_tenants`**
  - `slug text primary key` (lowercase slug: `^[a-z0-9-]+$`, cannot be `pulsar`).
  - `display_name text not null`
  - `is_enabled boolean not null default true`
  - `hosts text[] not null` (normalized lowercase hostnames; unique across rows via a trigger or helper check).
  - Every field from `TenantConfig`: `supabase_url`, `supabase_anon_key`, `supabase_service_role_key`, `database_url`, `brand_theme_slug`, `mail_tenant`, `resend_from_email`, `resend_api_key`, `public_url`, `payment_gateway_secret_encryption_key`, `whatsapp_access_token`, `whatsapp_phone_number_id`, `whatsapp_class_reminder_template_name`, `vapid_public_key`, `vapid_private_key`, `vapid_contact_email`, `google_maps_api_key`, `google_maps_map_id`, `kv_rest_api_url`, `kv_rest_api_token`, `debug_login`, `skip_initial_site_setup`.
  - `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()`.
  - RLS enabled with **no** `anon` or `authenticated` policies. Only the server using `PULSAR_SUPABASE_SERVICE_ROLE_KEY` can read or mutate this table.
- **`public.platform_audit_log`**
  - `id uuid primary key default gen_random_uuid()`
  - `actor_user_id uuid not null`
  - `actor_email text not null`
  - `action text not null` (`tenant.create`, `tenant.update`, `tenant.toggle_enabled`)
  - `tenant_slug text not null`
  - `changed_fields text[] not null` (field names only, never secret values)
  - `created_at timestamptz not null default now()`
  - RLS enabled, no client policies.

### 4. Runtime registry cache and zero-redeploy updates

- `loadTenantRegistryServer()` loads enabled rows from `platform_tenants` through a process-wide TTL cache (60 seconds).
- Creating, editing, or toggling a tenant in the Pulsar admin immediately invalidates the cache on the handling instance and calls `revalidatePath` for the admin routes. Other warm instances pick up the change within 60 seconds. No Vercel build or deploy is required.
- `next.config.ts` already allows `https://*.supabase.co/storage/v1/object/**` in `images.remotePatterns`, so a new institute on a standard `*.supabase.co` project works without rebuilding `next.config.ts`.
- Disabled tenants (`is_enabled = false`) behave like unknown hosts (HTTP 404) and are skipped by `/api/cron/*`.

### 5. Pulsar multi-page public site (on the Pulsar host)

Spanish-first (`es`) with `en` dictionary parity, using design tokens for the Pulsar brand:

1. **`/[locale]` (Inicio)** — Hero, value proposition (platform for academies, schools, and cultural institutes), feature summary, active client count, primary CTA to contact.
2. **`/[locale]/producto` (Producto)** — Modules included for each client institute: public landing & CMS, registrations & cohorts, attendance & learning routes, family/student portal & PWA, payments & receipts, events & shop.
3. **`/[locale]/clientes` (Clientes)** — Showcase of institutes running on Pulsar (sourced from enabled tenants or curated cards with link to each institute's `publicUrl`).
4. **`/[locale]/contacto` (Contacto)** — Lead form and direct contact links, plus header/footer link to `/[locale]/admin` for staff.

### 6. Pulsar staff admin (`/[locale]/admin` on the Pulsar host)

- **`/[locale]/admin/login`** — Email + password sign-in against Pulsar Supabase Auth (`PULSAR_SUPABASE_URL` / `PULSAR_SUPABASE_ANON_KEY` injected into `__GE_TENANT_PUBLIC__` when the host is Pulsar). If the signed-in user is not in `platform_staff`, sign them out and show an unauthorized message.
- **`/[locale]/admin` (Fleet overview)** — Desktop-first table and summary cards (Tier B per `05-pwa-mobile-native.mdc`):
  - Total tenants, tenants online (`ping` ok), total hits (7d), total hits (30d).
  - Per-tenant row: `display_name`, `slug`, `hosts`, `publicUrl` link, `is_enabled` badge, live status (`Andando` / `Error` + latency in ms), **Visitas 7d**, **Visitas 30d**, last hit timestamp, and `Editar` button.
  - Status and visits are fetched on the server in parallel (`Promise.allSettled` with a 4-second timeout per institute) using each institute's `supabaseUrl` + `supabaseServiceRoleKey`:
    - **Andando (ping):** `head: true, count: "exact"` query on `site_themes` (1 lightweight PostgREST round-trip).
    - **Visitas 7d / 30d:** `head: true, count: "exact"` queries on `traffic_page_hits` filtered by `created_at >= now() - interval '7 days'` and `30 days` (bounded count-only queries per `13-postgrest-pagination-bounded-queries.mdc`).
    - If an institute DB times out or errors, its row shows `Error` with the code, without failing the rest of the page.
- **`/[locale]/admin/tenants/new` and `/[locale]/admin/tenants/[slug]` (Create / Edit)**
  - Full form for all `TenantConfig` fields: identity & hosts (`slug`, `display_name`, `is_enabled`, `hosts`, `publicUrl`, `brandThemeSlug`, `skipInitialSiteSetup`, `debugLogin`), Supabase (`supabaseUrl`, `supabaseAnonKey`, `supabaseServiceRoleKey`, `databaseUrl`), Email (`mailTenant`, `resendFromEmail`, `resendApiKey`), Payments & KV (`paymentGatewaySecretEncryptionKey`, `kvRestApiUrl`, `kvRestApiToken`), Integrations (`googleMapsApiKey`, `googleMapsMapId`, `vapidPublicKey`, `vapidPrivateKey`, `vapidContactEmail`, `whatsappAccessToken`, `whatsappPhoneNumberId`, `whatsappClassReminderTemplateName`).
  - Button **Probar conexión** runs a server action that tests the entered `supabaseUrl` + `supabaseServiceRoleKey` before or after saving.
  - Every create/update validates with Zod (32-byte base64 payment key when present, valid URLs, normalized non-empty hosts, no host collision with `pulsarlab.cl` or another tenant), writes a `platform_audit_log` row, flushes the in-memory registry cache, calls `revalidatePath`, and calls `router.refresh()` on the client (`27-post-mutation-ui-refresh.mdc`).

## Risks and mitigation

- **Leaking institute secrets to the browser:** `platform_tenants` has no client RLS policies. Only the Pulsar `/[locale]/admin/tenants/[slug]` server component loads the row after `assertPulsarStaffSession()` succeeds. Public Pulsar pages and institute pages never serialize `platform_tenants`.
- **Cold-start latency when Pulsar DB is queried:** Cache the tenant list in memory for 60 seconds per server instance; middleware/request resolution reads the cached map instead of querying Postgres on every asset or page request.
- **One broken institute slowing down `/admin`:** Wrap each institute's ping + `traffic_page_hits` count in `Promise.allSettled` with an `AbortSignal.timeout(4000)`.
- **Existing tests and E2E:** Keep the `TENANTS_CONFIG_JSON` and single-env fallback when `PULSAR_SUPABASE_URL` is unset so `npm test` and `test:e2e:precommit` need no external Pulsar project.

## Done when

- `supabase/pulsar-migrations/001_pulsar_control_plane.sql` defines `platform_staff`, `platform_tenants`, and `platform_audit_log` with RLS enabled and no public policies on `platform_tenants`.
- `scripts/seed-pulsar-tenants-from-json.mjs` upserts the 6 institutes from `.env.local` (`TENANTS_CONFIG_JSON`) into `platform_tenants` and can also bootstrap the first `platform_staff` user by email.
- Requests to `pulsarlab.cl`, `www.pulsarlab.cl`, or `localhost` with `DEV_TENANT_SLUG=pulsar` resolve to the Pulsar platform mode; requests to any institute host resolve to that institute from `platform_tenants` (with 60s TTL cache and fallback to `TENANTS_CONFIG_JSON` when `PULSAR_SUPABASE_URL` is unset).
- Unknown hosts and disabled tenants (`is_enabled = false`) return 404.
- Pulsar host serves `/[locale]`, `/[locale]/producto`, `/[locale]/clientes`, and `/[locale]/contacto` with `es.json` and `en.json` copy (neutral Latin American Spanish per `40-neutral-spanish-copy.mdc`, Lucide icons on buttons per `16-admin-buttons-icons.mdc`).
- Pulsar host serves `/[locale]/admin/login`, `/[locale]/admin`, `/[locale]/admin/tenants/new`, and `/[locale]/admin/tenants/[slug]`, guarded by `assertPulsarStaffSession()`.
- `/[locale]/admin` displays every tenant's status (`Andando` / `Error` + latency) and 7d / 30d visit counts from each tenant's `traffic_page_hits`, isolated via `Promise.allSettled`.
- Creating or editing a tenant from `/[locale]/admin` validates input, logs to `platform_audit_log`, flushes the registry cache, and makes the new or updated host work without redeploying Vercel.
- Self-contained Vitest tests cover host mode resolution (`pulsar` vs `tenant` vs `404`), DB registry caching + fallback, telemetry aggregation with one failing tenant, tenant form validation (including host collision and 32-byte payment key), and staff authorization.
- `docs/adr/2026-10-25-pulsar-control-plane-registry.md` documents the control-plane decision.

## Manual QA (user-owned, per `32-manual-qa-user-owned.mdc`)

- Create the Pulsar Supabase project (or provide its credentials in `.env.local`), run the Pulsar migration and seed script, and sign in at `http://localhost:3000/es/admin` with `npm run dev:pulsar`.
- Point `pulsarlab.cl` and institute domains to the single Vercel project and verify both the Pulsar landing and one institute domain in a browser.

## Out of scope

- Migrating institute data into a single shared database (each institute keeps its own Supabase project).
- Automated DNS / Vercel domain attachment via the Vercel REST API (domains are still added in the Vercel dashboard or CLI; app config requires no redeploy).
- Billing / subscription invoicing from Pulsar to institutes.
