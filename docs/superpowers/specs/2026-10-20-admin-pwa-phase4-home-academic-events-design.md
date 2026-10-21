# Phase 4: Mobile Operational Home (`AdminHubHome`) & Academic / Events Polish

**Date:** 2026-10-20
**Status:** Draft (awaiting user approval — Gate 0)
**Program:** [`2026-10-20-admin-pwa-mobile-overhaul-program-design.md`](2026-10-20-admin-pwa-mobile-overhaul-program-design.md) — Phase 4 of 4
**Depends on:** Phase 1 (`2026-10-20-admin-pwa-phase1-shell-and-header-design.md`)
**Closes:** D09, D10

---

## 1. Intent

Complete the Admin mobile transformation across the operational home screen (`/dashboard/admin`) and secondary operational modules (`/dashboard/admin/events`, `/dashboard/admin/academic`):
1. **Mobile Operational Home (`AdminHubHome`)**: Put urgent action queues (Pending payments, New registrations, Unread messages, Students without section) at the top of the mobile screen above the 30-day web traffic chart and birthdays card.
2. **Events List & Detail (`AdminEventsScreen`, `AdminEventDetailTabs`)**: Add a mobile sort control and clean card layout on `/dashboard/admin/events`, and compact sticky horizontal tabs on event detail.
3. **Academic Hub (`AcademicHubCohortBoard`)**: Polish mobile cohort rows and tab strip ergonomics.

---

## 2. Context & Current Defects

1. **Web Traffic Chart outranks urgent operations on Mobile Home (`D09`)**:
   - In `src/components/dashboard/AdminHubHomeOpsGrid.tsx`, `<div data-tour="admin-hub-traffic">` (`AdminHubTrafficChart`, a 30-day chart + KPI header) is the first child inside the main 8-column stack, followed by `AdminHubWorkQueuesRow` (`hubPayments`, `hubRegistrations`, `hubMessages`).
   - On a `390×844` phone screen, the admin sees the traffic chart first and must scroll down past it to see pending payment receipts, new web registrations, or unread messages.
   - Note: Spec 7 (`2026-08-06-home-screen-priority-design.md`) previously established that `hubPayments` must appear before `hubBirthdays` in document order (`src/__tests__/components/AdminHubHome.test.tsx`). Keeping `AdminHubWorkQueuesRow` before `AdminHubTrafficChart` (or using responsive flex order `order-1 lg:order-2` while keeping `AdminHubWorkQueuesRow` before `UpcomingBirthdaysCard`) satisfies both mobile priority and the Spec 7 document-order test!
2. **Events table on mobile lacks sort control & compact header (`D10`)**:
   - `src/components/organisms/AdminEventsScreen.tsx` uses `table.ge-stack-cards`. On mobile (`< 768px`), `globals.css` hides `<thead>` (`display: none`), which hides all `SortableTh` column headers! Mobile users have no way to change event sort (`title`, `event_date`, `status`, `attendees_count`, `views`, `price`).
3. **Event Detail & Academic Hub tab strips on mobile (`D10`)**:
   - `src/components/dashboard/admin/events/AdminEventDetailTabs.tsx` renders 7 tabs (`summary`, `form`, `attendees`, `payments`, `codes`, `waitlist`, `notifications`) plus a multi-line `tabLeads[current]` paragraph that pushes the workspace down on mobile.

---

## 3. Architecture & Component Specifications

### 3.1 `AdminHubHomeOpsGrid` & `AdminHubWorkQueuesRow` Priority Order (`D09`)

**Superseded for the home when** [`2026-10-20-admin-home-layout-design.md`](2026-10-20-admin-home-layout-design.md) **is approved.** That spec keeps one order per admin. The factory order already places payments, registrations, and messages before the traffic chart, on the phone and on a wide screen. Do not also hardcode a second mobile reorder. §3.2 and §3.3 below stay in this phase.



- **Paths:**
  - `src/components/dashboard/AdminHubHomeOpsGrid.tsx` (`< 100` lines)
  - `src/components/dashboard/AdminHubWorkQueuesRow.tsx` (`< 160` lines)
- **Changes:**
  1. In `AdminHubHomeOpsGrid.tsx`, place `AdminHubWorkQueuesRow` (`hubPayments`, `hubRegistrations`, `hubMessages`) **above** `<div data-tour="admin-hub-traffic">` (`AdminHubTrafficChart`) in the DOM, or use `flex flex-col` with `AdminHubWorkQueuesRow` first so urgent queues lead on mobile and desktop alike.
     - Verify against `src/__tests__/components/AdminHubHome.test.tsx`: `hubPayments` remains before `hubBirthdays` in document order, and all `ADMIN_HOME_RUNTIME_ANCHORS` (`hubTitle`, `hubBirthdays`, `hubTraffic`, `hubUsers`, `hubPayments`, `hubRegistrations`, `hubMessages`) remain visible.
  2. In `AdminHubWorkQueuesRow.tsx`, tighten mobile card padding (`p-3.5 sm:p-4`) and make the 3 queue cards (`Pagos pendientes`, `Inscripciones nuevas`, `Mensajes sin leer`) render with a prominent count badge and direct 1-tap navigation on mobile.

### 3.2 `AdminEventsScreen` Mobile Sort & Card Polish (`D10`)

- **Path:** `src/components/organisms/AdminEventsScreen.tsx` (`< 245` lines, `'use client'`).
- **Changes:**
  1. Add a mobile-only sort control (`md:hidden`) in the header bar of `AdminEventsScreen` (next to the count/create CTA):
     - A `<select>` or compact sort button (`min-h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-xs font-medium`) allowing mobile staff to pick `sort` (`event_date`, `title`, `status`, `attendees_count`, `views`, `price`) and toggle `asc`/`desc` even when `thead` is hidden by `.ge-stack-cards`.
  2. Keep `data-tour={ADMIN_TOUR_ANCHORS.eventsCreateCta}` and `data-tour={ADMIN_TOUR_ANCHORS.eventsTable}` intact.
  3. Ensure the `Manage` (`Gestionar`) link in each event row has `min-h-11` (`44px`) touch height on mobile.

### 3.3 `AdminEventDetailTabs` & `AcademicHubCohortBoard` Mobile Ergonomics (`D10`)

1. **`src/components/dashboard/admin/events/AdminEventDetailTabs.tsx`** (`< 175` lines):
   - Keep all 7 `data-tour` tab anchors (`eventDetailTabs`, `eventDetailTabSummary`, `eventDetailTabForm`, `eventDetailTabAttendees`, `eventPaymentsTab`, `eventDetailTabCodes`, `eventDetailTabWaitlist`, `eventDetailTabNotifications`, `eventDetailWorkspace`).
   - Add `no-scrollbar snap-x` to the horizontal `<nav>` on mobile and tighten `tabLeads[current]` on mobile (`px-3 py-1.5 text-xs line-clamp-1 sm:line-clamp-none sm:px-5 sm:py-2.5`) so the tab workspace starts higher on the screen.
2. **`src/components/organisms/AcademicHubCohortBoard.tsx`** (`< 165` lines):
   - Tighten mobile panel padding from `px-4 py-4` to `px-3 py-3 sm:px-5 sm:py-5` and hide redundant lead repetition on `< sm` (`hidden sm:block` on the tab panel subtitle when it duplicates the tab name), keeping `data-tour={ADMIN_TOUR_ANCHORS.academicBoardTabs}` and `data-tour={ADMIN_TOUR_ANCHORS.academicCohortList}` intact.

---

## 4. Dictionary Keys (`src/dictionaries/{en,es,pt}.json`)

 No new dictionary keys are strictly required for Phase 4 if `AdminEventsScreen` reuses `labels` (`title`, `date`, `status`, `capacity`, `views`, `price`) and `tableSortLabels(locale)` (`src/lib/i18n/tableSortLabels.ts`), which already exist in `es`, `en`, and `pt`.

---

## 5. Tour Anchors & Invariants (`33-admin-tutorials-contract.mdc`)

| Anchor | Component | Phase 4 Status |
|--------|-----------|----------------|
| `admin-hub-title`, `admin-hub-payments`, `admin-hub-registrations`, `admin-hub-messages`, `admin-hub-traffic`, `admin-hub-users`, `admin-hub-birthdays` | `AdminHubHome` tree | All present and visible; `hubPayments` precedes `hubBirthdays` in DOM order. |
| `admin-events-create-cta`, `admin-events-table` | `AdminEventsScreen` | Unchanged. |
| `admin-event-detail-tabs`, `admin-event-detail-tab-*`, `admin-event-payments-tab`, `admin-event-detail-workspace` | `AdminEventDetailTabs` | Unchanged. |
| `admin-academic-board-tabs`, `admin-academic-cohort-list` | `AcademicHubCohortBoard` | Unchanged. |

---

## 6. Testing Plan (TDD & Self-Contained)

1. **`src/__tests__/components/AdminHubHome.test.tsx` (Extend)**:
   - Verifies that `admin-hub-payments`, `admin-hub-registrations`, and `admin-hub-messages` appear **before** `admin-hub-traffic` and `admin-hub-birthdays` in document order, and all `ADMIN_HOME_RUNTIME_ANCHORS` render.
2. **`src/__tests__/components/AdminEventsScreen.test.tsx` (Extend)**:
   - Verifies the mobile sort selector triggers `router.push` with updated `sort` and `dir` query parameters, and `data-tour` anchors remain mounted.
3. **`src/__tests__/components/AcademicHubCohortBoard.test.tsx` (Verify/Extend)**:
   - Verifies tab switching and `data-tour` anchors (`academicBoardTabs`, `academicCohortList`).

---

## 7. Definition of Done

1. On `/dashboard/admin`, urgent work queues (`Pagos`, `Inscripciones`, `Mensajes`) appear before the 30-day web traffic chart and birthdays card.
2. `AdminEventsScreen` provides a mobile-accessible sort control when `.ge-stack-cards` hides `<thead>` on narrow viewports.
3. `AdminEventDetailTabs` and `AcademicHubCohortBoard` render compact mobile headers and horizontal tab strips without vertical bloat.
4. All unit tests, `AdminHubHome.test.tsx`, `AdminEventsScreen.test.tsx`, and `@admin-tours` checks pass.
5. Every touched file is `<= 250` lines.

---

## 8. Manual QA (User-Owned)

1. Open `/es/dashboard/admin` at `390×844`: confirm `Pagos pendientes`, `Inscripciones`, and `Mensajes` appear immediately near the top of the screen above the traffic chart.
2. Open `/es/dashboard/admin/events` at `390×844`: confirm you can change the sort order from a phone and tap `Gestionar` easily (`44px` height).
3. Open an event detail page at `390×844`: confirm the 7 tabs scroll horizontally and the active tab workspace is visible above the fold.
