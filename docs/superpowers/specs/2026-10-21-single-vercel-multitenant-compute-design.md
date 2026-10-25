# Single Vercel project, one database per institute

## Intent

Serve every institute from one Vercel project and one local `.env.local` file. Delete the per-institute `.env.local.<slug>` files. Keep one Supabase project per institute. Choose the database, brand, mail domain, Resend key, Storage URLs, image hosts, and public origin from the request `Host` in production and from `DEV_TENANT_SLUG` on `localhost`.

When `TENANTS_CONFIG_JSON` is unset (isolated `.env.local.e2e` and unit tests), behavior falls back to the single-env variables.

## Done when

- A request to a configured host uses that tenant's Supabase URL, anon key, and service role key.
- Outbound mail uses that tenant's `resendApiKey` and `resendFromEmail` when set. Otherwise it uses `RESEND_API_KEY` / `RESEND_FROM_EMAIL`. Secret keys never reach the browser.
- Brand, landing, blog, shop, badge, and section Storage URLs use the request tenant's `supabaseUrl` during SSR.
- `next.config.ts` allows `next/image` to optimize `https://*.supabase.co/storage/v1/object/**` and every host in `TENANTS_CONFIG_JSON`, not only the build-time `NEXT_PUBLIC_SUPABASE_URL`.
- `verifyUserPassword` authenticates against the request tenant's Supabase project.
- `completeInitialSiteSetupAction` checks wizard theme eligibility against `tenant.brandThemeSlug` (falling back to `getSiteBrandThemeSlug()`).
- Bulk CSV import background work (`after(() => runBulkImportJobWithKv(...))`) runs inside `runWithTenant(tenant, ...)` so `createAdminClient` and synthetic mail domains use the request tenant after the HTTP response ends.
- Middleware traffic beacon (`event.waitUntil(insertTrafficPageHit(...))`) resolves the request tenant before `waitUntil` and wraps the insert in `runWithTenant(tenant, ...)` so page hits never fall back to the default database after the response closes.
- KV import keys include the tenant slug when a tenant is active (`import:job:<slug>:<id>`), and `importJobKv` uses `tenant.kvRestApiUrl` / `tenant.kvRestApiToken` when provided.
- In-memory rate limit buckets (`loginIdentifierRateLimit`, `passwordResetRateLimit`, and event public routes) include the tenant slug or host in the bucket key so one institute's traffic does not throttle another on warm Fluid Compute instances.
- When multi-tenant mode is on, `loadPaymentGatewayEncryptionKeyRaw32` reads only `tenant.paymentGatewaySecretEncryptionKey` (ALS or the HTTP tenant). It does not read `PAYMENT_GATEWAY_SECRET_ENCRYPTION_KEY`. Single-tenant mode still reads that env var.
- `VIEW_AS_COOKIE_NAME` and blog preview tokens include the tenant slug in their HMAC payload (`tenantSlug`) so a cookie or token from one institute is rejected on another host.
- `app/manifest.ts`, `app/robots.ts`, `app/sitemap.ts`, `app/[locale]/blog/[slug]/opengraph-image.tsx`, and `app/[locale]/logro/[slug]/[token]/page.tsx` opt into per-request rendering (`force-dynamic`) instead of build-time prerendering or shared ISR across hosts.
- `app/offline/page.tsx` does not bake one institute's brand name into the precached service worker shell.
- `loadActiveTheme` cache keys and invalidation tags are scoped per tenant (`site-theme-active:<slug>`) so editing one institute's theme does not flush all others.
- When multi-tenant mode is on, WhatsApp, Web Push VAPID, Google Maps, Resend, the mail domain, KV, and `debugLogin` read only the tenant object. They do not fall back to process env. Single-tenant mode still uses those env vars. Private keys never reach the browser.
- `createAdminClient`, `readRequestSupabasePublicEnv`, `readSupabasePublicEnv`, and `loadActiveTheme` fail closed when multi-tenant mode is on and no tenant resolves. They do not use `SUPABASE_SERVICE_ROLE_KEY` or the default theme cache.
- `SKIP_INITIAL_SITE_SETUP=1` closes the first-run wizard only when `TENANTS_CONFIG_JSON` is unset. With the JSON set, only `tenant.skipInitialSiteSetup` closes it, including `bootstrapFirstAdminAction`.
- `next.config.ts` inlines empty `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` when the JSON lists any institute. `npm run dev:<slug>` does not copy that institute's Supabase keys into process env. The browser reads `__GE_TENANT_PUBLIC__`.
- The root layout sets `__GE_TENANT_PUBLIC__` with the client component `TenantPublicEnvBootstrap` during render. A raw `<script>` is not used, because React 19 does not run it on the client.
- Client-reachable modules read the ALS tenant through `src/lib/tenant/alsTenantAccessor.ts`. Only server code imports `tenantAls.ts` (`node:async_hooks`). No webpack alias or module replacement is used.
- `getRequestPublicSiteUrl` returns `http://<host>` for `localhost` and `127.0.0.1`, including the port.
- `scripts/verify-tenants-json.mjs` checks `.env.local` when that file exists. Each tenant must include `paymentGatewaySecretEncryptionKey`, `kvRestApiUrl`, and `kvRestApiToken`.
- A canary test proves one tenant's service role key, payment key, and KV job key do not leak into another tenant, and that a shared env secret is ignored while multi-tenant mode is on.
- `.env.local` is the **only** local product env file and holds `TENANTS_CONFIG_JSON` formatted as readable multi-line JSON wrapped in single quotes (`TENANTS_CONFIG_JSON='[\n  {\n    ...\n  }\n]'`), compatible with `@next/env`.
- `scripts/migrate-public-assets-lib.mjs` (`readEnvFile`) supports multi-line single-quoted and double-quoted dotenv values (or delegates to `@next/env`) so every CLI script (`run-dev-with-target.mjs`, `apply-migration-all-tenants*.mjs`, `migrate-public-assets.mjs`) parses multi-line `TENANTS_CONFIG_JSON`.
- `scripts/precommit-verify.mjs` enforces a mechanical guard (`checkTenantEnvBoundaries`): `process.env.<PER_TENANT_VAR>` may only be read inside the approved adapter boundary files (`src/lib/tenant/`, `src/lib/supabase/`, `src/lib/email/resendEmailProvider.ts`, `src/lib/register/registrationMailTenant.ts`, `src/lib/site/`, `src/lib/theme/`, `src/lib/push/loadVapidConfig.ts`, `src/lib/push/subscribePushClient.ts`, `src/lib/whatsapp/sendMetaClassReminderTemplate.ts`, `src/lib/payment-gateways/loadPaymentGatewayEncryptionKey.ts`, `src/lib/import/importJobKv.ts`, `src/lib/auth/`). Any new direct `process.env` read in product code fails `npm run precommit`.
- `.cursor/rules/19-multi-tenant-local-vercel-targets.mdc` and `docs/runbooks/add-new-tenant.md` document that any new per-institute setting must be added to `TenantConfig` (`src/lib/tenant/tenantRegistry.ts`) and `TENANTS_CONFIG_JSON`, not as a standalone env var.
- `src/lib/resend/client.ts` (unused module-level `new Resend(process.env.RESEND_API_KEY)` singleton) and its test are removed so no caller can bypass `ResendEmailProvider`.
- An unknown production host returns 404. Invalid JSON returns 503.
- `/api/cron/*` runs the job once per tenant. Cron auth stays header-only.
- The browser receives only public fields (`url`, `anonKey`, `origin`, `googleMapsApiKey`, `googleMapsMapId`, `vapidPublicKey`, `debugLogin`) for the active tenant.
- Vitest covers registry parsing, host match, admin client selection, image host patterns, wizard slug resolution, KV tenant scoping, HMAC tenant binding, and multi-line `.env.local` parsing.

## Out of scope

- One shared Postgres with `tenant_id`.
- Deleting the extra Vercel projects in the Vercel dashboard (do that after domain cutover).
- Modifying `.env.local.e2e` or the isolated Playwright harness (`34-precommit-e2e.mdc`).

## Decision: full per-tenant schema in `TENANTS_CONFIG_JSON`

Store a server-only JSON array in `TENANTS_CONFIG_JSON`. Every per-institute value lives inside its object:

| Field | Required | Scope | Purpose |
|---|---|---|---|
| `slug` | Yes | Server | Stable tenant identifier (`espaciozenit`, `golden`, `liora`, `mimundo`, `nago`, `mozarthitos`). |
| `hosts` | Yes | Server | Production hostnames for this institute (`["capoeiranago.cl", "www.capoeiranago.cl"]`). |
| `supabaseUrl` | Yes | Server + Browser (`__GE_TENANT_PUBLIC__.url`) | Supabase project URL. |
| `supabaseAnonKey` | Yes | Server + Browser (`__GE_TENANT_PUBLIC__.anonKey`) | Supabase publishable / anon key. |
| `supabaseServiceRoleKey` | Yes | Server only | Supabase `service_role` key. Never serialized to the browser. |
| `databaseUrl` | No | Server / CLI scripts only | Direct or Session pooler Postgres URI (`postgresql://...`) used by migration scripts. Never serialized to the browser. |
| `brandThemeSlug` | No | Server | Pins `site_themes.slug` when the database holds multiple themes; `null`/omitted uses `is_active = true`. |
| `publicUrl` | No | Server + Browser (`__GE_TENANT_PUBLIC__.origin`) | Canonical HTTPS origin (`https://www.capoeiranago.cl`). Defaults to `https://${hosts[0]}`. |
| `mailTenant` | No | Server | Domain for synthetic minor/tutor emails (`<local>@<mailTenant>`, `<dni>@parents.<mailTenant>`). |
| `resendFromEmail` | No | Server | Verified sender address in Resend (`info@capoeiranago.cl`). |
| `resendApiKey` | No | Server only | Institute's Resend API key (`re_...`). Never serialized to the browser. |
| `paymentGatewaySecretEncryptionKey` | No | Server only | 32-byte base64 AES key for payment credentials. Required in the local product JSON. Ignored process-env fallback while multi-tenant mode is on. |
| `whatsappAccessToken` | No | Server only | Meta Cloud API bearer token for class reminders. |
| `whatsappPhoneNumberId` | No | Server only | Meta WhatsApp phone number ID. |
| `whatsappClassReminderTemplateName` | No | Server only | Approved WhatsApp template name. |
| `vapidPublicKey` | No | Server + Browser (`__GE_TENANT_PUBLIC__.vapidPublicKey`) | Web Push VAPID public key. |
| `vapidPrivateKey` | No | Server only | Web Push VAPID private key. |
| `vapidContactEmail` | No | Server only | Web Push VAPID contact email (`mailto:`). |
| `googleMapsApiKey` | No | Server + Browser (`__GE_TENANT_PUBLIC__.googleMapsApiKey`) | Browser Google Maps / Places key. |
| `googleMapsMapId` | No | Server + Browser (`__GE_TENANT_PUBLIC__.googleMapsMapId`) | Vector map ID (`DEMO_MAP_ID` fallback). |
| `kvRestApiUrl` | No | Server only | Upstash Redis REST URL for this institute. Required in the local product JSON. Ignored process-env fallback while multi-tenant mode is on. |
| `kvRestApiToken` | No | Server only | Upstash Redis REST token for this institute. Required in the local product JSON. Ignored process-env fallback while multi-tenant mode is on. |
| `debugLogin` | No | Browser (`__GE_TENANT_PUBLIC__.debugLogin`) | Enables verbose `[goldenenglish:login]` console traces for this tenant. |
| `skipInitialSiteSetup` | No | Server | Optional boolean to bypass the first-run wizard for a specific tenant. |

## Phase 3 audit findings & guardrails

1. **`event.waitUntil(insertTrafficPageHit)` in middleware (`src/lib/analytics/scheduleTrafficPageHitFromMiddleware.ts`).**
   `insertTrafficPageHit` calls `await createAdminClient()` inside `event.waitUntil(...)`. Once the middleware response returns, `headers()` inside `waitUntil` is not guaranteed. Resolve `tenant = tenantFromHeaderGet((n) => request.headers.get(n))` synchronously in `scheduleTrafficPageHitFromMiddleware` and pass it into `runWithTenant(tenant, () => insertTrafficPageHit(...))`.
2. **In-memory rate limiters shared across tenants on warm Fluid Compute instances (`src/lib/auth/loginIdentifierRateLimit.ts`, `src/lib/auth/passwordResetRateLimit.ts`, `src/app/api/events/**`).**
   Fluid Compute reuses the same Node process across concurrent requests for all 6 domains. Scope bucket keys by tenant/host (`${tenantSlug ?? "default"}|${ip}|...`).
3. **Unused global Resend singleton (`src/lib/resend/client.ts`).**
   Reads `process.env.RESEND_API_KEY` at import time. Delete `src/lib/resend/client.ts` and `src/__tests__/resend/client.test.ts` so all email sends go through `ResendEmailProvider`.
4. **Multi-line pretty JSON in `.env.local` + parser support (`scripts/migrate-public-assets-lib.mjs`, `.env.local`).**
   `@next/env` (dotenv-expand) requires multi-line values to be wrapped in quotes (`TENANTS_CONFIG_JSON='[\n  ...\n]'`); unquoted multi-line JSON is truncated at line 1. Update `readEnvFile` in `scripts/migrate-public-assets-lib.mjs` to parse multi-line quoted values, and format `.env.local` with 2-space indented JSON inside single quotes.
5. **Mechanical enforcement for future per-tenant settings (`scripts/precommit-verify.mjs`, `.cursor/rules/19-multi-tenant-local-vercel-targets.mdc`).**
   - Add `checkTenantEnvBoundaries()` to `scripts/precommit-verify.mjs`: scan `src/` (excluding `__tests__` and the canonical adapter files) and fail the commit if any file reads `process.env.` for tenant-scoped or external service variables (`SUPABASE_`, `NEXT_PUBLIC_SUPABASE_`, `RESEND_`, `MAIL_TENANT`, `SITE_BRAND_THEME_SLUG`, `NEXT_PUBLIC_APP_URL`, `WHATSAPP_`, `VAPID_`, `NEXT_PUBLIC_VAPID_`, `NEXT_PUBLIC_GOOGLE_MAPS_`, `PAYMENT_GATEWAY_`, `KV_REST_`, `NEXT_PUBLIC_DEBUG_LOGIN`, `SKIP_INITIAL_SITE_SETUP`).
   - Update `.cursor/rules/19-multi-tenant-local-vercel-targets.mdc` so agents and contributors are required to add any new tenant-differentiated setting to `TenantConfig` in `src/lib/tenant/tenantRegistry.ts` and read it via `resolveRequestTenant()` / `getAlsTenant()`.

ADR: `docs/adr/2026-10-21-single-vercel-multitenant-compute.md`.
