# Phase 1: Admin PWA Shell, Thumb-Zone Navigation & Zero Dead Space

**Date:** 2026-10-20
**Status:** Draft (awaiting user approval — Gate 0)
**Program:** [`2026-10-20-admin-pwa-mobile-overhaul-program-design.md`](2026-10-20-admin-pwa-mobile-overhaul-program-design.md) — Phase 1 of 4
**Closes:** D01, D02, D03, D04

---

## 1. Intent

Give staff on mobile and installed PWA (`web-mobile` and `pwa-mobile`) a thumb-zone navigation shell and reclaim over `450px` of above-the-fold vertical height on every Admin page. Remove nested `100dvh` wrappers and double horizontal padding so the first operational list row is visible without scrolling.

---

## 2. Context & Current Defects

1. **Static shell without thumb navigation (`D02`)**:
   - `src/components/dashboard/AdminDashboardShell.tsx` renders `AdminSidebar` (`hidden md:flex`) and `AdminChromeHeader`. On mobile, staff must reach the top-left corner (`AdminMobileDrawer`) for every section switch.
   - `src/components/portal/PortalShell.tsx` already solves this for families and students with `PortalTabBar` at the bottom and `PwaPullToRefresh` around `<main>`.
2. **Nested `dvh` containers and double padding (`D01`)**:
   - `AdminDashboardShell.tsx` wraps `<main>` in `<div data-admin-main className="... overflow-y-auto px-safe pb-safe pt-5 md:px-8 md:py-5">`.
   - Child mobile screens (`AdminUsersScreenNarrow.tsx`, `AdminRegistrationsScreenNarrow.tsx`, `AdminUserDetailPwa.tsx`) wrap their content again in `<PwaPageShell>` (`min-h-dvh`) plus `<div className="min-h-dvh bg-[var(--color-muted)] px-3 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-[max(0.75rem,env(safe-area-inset-top,0px))]">`.
3. **Help FAB collision (`D03`)**:
   - `src/components/dashboard/AdminHelpLauncher.tsx` places the mobile help trigger at `fixed inset-x-0 bottom-0 z-40`. A bottom tab bar (`min-h-[56px]`) sits at `bottom-0 z-50`.
4. **Above-the-fold header and KPI bloat (`D04`)**:
   - `src/components/dashboard/AdminPageHeader.tsx` uses `mt-5 min-h-[8.75rem] rounded-3xl px-6 py-8` and a `h-16 w-16` icon badge (`~180px` tall on phones).
   - `src/components/dashboard/AdminPeopleStatsRow.tsx`, `AdminRegistrationsStatsRow.tsx`, and `AdminEventsStatsRow.tsx` stack 3–4 full-height `AdminStatCard` blocks vertically in 1 column (`~260px–340px` tall on phones).
   - `src/components/dashboard/AdminSectionSubnav.tsx` wraps pages in `space-y-6` (`24px` gaps).

---

## 3. Architecture & Component Specifications

### 3.1 `AdminPwaTabBar` (New Component)

- **Path:** `src/components/dashboard/AdminPwaTabBar.tsx` (`< 140` lines, `'use client'`).
- **Helper Path:** `src/lib/dashboard/resolveAdminPwaTabActive.ts` (`< 80` lines, pure function).
- **Visibility:** Rendered on mobile viewports (`md:hidden`) inside `AdminDashboardShell`.
- **Destinations (5 thumb-zone items):**
  1. **Home (`home`)**:
     - `href`: `/${locale}/dashboard/admin`
     - Icon: `LayoutDashboard` (`lucide-react`)
     - Label: `dict.dashboard.adminNav.pwaTabHome` (*Inicio* / *Home* / *Início*)
     - Active when: `pathname === base`
  2. **Registrations (`registrations`)**:
     - `href`: `/${locale}/dashboard/admin/registrations`
     - Icon: `ClipboardList`
     - Label: `dict.dashboard.adminNav.pwaTabRegistrations` (*Admisiones* / *Admissions* / *Admissões*)
     - Badge: `newRegistrationsCount` (rendered when `> 0`, capped at `99+`)
     - Active when: `pathname.startsWith("${base}/registrations")`
  3. **Finance (`finance`)**:
     - `href`: `/${locale}/dashboard/admin/finance` (or cohort-scoped `financeHrefForPathname` when on a cohort route)
     - Icon: `CircleDollarSign`
     - Label: `dict.dashboard.adminNav.pwaTabFinance` (*Finanzas* / *Finance* / *Finanças*)
     - Active when: `pathname.startsWith("${base}/finance")`
  4. **People (`people`)**:
     - `href`: `/${locale}/dashboard/admin/students`
     - Icon: `Users`
     - Label: `dict.dashboard.adminNav.pwaTabPeople` (*Personas* / *People* / *Pessoas*)
     - `data-tour`: preserves `ADMIN_TOUR_ANCHORS.navUsers` when on mobile or delegates to sidebar/drawer
     - Active when: `pathname` starts with `${base}/students`, `${base}/parents`, `${base}/teachers`, or `${base}/users`
  5. **More / Menu (`more`)**:
     - Action: Button (`type="button"`) that opens the existing `AdminMobileDrawer` full navigation sheet (or highlights active when on `/academic`, `/events`, `/institute`, `/messages`, `/settings`, `/cms`, `/analytics`, `/audit`, `/coupons`, `/promotions`, `/badges`, `/calendar`, `/glossary`, `/changelog`, `/site-setup`).
     - Icon: `LayoutGrid`
     - Label: `dict.dashboard.adminNav.pwaTabMore` (*Más* / *More* / *Mais*)
     - Badge: `recentInboundMessagesCount` (dot or count when `> 0` so unread messages surface in the thumb bar too).
     - `aria-expanded`: reflects drawer open state.

- **Styling & Ergonomics:**
  - `fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md md:hidden`
  - `style={{ paddingBottom: "max(0.375rem, env(safe-area-inset-bottom, 0px))" }}`
  - Each tab item has `min-h-[52px]` (`>= 44px` touch target), `text-[0.6875rem] font-semibold leading-tight`, active state `text-[var(--color-primary)]`, inactive state `text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]`.

### 3.2 Shared Mobile Drawer Trigger State (`useAdminMobileDrawerState`)

- **Path:** `src/components/dashboard/AdminMobileShellContext.tsx` (`< 90` lines, `'use client'`).
- **Purpose:** Allows both the top-left `AdminMobileDrawer` button (kept as secondary trigger or replaced cleanly) and the bottom-right `Más` tab in `AdminPwaTabBar` to open/close the same `DashboardMobileDrawerPortal` instance without duplicating the drawer DOM or breaking `data-tour` anchors inside `AdminSidebarNavContent`.
- **Tour Anchor Invariant:**
  - `AdminSidebar` keeps `data-tour="admin-sidebar"`, `data-tour="admin-nav-users"`, `data-tour="admin-nav-academic"`, `data-tour="admin-nav-institute"`, and `data-tour="admin-chrome-sign-out"`.

### 3.3 `AdminDashboardShell` & `PwaPullToRefresh` Integration

- **Path:** `src/components/dashboard/AdminDashboardShell.tsx` (`< 160` lines).
- **Changes:**
  1. Wrap the mobile scroll container content with `PwaPullToRefresh` (`src/components/pwa/molecules/PwaPullToRefresh.tsx`) or a slim client wrapper `AdminMainScrollArea.tsx` (`< 90` lines) that enables `PwaPullToRefresh` when `surface !== "web-desktop"`.
  2. Adjust `<div data-admin-main>` padding on mobile:
     - Change `px-safe pb-safe pt-5 md:px-8 md:py-5` to:
       `px-3 pt-2.5 pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:px-8 md:py-5`
     - This gives a single, consistent `12px` (`px-3`) horizontal gutter on mobile and reserves `76px + safe-area` at the bottom so the last card or `TablePagination` is never covered by `AdminPwaTabBar`.
  3. Mount `<AdminPwaTabBar>` at the bottom of `AdminDashboardShell`.

### 3.4 Remove Redundant Inner `PwaPageShell` & `min-h-dvh` Wrappers (`D01`)

Update the following narrow organisms so they render directly inside `AdminDashboardShell`'s `<main>` without a second `min-h-dvh`, second `bg-[var(--color-muted)]`, or double horizontal padding:

1. `src/components/pwa/organisms/AdminUsersScreenNarrow.tsx`:
   - Remove `<PwaPageShell>` and `<div className="min-h-dvh bg-[var(--color-muted)] px-3 pb-[...] pt-[...]">`.
   - Render `<div className="mx-auto max-w-[var(--layout-max-width)] space-y-3">`.
2. `src/components/pwa/organisms/AdminRegistrationsScreenNarrow.tsx`:
   - Remove `<PwaPageShell>` and `<div className="min-h-dvh bg-[var(--color-muted)] px-3 pb-[...] pt-[...]">`.
   - Render `<div className="mx-auto max-w-[var(--layout-max-width)] space-y-3">`.
3. `src/components/pwa/organisms/AdminUserDetailPwa.tsx`:
   - Remove `<PwaPageShell>` and `<div className="min-h-dvh bg-[var(--color-muted)] px-3 pb-[...] pt-[...]">`.
   - Render `<div className="mx-auto max-w-[var(--layout-max-width)] space-y-3">`.

*(Note: `PwaPageShell.tsx` itself remains in the repo for any standalone non-admin screens or tests that import it directly).*

### 3.5 `AdminChromeHeader` Mobile Compression

- **Path:** `src/components/dashboard/AdminChromeHeader.tsx` (`< 160` lines).
- **Changes:**
  - Reduce mobile vertical padding from `py-3` to `py-2` (`min-h-[52px]` instead of `68px`).
  - Keep all existing `data-tour` attributes (`admin-chrome-header`, `admin-chrome-teacher-portal`, `admin-chrome-back-to-site`, `admin-chrome-bell`) intact.
  - On `< md`, hide the external `backToSite` icon button in the top bar because `backToSite` remains accessible in the mobile drawer / header menu, **or** keep it compact (`h-10 w-10`) while ensuring `data-tour="admin-chrome-back-to-site"` stays visible on `md+` where `@admin-tours` runs (and remains mounted in DOM). To guarantee zero L3 tour regressions at any viewport, keep `data-tour="admin-chrome-back-to-site"` rendered and visible, tightening gap from `gap-2` to `gap-1.5` on mobile.

### 3.6 `AdminHelpLauncher` Bottom Offset on Mobile (`D03`)

- **Path:** `src/components/dashboard/AdminHelpLauncher.tsx` (`< 175` lines).
- **Changes:**
  - When `sheet` is `true` (`surface !== "web-desktop"`), change the fixed container bottom offset from `bottom-0` to `bottom-[calc(3.75rem+env(safe-area-inset-bottom,0px))] right-3` for the FAB trigger, while the open `AdminHelpChatPanel` sheet still anchors cleanly above the tab bar (`z-50`).
  - Reduce mobile FAB size from `h-12 w-12` to `h-11 w-11` (`44×44px` WCAG touch target) so it takes less screen area over lists.

### 3.7 Compact Mobile `AdminPageHeader` & `AdminSectionSubnav` (`D04`)

1. **`src/components/dashboard/AdminPageHeader.tsx`** (`< 110` lines):
   - **Desktop (`md:` and up):** Unchanged (`md:mt-5 md:min-h-[8.75rem] md:rounded-3xl md:px-6 md:py-8`, icon box `md:h-16 md:w-16`).
   - **Mobile (`< md`):**
     - Container: `mt-2 rounded-2xl px-3.5 py-3` (no `min-h-[8.75rem]` on mobile).
     - Icon box: `h-10 w-10 rounded-xl` with `h-5 w-5` icon (instead of `h-16 w-16` with `h-9 w-9`).
     - Title (`h1`): `text-lg font-bold leading-snug md:text-3xl`.
     - Lead paragraph: `mt-0.5 line-clamp-2 text-xs leading-relaxed md:mt-2 md:line-clamp-none md:text-base`.
     - Action slot: full-width or compact row with `mt-2.5 md:mt-0`.
     - **Height savings:** Drops from `~180px` to `~72px` on mobile (`>100px` saved on every admin page).

2. **`src/components/dashboard/AdminSectionSubnav.tsx`** (`< 100` lines):
   - Change outer wrapper from `space-y-6` to `space-y-3 md:space-y-6`.
   - Tighten mobile tab link padding to `min-h-10 px-3 py-1.5 text-xs sm:text-sm sm:py-2.5` so `Alumnos / Padres / Profesores / Todas las cuentas` fits cleanly in a single horizontal scroll strip without vertical bloat.

### 3.8 Compact Horizontal Mobile KPI Strip (`AdminStatCard` & Stats Rows) (`D04`)

1. **`src/components/dashboard/AdminStatCard.tsx`** (`< 60` lines):
   - **Desktop (`sm:` and up):** Unchanged (`sm:rounded-2xl sm:p-5`, `sm:text-3xl`, `sm:h-11 sm:w-11`).
   - **Mobile (`< sm`):**
     - Compact card density: `rounded-xl p-3 sm:rounded-2xl sm:p-5`.
     - Icon badge: `h-8 w-8 sm:h-11 sm:w-11`.
     - Label: `text-xs font-medium text-[var(--color-muted-foreground)] sm:text-sm`.
     - Value: `mt-1.5 font-display text-xl font-bold tracking-tight text-[var(--color-primary)] sm:mt-4 sm:text-3xl`.
     - Hint: `mt-0.5 truncate text-[11px] text-[var(--color-muted-foreground)] sm:mt-1 sm:text-sm`.
2. **Stats Row Grids (`AdminPeopleStatsRow.tsx`, `AdminRegistrationsStatsRow.tsx`, `AdminEventsStatsRow.tsx`)**:
   - Change mobile grid from single-column stack (`mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4`) to a **2-column compact grid** on mobile (`mt-3 grid grid-cols-2 gap-2 sm:mt-6 sm:gap-3 xl:grid-cols-4`, and `grid-cols-3` or `grid-cols-2` for `AdminEventsStatsRow`).
   - **Height savings:** Drops from `~340px` (4 full cards stacked) to `~136px` (2×2 compact grid) on mobile (`>200px` saved).

---

## 4. Dictionary Keys (`src/dictionaries/{en,es,pt}.json`)

Add under `dashboard.adminNav`:

| Key | `es` (es-419 tuteo) | `en` (ASD-STE100) | `pt` |
|-----|---------------------|-------------------|------|
| `pwaTabBarAria` | Navegación rápida de administración | Quick admin navigation | Navegação rápida da administração |
| `pwaTabHome` | Inicio | Home | Início |
| `pwaTabRegistrations` | Admisiones | Admissions | Admissões |
| `pwaTabFinance` | Finanzas | Finance | Finanças |
| `pwaTabPeople` | Personas | People | Pessoas |
| `pwaTabMore` | Más | More | Mais |

---

## 5. Tour Anchors & Invariants (`33-admin-tutorials-contract.mdc`)

| Anchor | Component | Phase 1 Status |
|--------|-----------|----------------|
| `admin-sidebar` | `AdminSidebar` | Unchanged on desktop (`md:flex`). |
| `admin-chrome-header` | `AdminChromeHeader` | Unchanged (`data-tour` on `<header>`). |
| `admin-chrome-back-to-site` | `AdminChromeHeader` | Unchanged (`data-tour` on link). |
| `admin-chrome-teacher-portal` | `StaffWorkspaceSwitch` | Unchanged. |
| `admin-chrome-bell` | `AdminAttentionBell` | Unchanged. |
| `admin-chrome-sign-out` | `StaffDrawerSignOut` | Unchanged. |
| `admin-users-subnav` | `AdminSectionSubnav` | Unchanged (`data-tour` on `<nav>`). |
| `admin-users-title`, `admin-registrations-title`, `admin-events-title`, etc. | `AdminPageHeader` | Unchanged (`data-tour={tourAnchor}` on `<header>`). |
| `admin-events-kpis` | `events/page.tsx` wrapper around `AdminEventsStatsRow` | Unchanged. |

---

## 6. Testing Plan (TDD & Self-Contained)

1. **`src/__tests__/lib/dashboard/resolveAdminPwaTabActive.test.ts` (New)**:
   - Asserts active tab resolution for `/dashboard/admin` (`home`), `/dashboard/admin/registrations` (`registrations`), `/dashboard/admin/finance` (`finance`), `/dashboard/admin/students|parents|teachers|users` (`people`), and secondary routes like `/dashboard/admin/academic` or `/dashboard/admin/institute` (`more`).
2. **`src/__tests__/components/AdminPwaTabBar.test.tsx` (New)**:
   - Renders 5 tabs with localized labels, `aria-current="page"` on the active destination, badge rendering for `newRegistrationsCount` (`99+` cap) and `recentInboundMessagesCount`, and clicking `Más` toggles the mobile drawer context.
3. **`src/__tests__/components/AdminPageHeader.test.tsx` (New or Extended)**:
   - Verifies `data-tour` forwarding, title/lead/action rendering, and compact mobile classes.
4. **`src/__tests__/components/AdminHelpLauncher.test.tsx` (Update)**:
   - Verifies mobile bottom offset class so the FAB clears `AdminPwaTabBar`.
5. **`src/__tests__/i18n/dictionaries.test.ts`**:
   - Verifies structural parity across `en`, `es`, and `pt`.

---

## 7. Definition of Done

1. `AdminPwaTabBar` renders on mobile viewports with 5 thumb-zone items and live badges.
2. `Más` tab opens the full `AdminMobileDrawer` menu from the bottom thumb zone.
3. `AdminUsersScreenNarrow`, `AdminRegistrationsScreenNarrow`, and `AdminUserDetailPwa` no longer nest `PwaPageShell` or a second `min-h-dvh` wrapper.
4. Above-the-fold height on `/dashboard/admin/students` at `390×844` is reduced by at least `350px` so list controls and rows appear above the fold.
5. `AdminHelpLauncher` does not render on `web-mobile` or `pwa-mobile`. The FAB stays on `web-desktop`.
6. All unit tests, dictionary parity tests, and `@admin-tours` checks pass.
7. Every touched file is `<= 250` lines.

---

## 8. Manual QA (User-Owned)

1. Open `/es/dashboard/admin/students` at `390×844`: verify the bottom tab bar shows `Inicio`, `Admisiones`, `Finanzas`, `Personas`, `Más`, with `Personas` active.
2. Tap `Más` in the bottom bar: verify the full admin drawer opens and closes cleanly.
3. Verify the first student row is visible on the `390×844` screen without scrolling past a wall of giant cards.
4. Verify the `?` Help button sits above the bottom tab bar and does not block the `Más` tab.
