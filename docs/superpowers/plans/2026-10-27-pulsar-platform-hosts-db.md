# Pulsar Platform Hosts in Database Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Store and manage the Pulsar platform host list in `public.platform_settings.pulsar_hosts` in the Pulsar Supabase database so staff can add or remove Pulsar domains from `/[locale]/admin` without a Vercel redeploy.

**Architecture:** `ensureTenantRegistryLoaded()` queries `platform_tenants` and `platform_settings` in parallel (60-second TTL cache) and populates `setDynamicPulsarHostsCache()` in `tenantRegistry.ts`. When `dynamicPulsarHosts` is loaded and non-empty, `getPulsarHosts()` returns that DB list directly (overriding `PULSAR_HOSTS` and `DEFAULT_PULSAR_HOSTS`). `isPulsarPlatformRequest()` awaits `ensureTenantRegistryLoaded()` so Server Components see DB-backed Pulsar hosts.

**Tech Stack:** Next.js App Router, TypeScript, Supabase (`@supabase/supabase-js`), Vitest, Testing Library, Lucide React.

## Global Constraints

- File size limit: ≤ 250 lines per file (`.cursor/rules/03-architecture.mdc`).
- All buttons and button-like CTAs include a leading Lucide icon (`.cursor/rules/16-admin-buttons-icons.mdc`).
- User-visible copy lives in `src/dictionaries/en.json` and `src/dictionaries/es.json` with neutral Latin American Spanish tuteo (`.cursor/rules/09-i18n-copy.mdc`, `.cursor/rules/40-neutral-spanish-copy.mdc`).
- Server mutations log with `[ge:server]` helpers (`.cursor/rules/25-server-error-logging.mdc`) and refresh UI via `revalidatePath` + `router.refresh()` (`.cursor/rules/27-post-mutation-ui-refresh.mdc`).
- Self-contained tests under `src/__tests__/` (`.cursor/rules/30-harness-self-contained-tests.mdc`).

---

### Task 1: Pulsar Migration, Dynamic Host Cache, and Validator

**Files:**
- Create: `supabase/pulsar-migrations/003_platform_settings_pulsar_hosts.sql`
- Modify: `src/lib/tenant/tenantRegistry.ts`
- Modify: `src/lib/tenant/tenantRequestContext.ts`
- Modify: `src/lib/pulsar/pulsarTenantSchema.ts`
- Test: `src/__tests__/lib/tenant/pulsarHostResolution.test.ts`
- Test: `src/__tests__/lib/pulsar/pulsarTenantSchema.test.ts`

**Interfaces:**
- Produces:
  - `setDynamicPulsarHostsCache(hosts: string[] | null): void` in `src/lib/tenant/tenantRegistry.ts`
  - `isDynamicPulsarHostsCacheLoaded(): boolean` in `src/lib/tenant/tenantRegistry.ts`
  - `validatePulsarPlatformHostsInput(rawHosts: unknown, existingTenants: readonly PulsarTenantRecord[]): { ok: true; hosts: string[] } | { ok: false; errorCode: string }` in `src/lib/pulsar/pulsarTenantSchema.ts`

- [ ] **Step 1: Write failing tests in `src/__tests__/lib/tenant/pulsarHostResolution.test.ts` and `src/__tests__/lib/pulsar/pulsarTenantSchema.test.ts`**

Add tests for `setDynamicPulsarHostsCache` overriding `PULSAR_HOSTS` / `DEFAULT_PULSAR_HOSTS` when set, and `validatePulsarPlatformHostsInput` rejecting empty hosts or collisions with existing tenant hosts.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/lib/tenant/pulsarHostResolution.test.ts src/__tests__/lib/pulsar/pulsarTenantSchema.test.ts`

- [ ] **Step 3: Create migration `supabase/pulsar-migrations/003_platform_settings_pulsar_hosts.sql` and update `tenantRegistry.ts`, `tenantRequestContext.ts`, and `pulsarTenantSchema.ts`**

Create `supabase/pulsar-migrations/003_platform_settings_pulsar_hosts.sql` with `public.platform_settings` (`id = 'default'`, `pulsar_hosts text[] not null`, RLS enabled with zero public policies). Update `tenantRegistry.ts` to support `dynamicPulsarHosts`, `tenantRequestContext.ts` so `isPulsarPlatformRequest()` calls `await ensureTenantRegistryLoaded()`, and `pulsarTenantSchema.ts` to export `validatePulsarPlatformHostsInput`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/lib/tenant/pulsarHostResolution.test.ts src/__tests__/lib/pulsar/pulsarTenantSchema.test.ts`

---

### Task 2: Pulsar Store Loader, Server Action, and Admin UI Card

**Files:**
- Modify: `src/lib/pulsar/pulsarTenantStore.ts`
- Modify: `src/app/[locale]/admin/actions.ts`
- Modify: `src/app/[locale]/admin/page.tsx`
- Create: `src/components/organisms/pulsar/PulsarAdminPlatformHostsCard.tsx`
- Modify: `src/components/organisms/pulsar/PulsarAdminFleetScreen.tsx`
- Modify: `src/dictionaries/es.json`
- Modify: `src/dictionaries/en.json`
- Modify: `docs/adr/2026-10-25-pulsar-control-plane-registry.md`
- Test: `src/__tests__/lib/pulsar/pulsarTenantStore.test.ts`
- Test: `src/__tests__/components/organisms/pulsar/PulsarAdminScreens.test.tsx`

**Interfaces:**
- Consumes: `setDynamicPulsarHostsCache`, `validatePulsarPlatformHostsInput`
- Produces:
  - `loadPulsarPlatformHostsForAdmin(): Promise<string[]>` in `src/lib/pulsar/pulsarTenantStore.ts`
  - `applyLocalMemoryPulsarHosts(hosts: string[]): string[]` in `src/lib/pulsar/pulsarTenantStore.ts`
  - `savePulsarPlatformHostsAction(args: { locale: string; rawHosts: string }): Promise<{ ok: true; hosts: string[] } | { ok: false; errorCode: string }>` in `src/app/[locale]/admin/actions.ts`
  - `PulsarAdminPlatformHostsCard` in `src/components/organisms/pulsar/PulsarAdminPlatformHostsCard.tsx`

- [ ] **Step 1: Write failing tests in `src/__tests__/lib/pulsar/pulsarTenantStore.test.ts` and `src/__tests__/components/organisms/pulsar/PulsarAdminScreens.test.tsx`**

Test loading `platform_settings.pulsar_hosts` in `ensureTenantRegistryLoaded()`, falling back when `platform_settings` is empty/unconfigured, and rendering/submitting `PulsarAdminPlatformHostsCard`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/lib/pulsar/pulsarTenantStore.test.ts src/__tests__/components/organisms/pulsar/PulsarAdminScreens.test.tsx`

- [ ] **Step 3: Implement store methods, `savePulsarPlatformHostsAction`, dictionaries, and `PulsarAdminPlatformHostsCard`**

Update `pulsarTenantStore.ts`, `src/app/[locale]/admin/actions.ts`, `src/app/[locale]/admin/page.tsx`, `PulsarAdminFleetScreen.tsx`, `PulsarAdminPlatformHostsCard.tsx`, `es.json`, `en.json`, and `docs/adr/2026-10-25-pulsar-control-plane-registry.md`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/lib/pulsar/pulsarTenantStore.test.ts src/__tests__/components/organisms/pulsar/PulsarAdminScreens.test.tsx src/__tests__/lib/tenant/tenantRegistry.test.ts`
