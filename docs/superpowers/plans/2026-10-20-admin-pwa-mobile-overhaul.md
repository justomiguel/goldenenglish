# Admin PWA & Mobile-Native Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` or `tdd` to implement this plan task-by-task after Gate 0 approval.

**Goal:** Transform `/dashboard/admin/**` on mobile and installed PWA (`web-mobile` and `pwa-mobile`) into a thumb-first, high-density operational experience across 4 phases without altering the `web-desktop` surface or breaking `ADMIN_TOUR_ANCHORS`.

**Specs:**
- Program Index: [`docs/superpowers/specs/2026-10-20-admin-pwa-mobile-overhaul-program-design.md`](../specs/2026-10-20-admin-pwa-mobile-overhaul-program-design.md)
- Phase 1: [`docs/superpowers/specs/2026-10-20-admin-pwa-phase1-shell-and-header-design.md`](../specs/2026-10-20-admin-pwa-phase1-shell-and-header-design.md)
- Phase 2: [`docs/superpowers/specs/2026-10-20-admin-pwa-phase2-mobile-directories-design.md`](../specs/2026-10-20-admin-pwa-phase2-mobile-directories-design.md)
- Phase 3: [`docs/superpowers/specs/2026-10-20-admin-pwa-phase3-registrations-and-finance-design.md`](../specs/2026-10-20-admin-pwa-phase3-registrations-and-finance-design.md)
- Phase 4: [`docs/superpowers/specs/2026-10-20-admin-pwa-phase4-home-academic-events-design.md`](../specs/2026-10-20-admin-pwa-phase4-home-academic-events-design.md)

---

## Phase 1: Admin PWA Shell, Thumb-Zone Navigation & Zero Dead Space

### Task 1.1: Dictionary keys for `AdminPwaTabBar`
- **Files:**
  - Modify: `src/dictionaries/es.json`, `src/dictionaries/en.json`, `src/dictionaries/pt.json` (`dashboard.adminNav.pwaTabBarAria`, `pwaTabHome`, `pwaTabRegistrations`, `pwaTabFinance`, `pwaTabPeople`, `pwaTabMore`)
  - Test: `npx vitest run src/__tests__/i18n/dictionaries.test.ts`

### Task 1.2: Pure tab active resolver & `AdminPwaTabBar` + shared drawer state
- **Files:**
  - Create: `src/lib/dashboard/resolveAdminPwaTabActive.ts`
  - Create: `src/__tests__/lib/dashboard/resolveAdminPwaTabActive.test.ts`
  - Create: `src/components/dashboard/AdminMobileShellContext.tsx`
  - Create: `src/components/dashboard/AdminPwaTabBar.tsx`
  - Create: `src/__tests__/components/AdminPwaTabBar.test.tsx`
  - Modify: `src/components/dashboard/AdminMobileDrawer.tsx` (consume shared `AdminMobileShellContext` when available so both top button and bottom `Más` tab control the same drawer)
  - Modify: `src/components/dashboard/AdminDashboardShell.tsx` (wrap with `AdminMobileShellProvider`, mount `AdminPwaTabBar`, wrap scroll area with `PwaPullToRefresh` on mobile, adjust `data-admin-main` mobile padding to `px-3 pt-2.5 pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:px-8 md:py-5`)
  - Modify: `src/components/dashboard/AdminHelpLauncher.tsx` (offset mobile FAB to `bottom-[calc(3.75rem+env(safe-area-inset-bottom,0px))] right-3`)
  - Test: `npx vitest run src/__tests__/lib/dashboard/resolveAdminPwaTabActive.test.ts src/__tests__/components/AdminPwaTabBar.test.tsx src/__tests__/components/AdminHelpLauncher.test.tsx`

### Task 1.3: Remove nested `PwaPageShell` & compress mobile headers/KPIs
- **Files:**
  - Modify: `src/components/pwa/organisms/AdminUsersScreenNarrow.tsx`
  - Modify: `src/components/pwa/organisms/AdminRegistrationsScreenNarrow.tsx`
  - Modify: `src/components/pwa/organisms/AdminUserDetailPwa.tsx`
  - Modify: `src/components/dashboard/AdminPageHeader.tsx`
  - Modify: `src/components/dashboard/AdminSectionSubnav.tsx`
  - Modify: `src/components/dashboard/AdminStatCard.tsx`
  - Modify: `src/components/dashboard/AdminPeopleStatsRow.tsx`
  - Modify: `src/components/dashboard/AdminRegistrationsStatsRow.tsx`
  - Modify: `src/components/dashboard/AdminEventsStatsRow.tsx`
  - Test: `npx vitest run src/__tests__/components/AdminPageHeader.test.tsx src/__tests__/components/AdminUsersScreenEntry.test.tsx`

---

## Phase 2: Mobile Directories & Lists (Students, Parents, Teachers, Users)

### Task 2.1: Dictionary keys for mobile directory filter/sort sheet & bulk bar
- **Files:**
  - Modify: `src/dictionaries/es.json`, `src/dictionaries/en.json`, `src/dictionaries/pt.json` (`admin.users.mobileSortButton`, `mobileFilterSortTitle`, `mobileSortSectionTitle`, `mobileSortAsc`, `mobileSortDesc`, `mobileApplyFilters`, `mobileClearSelection`, `mobileSelectedCount`)
  - Test: `npx vitest run src/__tests__/i18n/dictionaries.test.ts`

### Task 2.2: `AdminUsersFilterSortSheet`, `AdminUsersMobileToolbar`, and `AdminUsersBulkBarMobile`
- **Files:**
  - Create: `src/components/pwa/molecules/AdminUsersFilterSortSheet.tsx`
  - Create: `src/__tests__/components/AdminUsersFilterSortSheet.test.tsx`
  - Create: `src/components/pwa/molecules/AdminUsersMobileToolbar.tsx`
  - Create: `src/__tests__/components/AdminUsersMobileToolbar.test.tsx`
  - Create: `src/components/pwa/molecules/AdminUsersBulkBarMobile.tsx`
  - Create: `src/__tests__/components/AdminUsersBulkBarMobile.test.tsx`
  - Test: `npx vitest run src/__tests__/components/AdminUsersFilterSortSheet.test.tsx src/__tests__/components/AdminUsersMobileToolbar.test.tsx src/__tests__/components/AdminUsersBulkBarMobile.test.tsx`

### Task 2.3: Compact 2-line `AdminUsersPwaListItem` & `AdminUsersPwaList` integration
- **Files:**
  - Modify: `src/components/pwa/molecules/AdminUsersPwaListItem.tsx`
  - Create: `src/__tests__/components/AdminUsersPwaListItem.test.tsx`
  - Modify: `src/components/pwa/molecules/AdminUsersPwaList.tsx`
  - Modify: `src/components/pwa/organisms/AdminUsersScreenNarrow.tsx`
  - Test: `npx vitest run src/__tests__/components/AdminUsersPwaListItem.test.tsx src/__tests__/components/AdminUsersScreenEntry.test.tsx`

---

## Phase 3: Critical Conversion & Cash Flows (Registrations + Finance Hub)

### Task 3.1: Dictionary keys for mobile registrations sheet & CTAs
- **Files:**
  - Modify: `src/dictionaries/es.json`, `src/dictionaries/en.json`, `src/dictionaries/pt.json` (`admin.registrations.moreActionsAria`, `mobileSortButton`, `mobileSortSheetTitle`, `whatsappCta`)
  - Test: `npx vitest run src/__tests__/i18n/dictionaries.test.ts`

### Task 3.2: Triage-first `AdminRegistrationPwaCard`, `AdminRegistrationActionsSheet`, & `AdminRegistrationsSortSheet`
- **Files:**
  - Create: `src/components/pwa/molecules/AdminRegistrationActionsSheet.tsx`
  - Create: `src/components/pwa/molecules/AdminRegistrationsSortSheet.tsx`
  - Modify: `src/components/pwa/molecules/AdminRegistrationPwaCard.tsx`
  - Modify: `src/components/pwa/molecules/AdminRegistrationsPwaList.tsx`
  - Modify: `src/components/molecules/RegistrationListToolbar.tsx`
  - Create: `src/__tests__/components/AdminRegistrationPwaCard.test.tsx`
  - Create: `src/__tests__/components/AdminRegistrationsPwaList.test.tsx`
  - Test: `npx vitest run src/__tests__/components/AdminRegistrationPwaCard.test.tsx src/__tests__/components/AdminRegistrationsPwaList.test.tsx`

### Task 3.3: Finance Hub mobile KPI strip, touch-sized matrix filters, and inbox switcher
- **Files:**
  - Modify: `src/components/dashboard/admin/finance/FinanceHubKpiStrip.tsx`
  - Modify: `src/components/dashboard/admin/finance/CohortCollectionsMatrixClient.tsx`
  - Modify: `src/components/dashboard/admin/finance/FinanceInboxClient.tsx`
  - Test: `npx vitest run src/__tests__/components/FinanceInboxClient.test.tsx src/__tests__/components/CohortCollectionsMatrixClient.test.tsx`

---

## Phase 4: Mobile Operational Home (`AdminHubHome`) & Academic / Events Polish

### Task 4.1: Mobile action-first priority in `AdminHubHomeOpsGrid` & `AdminHubWorkQueuesRow`
- **Files:**
  - Modify: `src/components/dashboard/AdminHubHomeOpsGrid.tsx`
  - Modify: `src/components/dashboard/AdminHubWorkQueuesRow.tsx`
  - Modify: `src/__tests__/components/AdminHubHome.test.tsx`
  - Test: `npx vitest run src/__tests__/components/AdminHubHome.test.tsx`

### Task 4.2: Mobile sort & tab strip polish for Events and Academic Hub
- **Files:**
  - Modify: `src/components/organisms/AdminEventsScreen.tsx`
  - Modify: `src/__tests__/components/AdminEventsScreen.test.tsx`
  - Modify: `src/components/dashboard/admin/events/AdminEventDetailTabs.tsx`
  - Modify: `src/components/organisms/AcademicHubCohortBoard.tsx`
  - Test: `npx vitest run src/__tests__/components/AdminEventsScreen.test.tsx src/__tests__/components/AcademicHubCohortBoard.test.tsx`

### Task 4.3: Full Verification Suite
- **Commands:**
  - `npx vitest run src/__tests__/lib/admin-tutorials/`
  - `npx vitest run src/__tests__/i18n/dictionaries.test.ts`
  - `npx tsc --noEmit`
  - `npm run lint`
