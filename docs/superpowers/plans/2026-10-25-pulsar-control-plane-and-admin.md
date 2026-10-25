# Pulsar Lab Control Plane, Multi-Page Landing, and Tenant Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve `pulsarlab.cl` as the Pulsar Lab multi-page website and staff-only control plane backed by a dedicated Pulsar Supabase database (`platform_tenants`, `platform_staff`, `platform_audit_log`), while keeping every client institute on its own Supabase project with zero-redeploy tenant updates.

**Architecture:** Host resolution distinguishes the Pulsar platform host (`pulsarlab.cl`, `www.pulsarlab.cl`, `DEV_TENANT_SLUG=pulsar`) from client institute hosts. A 60-second in-memory server cache loads enabled rows from `platform_tenants` (with fallback to `TENANTS_CONFIG_JSON` when `PULSAR_SUPABASE_URL` is unset), and `/[locale]/admin` queries each institute's `site_themes` and `traffic_page_hits` in parallel with `Promise.allSettled` and a 4-second timeout.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, Supabase (`@supabase/supabase-js`, `@supabase/ssr`), Zod, Lucide React, Vitest.

## Global Constraints

- No file in `src/` may exceed 250 lines (`.cursor/rules/03-architecture.mdc`).
- Only modules under `src/lib/supabase/` may import `@supabase/ssr` or value exports from `@supabase/supabase-js` (`.cursor/rules/12-supabase-app-boundaries.mdc`).
- All user-visible strings must exist in both `src/dictionaries/en.json` and `src/dictionaries/es.json` with neutral Latin American Spanish tuteo (`.cursor/rules/09-i18n-copy.mdc`, `.cursor/rules/40-neutral-spanish-copy.mdc`).
- All buttons and button-like CTAs must include a leading Lucide icon (`.cursor/rules/16-admin-buttons-icons.mdc`).
- Server errors and warnings must use `[ge:server]` helpers from `src/lib/logging/serverActionLog.ts` (`.cursor/rules/25-server-error-logging.mdc`).
- Mutations must call `revalidatePath` on the server and `router.refresh()` on the client (`.cursor/rules/27-post-mutation-ui-refresh.mdc`).

---

### Task 1: Pulsar SQL Migration, Supabase Boundary Client, and Host Classification

**Files:**
- Create: `supabase/pulsar-migrations/001_pulsar_control_plane.sql`
- Create: `src/lib/supabase/pulsar.ts`
- Modify: `src/lib/tenant/tenantRegistry.ts`
- Modify: `src/lib/tenant/tenantRequestContext.ts`
- Modify: `scripts/precommit-verify.mjs`
- Test: `src/__tests__/lib/tenant/pulsarHostResolution.test.ts`

**Interfaces:**
- Produces:
  - `PULSAR_SLUG = "pulsar"`
  - `isPulsarHost(host: string | null | undefined): boolean`
  - `isPulsarRequestFromHeaderGet(headerGet: (name: string) => string | null): boolean`
  - `setDynamicTenantsCache(tenants: TenantConfig[] | null): void`
  - `isPulsarPlatformRequest(): Promise<boolean>`
  - `isPulsarSupabaseConfigured(): boolean`
  - `readPulsarSupabasePublicEnv(): { url: string; anonKey: string }`
  - `createPulsarAdminClient(): SupabaseClient`
  - `createPulsarServerClient(): Promise<SupabaseClient>`

- [ ] **Step 1: Write the failing test `src/__tests__/lib/tenant/pulsarHostResolution.test.ts`**
- [ ] **Step 2: Run Vitest on the new test and verify it fails**
- [ ] **Step 3: Create `supabase/pulsar-migrations/001_pulsar_control_plane.sql`, `src/lib/supabase/pulsar.ts`, and update `tenantRegistry.ts` + `tenantRequestContext.ts`**
- [ ] **Step 4: Re-run the test and verify it passes**

---

### Task 2: DB-Backed Tenant Registry Cache, Validation, and Seed Script

**Files:**
- Create: `src/lib/pulsar/pulsarTenantMapper.ts`
- Create: `src/lib/pulsar/pulsarTenantStore.ts`
- Create: `src/lib/pulsar/pulsarTenantSchema.ts`
- Create: `scripts/seed-pulsar-tenants-from-json.mjs`
- Modify: `scripts/run-dev-with-target.mjs`
- Modify: `package.json`
- Test: `src/__tests__/lib/pulsar/pulsarTenantStore.test.ts`
- Test: `src/__tests__/lib/pulsar/pulsarTenantSchema.test.ts`

**Interfaces:**
- Consumes: `createPulsarAdminClient`, `isPulsarSupabaseConfigured`, `setDynamicTenantsCache`, `TenantConfig`
- Produces:
  - `PulsarTenantRecord` (extends `TenantConfig` with `displayName: string`, `isEnabled: boolean`, `updatedAt: string | null`)
  - `ensureTenantRegistryLoaded(): Promise<void>`
  - `invalidateTenantRegistryCache(): void`
  - `loadAllPulsarTenantsForAdmin(): Promise<PulsarTenantRecord[]>`
  - `loadPulsarTenantBySlugForAdmin(slug: string): Promise<PulsarTenantRecord | null>`
  - `validatePulsarTenantInput(input: unknown, existingTenants: PulsarTenantRecord[], editingSlug?: string): { ok: true; value: ValidatedPulsarTenantInput } | { ok: false; errorCode: string }`

- [ ] **Step 1: Write failing tests for schema validation and store caching/fallback**
- [ ] **Step 2: Run Vitest to confirm failure**
- [ ] **Step 3: Implement mapper, schema, store, and CLI seed script**
- [ ] **Step 4: Run Vitest and verify green**

---

### Task 3: Fleet Telemetry Loader (`Andando` Ping + `traffic_page_hits` 7d/30d) and Staff Auth Guard

**Files:**
- Create: `src/lib/pulsar/pulsarStaffAuth.ts`
- Create: `src/lib/pulsar/loadPulsarFleetTelemetry.ts`
- Test: `src/__tests__/lib/pulsar/loadPulsarFleetTelemetry.test.ts`
- Test: `src/__tests__/lib/pulsar/pulsarStaffAuth.test.ts`

**Interfaces:**
- Consumes: `createPulsarServerClient`, `createPulsarAdminClient`, `createAdminClientFromCredentials`, `PulsarTenantRecord`
- Produces:
  - `getPulsarStaffSession(): Promise<{ userId: string; email: string } | null>`
  - `assertPulsarStaffSession(): Promise<{ userId: string; email: string }>`
  - `TenantTelemetrySnapshot`: `{ slug: string; status: "online" | "error"; latencyMs: number | null; visits7d: number | null; visits30d: number | null; lastHitAt: string | null; errorCode: string | null }`
  - `probeSingleTenantConnection(supabaseUrl: string, serviceRoleKey: string): Promise<{ ok: boolean; latencyMs: number; errorCode: string | null }>`
  - `loadPulsarFleetTelemetry(tenants: PulsarTenantRecord[]): Promise<Record<string, TenantTelemetrySnapshot>>`

- [ ] **Step 1: Write failing tests for `loadPulsarFleetTelemetry` (including one failing tenant) and `pulsarStaffAuth`**
- [ ] **Step 2: Run Vitest to confirm failure**
- [ ] **Step 3: Implement `pulsarStaffAuth.ts` and `loadPulsarFleetTelemetry.ts`**
- [ ] **Step 4: Run Vitest and verify green**

---

### Task 4: Middleware, Layout Routing, and i18n Dictionaries for Pulsar

**Files:**
- Modify: `src/proxy.ts`
- Modify: `src/lib/supabase/middleware.ts`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/[locale]/layout.tsx`
- Modify: `src/dictionaries/es.json`
- Modify: `src/dictionaries/en.json`
- Test: `src/__tests__/proxy/proxy.test.ts`

**Interfaces:**
- Consumes: `isPulsarRequestFromHeaderGet`, `isPulsarPlatformRequest`, `ensureTenantRegistryLoaded`, `readPulsarSupabasePublicEnv`
- Produces: `dict.pulsar` namespace in `es.json` and `en.json`; platform-aware middleware and layouts.

- [ ] **Step 1: Add `pulsar` dictionary keys to `es.json` and `en.json`**
- [ ] **Step 2: Update `proxy.ts`, `middleware.ts`, `app/layout.tsx`, and `app/[locale]/layout.tsx`**
- [ ] **Step 3: Run dictionary parity check and proxy tests**

---

### Task 5: Pulsar Multi-Page Marketing Website (`/`, `/producto`, `/clientes`, `/contacto`)

**Files:**
- Create: `src/components/organisms/pulsar/PulsarSiteChrome.tsx`
- Create: `src/components/organisms/pulsar/PulsarLandingHome.tsx`
- Create: `src/components/organisms/pulsar/PulsarProductoView.tsx`
- Create: `src/components/organisms/pulsar/PulsarClientesView.tsx`
- Create: `src/components/organisms/pulsar/PulsarContactoView.tsx`
- Modify: `src/app/[locale]/page.tsx`
- Create: `src/app/[locale]/producto/page.tsx`
- Create: `src/app/[locale]/clientes/page.tsx`
- Create: `src/app/[locale]/contacto/page.tsx`
- Test: `src/__tests__/components/organisms/pulsar/PulsarLandingPages.test.tsx`

- [ ] **Step 1: Write component tests for the 4 Pulsar public views**
- [ ] **Step 2: Implement the 4 Pulsar organisms and route pages**
- [ ] **Step 3: Run Vitest on the new tests**

---

### Task 6: Pulsar Control-Plane Admin (`/admin/login`, `/admin`, `/admin/tenants/new`, `/admin/tenants/[slug]`)

**Files:**
- Create: `src/app/[locale]/admin/actions.ts`
- Create: `src/app/[locale]/admin/login/page.tsx`
- Create: `src/app/[locale]/admin/page.tsx`
- Create: `src/app/[locale]/admin/tenants/new/page.tsx`
- Create: `src/app/[locale]/admin/tenants/[slug]/page.tsx`
- Create: `src/components/organisms/pulsar/PulsarAdminLoginForm.tsx`
- Create: `src/components/organisms/pulsar/PulsarAdminFleetScreen.tsx`
- Create: `src/components/organisms/pulsar/PulsarAdminTenantForm.tsx`
- Create: `src/components/organisms/pulsar/PulsarAdminTenantFieldGroups.tsx`
- Test: `src/__tests__/components/organisms/pulsar/PulsarAdminScreens.test.tsx`

- [ ] **Step 1: Write tests for `PulsarAdminFleetScreen` and `PulsarAdminTenantForm`**
- [ ] **Step 2: Implement server actions (`savePulsarTenantAction`, `togglePulsarTenantEnabledAction`, `testPulsarTenantConnectionAction`, `signOutPulsarStaffAction`) and admin screens**
- [ ] **Step 3: Run Vitest, `precommit-verify.mjs`, `check-supabase-boundaries.mjs`, and `tsc --noEmit`**
