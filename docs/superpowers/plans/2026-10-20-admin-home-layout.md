# Admin home layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Each admin arranges the cards on `/dashboard/admin`, starting from one factory order that puts urgent work before the traffic chart.

**Architecture:** A pure module owns the catalog, sizes, presets, and row packing. Postgres stores one jsonb row per admin. The home page reads that row and renders one order on every surface. Wide screens use the saved column span. Phones stack full width and edit through a bottom sheet.

**Tech Stack:** Next.js App Router, Vitest, Supabase RLS, `@dnd-kit`, existing `Modal` and `useAppSurface()`.

## Global Constraints

- One layout per admin. No institute layout and no lock.
- Sizes are `s` (4), `m` (6), `l` (8), `full` (12). Traffic minimum is `l`. Collections minimum is `m`.
- `useAppSurface()` chooses the editor. It does not choose a second order.
- Phone editor is a `Modal` sheet above `AdminPwaTabBar`. Targets are at least 44px.
- Copy in `en.json`, `es.json`, and `pt.json`. Spanish is neutral tuteo.
- No file over 250 lines.
- Migration `217_admin_home_layouts.sql` (216 is taken). Update `masterdb.sql`.
- Personal save does not call `recordSystemAudit`. Failures log `[ge:server]`.
- Factory home mounts every `ADMIN_HOME_RUNTIME_ANCHORS` entry. Payments stay before birthdays.

---

### Task 1: Pure layout

**Files:**
- Create: `src/lib/dashboard/adminHomeLayout.ts`
- Test: `src/__tests__/lib/dashboard/adminHomeLayout.test.ts`

- [ ] Write tests for factory order, packing, hide, minimum size, presets, and unknown ids.
- [ ] Implement the module until `npx vitest run src/__tests__/lib/dashboard/adminHomeLayout.test.ts` passes.

### Task 2: Persistence

**Files:**
- Create: `supabase/migrations/217_admin_home_layouts.sql`
- Modify: `supabase/migrations/masterdb.sql`
- Create: `docs/adr/2026-10-20-admin-home-layout.md`
- Test: `src/__tests__/db/admin_home_layouts_migration.test.ts`
- Create: `src/lib/dashboard/loadAdminHomeLayout.ts`
- Create: `src/app/[locale]/dashboard/admin/adminHomeLayoutActions.ts`
- Test: `src/__tests__/app/adminHomeLayoutActions.test.ts`

- [ ] Migration with RLS: `profile_id = auth.uid()` and `is_current_user_admin()`.
- [ ] Save and delete actions reject a non-admin and write only the session user.

### Task 3: New widget data

**Files:**
- Create: `src/lib/dashboard/loadAdminHomeExtraWidgets.ts`
- Test: `src/__tests__/lib/dashboard/loadAdminHomeExtraWidgets.test.ts`

- [ ] People pulse, three upcoming events, shop head count, changelog slice.
- [ ] Collections loader runs only when that card is visible.

### Task 4: Editor UI

**Files:**
- Create: `src/hooks/useAdminHomeArrange.ts`
- Create: `src/components/dashboard/AdminHubHomeGrid.tsx`
- Create: `src/components/dashboard/AdminHubCardMenu.tsx`
- Create: `src/components/pwa/molecules/AdminHubCardSheet.tsx`
- Create: `src/components/dashboard/AdminHubHomeArrange.tsx`
- Modify: `src/components/dashboard/AdminHubHome.tsx`
- Modify: `src/app/[locale]/dashboard/admin/page.tsx`
- Modify: dictionaries and `catalogEntriesLatest.ts`
- Test: arrange menu and factory order tests

- [ ] Wire factory render so payments precede traffic and birthdays.
- [ ] Desktop menu and phone sheet share the same actions.
- [ ] Done revalidates `/${locale}/dashboard/admin` and the client calls `router.refresh()`.
