# Phase 3: Critical Conversion & Cash Flows (Registrations + Finance Hub)

**Date:** 2026-10-20
**Status:** Draft (awaiting user approval — Gate 0)
**Program:** [`2026-10-20-admin-pwa-mobile-overhaul-program-design.md`](2026-10-20-admin-pwa-mobile-overhaul-program-design.md) — Phase 3 of 4
**Depends on:** Phase 1 (`2026-10-20-admin-pwa-phase1-shell-and-header-design.md`), Phase 2 (`2026-10-20-admin-pwa-phase2-mobile-directories-design.md`)
**Closes:** D07, D08

---

## 1. Intent

Streamline the two highest-value daily admin workflows on mobile (`web-mobile` and `pwa-mobile`):
1. **Web Registrations (`/dashboard/admin/registrations`)**: Turn each registration card into a rapid triage unit with a horizontal inbox-filter strip, a sort bottom sheet (removing the 9-button inline sort wall), two thumb-friendly primary CTAs (`WhatsApp` + `Accept / Enroll`), and a secondary action sheet (`⋯`) for less frequent operations (`Edit`, `Mark contacted / Revert`, `Charges`, `Delete`).
2. **Finance Hub (`/dashboard/admin/finance`)**: Enforce `>= 44px` (`min-h-11`) touch targets on all search and health filter controls in `CohortCollectionsMatrixClient`, compress `FinanceHubKpiStrip` on mobile into a horizontal scroll strip, and make receipt review in `FinanceInboxClient` effortless with one-hand thumb controls.

---

## 2. Context & Current Defects

1. **Registrations inline sort wall & filter wrap (`D07`)**:
   - `src/components/pwa/molecules/AdminRegistrationsPwaList.tsx` renders 9 sort buttons (`name`, `dni`, `email`, `phoneStudent`, `phoneTutor`, `level`, `birth`, `status`, `received`) inline above the cards (`~185px` tall).
   - `src/components/molecules/RegistrationListToolbar.tsx` wraps 8 inbox filter chips across 3–4 rows with `py-1` (`< 44px` height) and renders a full-width primary `Exportar a Excel` button on mobile.
2. **Registrations card overload (`D07`)**:
   - `src/components/pwa/molecules/AdminRegistrationPwaCard.tsx` (`188` lines) renders every field (`DNI`, `Email`, `Tel alumno`, `Tel tutor`, `Nivel`, `Nacimiento`, `Recibido`), plus `AdminRegistrationIntakeActions`, plus a `markContacted` text button, plus `AdminRegistrationChargeActions`, plus a 3-button icon grid (`Accept`, `Edit`, `Delete`).
3. **Finance Hub KPI & control density on mobile (`D08`)**:
   - `src/components/dashboard/admin/finance/FinanceHubKpiStrip.tsx` renders 7–8 KPI tiles in a 2-column vertical grid (`4 rows`, `~310px` tall) above the Finance tabs on mobile.
   - `src/components/dashboard/admin/finance/CohortCollectionsMatrixClient.tsx` uses a `w-64 py-1 text-xs` search input (`~28px` tall) and `HealthChip` buttons with `px-2.5 py-0.5 text-[11px]` (`~24px` tall), violating the `44×44px` touch target rule (`05-pwa-mobile-native.mdc`).
   - `src/components/dashboard/admin/finance/FinanceInboxClient.tsx` type switcher buttons (`Mensualidades`, `Matrículas`, `Facturas`) use `py-1.5` (`~32px` tall) instead of `min-h-11`.

---

## 3. Architecture & Component Specifications

### 3.1 `RegistrationListToolbar` Mobile Ergonomics

- **Path:** `src/components/molecules/RegistrationListToolbar.tsx` (`< 220` lines, `'use client'`).
- **Tour Anchor:** Preserves `data-tour={ADMIN_TOUR_ANCHORS.registrationsToolbar}`.
- **Mobile Improvements:**
  1. **Search + Sort + Export Row:**
     - Search input (`flex-1 min-h-11`).
     - Optional `onOpenSortSheet` button on mobile (`ArrowUpDown` icon, `min-h-11 px-3 rounded-xl border`) when rendered in `AdminRegistrationsPwaList`.
     - Compact Export button (`Download` icon, `min-h-11`).
  2. **Horizontal Scrollable Filter Strip on Mobile:**
     - On `< md`, the inbox filter chips (`urgent`, `awaiting_fee`, `receipt_pending`, `needs_section`, `section_full`, `offer_pending`, `contacted`, `trial`) render in a single horizontal scroll strip (`flex gap-2 overflow-x-auto pb-1 no-scrollbar md:flex-wrap`) with `min-h-10 shrink-0 items-center px-3.5 text-xs font-medium` so they take **1 row (`44px`)** instead of 4 wrapped rows (`140px`).

### 3.2 `AdminRegistrationsPwaList` & Sort Bottom Sheet

- **Path:** `src/components/pwa/molecules/AdminRegistrationsPwaList.tsx` (`< 195` lines, `'use client'`).
- **Sort Sheet Path:** `src/components/pwa/molecules/AdminRegistrationsSortSheet.tsx` (`< 120` lines, `'use client'`).
- **Changes:**
  - Remove the inline 9-button `SORT_KEYS` wall from `AdminRegistrationsPwaList.tsx`.
  - Add a compact sort trigger bar/button that opens `AdminRegistrationsSortSheet` (built on `Modal`).
  - Keep `data-tour={ADMIN_TOUR_ANCHORS.registrationsTable}` on the list container (`<div data-tour={ADMIN_TOUR_ANCHORS.registrationsTable}>`) so the `admin-registrations` screen tour highlights the list on both surfaces.

### 3.3 Triage-First `AdminRegistrationPwaCard` & Secondary Action Sheet

- **Path:** `src/components/pwa/molecules/AdminRegistrationPwaCard.tsx` (`< 195` lines, `'use client'`).
- **Secondary Sheet Path:** `src/components/pwa/molecules/AdminRegistrationActionsSheet.tsx` (`< 160` lines, `'use client'`).
- **Card Anatomy:**
  1. **Header Row:**
     - Full name (`formatRegistrationDisplayName(r)`, `text-base font-semibold text-[var(--color-primary)]`) + status badge (`new` / `contacted`) + relative/formatted received date (`text-xs text-[var(--color-muted-foreground)]`).
     - Top-right `MoreHorizontal` (`⋯`) icon button (`min-h-11 min-w-11`, `aria-label={labels.moreActionsAria}`) that opens `AdminRegistrationActionsSheet`.
  2. **Compact 2-Line Key Metadata:**
     - **Line 1:** Level (`r.english_level`) · Birth/Age · DNI (`r.dni`).
     - **Line 2:** Primary phone (`contact.displayLine`) · Email (`r.email`, truncated).
  3. **Contextual Intake Block:**
     - `AdminRegistrationIntakeActions` (section selector / offer / receipt review when applicable to the registration's current stage).
  4. **Primary Thumb CTA Row (2 buttons side by side, `min-h-11`):**
     - **CTA 1 — WhatsApp Contact:** If `contact.whatsappHref` exists, renders a prominent WhatsApp link button (`MessageCircle` icon, `min-h-11 flex-1`, emerald surface/border token-safe styling) so staff can message the student or guardian in 1 tap.
     - **CTA 2 — Accept / Enroll:** Primary button (`Check` icon, `min-h-11 flex-1`) triggering `onAccept(r)`.
  5. **Secondary Action Sheet (`AdminRegistrationActionsSheet`):**
     - Opened via the `⋯` button on the card.
     - Contains full-width `min-h-11` action rows with leading Lucide icons:
       - `Edit registration` (`Pencil` icon → `onEdit(r)`)
       - `Mark as contacted` / `Revert to new` (`CheckCircle2` / `RotateCcw` icon → `onMarkContacted(r)` / `onRevertToNew(r)`)
       - `Enrollment fee` & `First monthly charge` (`CreditCard` / `Receipt` via `AdminRegistrationChargeActions`)
       - `Delete registration` (`Trash2` icon, destructive styling → `onDelete(r)`)

### 3.4 Finance Hub Mobile Upgrades (`D08`)

1. **`src/components/dashboard/admin/finance/FinanceHubKpiStrip.tsx`** (`< 130` lines):
   - On `< sm`, render the KPI tiles as a **single horizontal snap-scroll strip** (`flex gap-2.5 overflow-x-auto pb-1 snap-x snap-mandatory sm:grid sm:grid-cols-4 lg:grid-cols-7`) where each tile has `min-w-[8.75rem] shrink-0 snap-start`.
   - **Height savings:** Drops from `~310px` (4 vertical rows of tiles) to `~76px` (1 horizontal strip) above the Finance Hub tabs.
2. **`src/components/dashboard/admin/finance/CohortCollectionsMatrixClient.tsx`** (`< 240` lines):
   - Upgrade the section search input on mobile to `min-h-11 w-full sm:w-64 rounded-xl px-3 py-2 text-sm`.
   - Upgrade `HealthChip` buttons to `min-h-11 px-3.5 py-2 text-xs font-medium` on mobile (`sm:min-h-8 sm:px-2.5 sm:py-1`) and place them in a horizontal scroll row (`flex gap-1.5 overflow-x-auto pb-1 sm:flex-wrap`) so every filter chip meets the `44px` touch target requirement without wrapping into 3 rows.
   - On `< md`, render each section row in the collections table with clear mobile tap targets (`min-h-11` link to section collections detail).
3. **`src/components/dashboard/admin/finance/FinanceInboxClient.tsx`** (`< 140` lines):
   - Upgrade the inbox type switcher buttons (`monthly`, `enrollment`, `invoice`) to `min-h-11 flex-1 justify-center px-3 py-2 text-xs sm:flex-initial sm:text-sm` so switching queues on a phone uses full thumb-sized segmented buttons.

---

## 4. Dictionary Keys (`src/dictionaries/{en,es,pt}.json`)

Add under `admin.registrations`:

| Key | `es` (es-419 tuteo) | `en` (ASD-STE100) | `pt` |
|-----|---------------------|-------------------|------|
| `moreActionsAria` | Más acciones para {{name}} | More actions for {{name}} | Mais ações para {{name}} |
| `mobileSortButton` | Ordenar: {{field}} | Sort: {{field}} | Ordenar: {{field}} |
| `mobileSortSheetTitle` | Ordenar inscripciones | Sort registrations | Ordenar inscrições |
| `whatsappCta` | WhatsApp | WhatsApp | WhatsApp |

---

## 5. Tour Anchors & Invariants (`33-admin-tutorials-contract.mdc`)

| Anchor | Component | Phase 3 Status |
|--------|-----------|----------------|
| `admin-registrations-title` | `AdminPageHeader` | Unchanged. |
| `admin-registrations-toolbar` | `RegistrationListToolbar` | Unchanged. |
| `admin-registrations-table` | `AdminRegistrationsDesktopTable` & `AdminRegistrationsPwaList` | Present on both surfaces. |
| `admin-finance-header` | `AdminPageHeader` on Finance Hub | Unchanged. |
| `admin-finance-cohort-year` | `FinanceHubTabs` | Unchanged. |
| `admin-finance-tabs` & `admin-finance-tab-*` | `FinanceHubTabs` | Unchanged. |
| `admin-finance-workspace` | `FinanceHubTabs` | Unchanged. |
| `admin-finance-inbox-root`, `admin-finance-inbox-type-nav`, `admin-finance-inbox-approve`, `admin-finance-inbox-reject` | `FinanceInboxClient` & bulk sections | Unchanged. |

---

## 6. Testing Plan (TDD & Self-Contained)

1. **`src/__tests__/components/AdminRegistrationPwaCard.test.tsx` (New)**:
   - Verifies compact metadata rendering, primary `Accept` and `WhatsApp` buttons, and opening `AdminRegistrationActionsSheet` (`⋯`) to trigger `onEdit`, `onMarkContacted`, and `onDelete`.
2. **`src/__tests__/components/AdminRegistrationsPwaList.test.tsx` (New)**:
   - Verifies the inline 9-button sort wall is gone, the sort sheet opens and triggers `onToggleSort`, and `data-tour="admin-registrations-table"` is present.
3. **`src/__tests__/components/CohortCollectionsMatrixClient.test.tsx` (New or Extended)**:
   - Verifies search filtering, `HealthChip` filtering (`overdue`, `pending`, `clean`), and `min-h-11` touch target classes.
4. **`src/__tests__/components/FinanceInboxClient.test.tsx` (Extended)**:
   - Verifies queue switching (`monthly`, `enrollment`, `invoice`), badge counts, and `data-tour` anchors.

---

## 7. Definition of Done

1. `AdminRegistrationsPwaList` replaces the 9-button inline sort wall with `AdminRegistrationsSortSheet`.
2. `RegistrationListToolbar` inbox filter chips scroll horizontally in a single row on mobile with `>= 40px` touch height.
3. `AdminRegistrationPwaCard` displays primary `WhatsApp` and `Accept` CTAs in the card footer and moves secondary actions into `AdminRegistrationActionsSheet`.
4. `FinanceHubKpiStrip` renders as a single-row horizontal scroll strip on mobile.
5. `CohortCollectionsMatrixClient` search input and `HealthChip` controls have `min-h-11` (`44px`) touch targets on mobile.
6. All unit tests, dictionary parity tests, and `@admin-tours` checks pass.
7. Every touched file is `<= 250` lines.

---

## 8. Manual QA (User-Owned)

1. Open `/es/dashboard/admin/registrations` at `390×844`: verify inbox filter chips scroll horizontally on one line and the first registration card is immediately visible.
2. On a registration card, verify `WhatsApp` and `Aceptar` are large side-by-side buttons, and tapping `⋯` opens the sheet with `Editar`, `Marcar como contactado`, cobros, and `Eliminar`.
3. Open `/es/dashboard/admin/finance` at `390×844`: verify the KPI strip scrolls horizontally on one line and the `Cobranzas` / `Bandeja de validación` tabs are visible above the fold.
4. Tap the health filter chips (`Con mora`, `Con pendientes`, `Al día`) on mobile: verify each chip is easy to tap (`44px` height).
