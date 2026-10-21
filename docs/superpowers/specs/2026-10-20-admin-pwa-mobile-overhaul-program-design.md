# Admin PWA & Mobile-Native Overhaul — Program Index

**Date:** 2026-10-20
**Status:** Draft (awaiting user approval — Gate 0)
**Kind:** Umbrella program specification and phase index
**Child Specs:**
1. [`2026-10-20-admin-pwa-phase1-shell-and-header-design.md`](2026-10-20-admin-pwa-phase1-shell-and-header-design.md)
2. [`2026-10-20-admin-pwa-phase2-mobile-directories-design.md`](2026-10-20-admin-pwa-phase2-mobile-directories-design.md)
3. [`2026-10-20-admin-pwa-phase3-registrations-and-finance-design.md`](2026-10-20-admin-pwa-phase3-registrations-and-finance-design.md)
4. [`2026-10-20-admin-pwa-phase4-home-academic-events-design.md`](2026-10-20-admin-pwa-phase4-home-academic-events-design.md)

---

## 1. Intent

The Admin dashboard (`/dashboard/admin/**`) currently treats mobile and installed PWA viewports as a shrunk desktop site. Operators face nested `100dvh` scroll containers, over `900px` of vertical chrome before the first data row, top-left hamburger navigation outside the thumb zone, and tall stacked cards that require excessive scrolling.

This program converts the Admin mobile and PWA experience (`web-mobile` and `pwa-mobile` surfaces) into a native-grade operational app, while keeping the `web-desktop` surface (`>= 1024px`) intact.

---

## 2. Root-Cause Diagnosis

| ID | Defect | Measured Source in Codebase | Phase |
|----|--------|-----------------------------|-------|
| **D01** | Nested `dvh` scroll wrappers and double horizontal padding | `AdminDashboardShell.tsx` sets `h-dvh max-h-dvh overflow-hidden` and `px-safe pb-safe pt-5`. Child narrow screens (`AdminUsersScreenNarrow.tsx`, `AdminRegistrationsScreenNarrow.tsx`, `AdminUserDetailPwa.tsx`) wrap content again in `PwaPageShell` (`min-h-dvh`) plus an inner `min-h-dvh px-3 pb-[...] pt-[...]`. | Phase 1 |
| **D02** | Primary navigation hidden in top-left hamburger | `AdminDashboardShell.tsx` uses `md:hidden` CSS only. It lacks a bottom tab bar, `PwaPullToRefresh`, and `useAppSurface()` branching used in `PortalShell.tsx`. | Phase 1 |
| **D03** | Help FAB (`AdminHelpLauncher`) collides with bottom navigation on mobile | Hide the FAB when the surface is not `web-desktop`. Parent already returns null. Desktop keeps the FAB. | Phase 1 |
| **D04** | Above-the-fold vertical bloat (`>900px` before first row) | Stacking `AdminChromeHeader` (`68px`), `AdminSectionSubnav` (`56px`), `AdminPageHeader` (`180px`), and 4 stacked `AdminStatCard` blocks (`340px`) consumes the entire `844px` phone viewport before the toolbar or list starts. | Phase 1 |
| **D05** | Inline sort-chip walls and expanded filter blocks in directories | `AdminUsersPwaList.tsx` renders up to 9 sort buttons (`min-h-[44px]`) inline, plus inline bulk buttons and a collapsible 4-select filter block in `AdminUsersToolbar.tsx`. | Phase 2 |
| **D06** | "Bed-sheet" directory cards (`~260px` height per person) | `AdminUsersPwaListItem.tsx` renders 6–7 labeled key/value rows plus 3 icon buttons per student or parent, showing only 1.5 items per screen. | Phase 2 |
| **D07** | Overloaded registration cards and inline sort wall | `AdminRegistrationsPwaList.tsx` renders 9 sort buttons inline. `AdminRegistrationPwaCard.tsx` stacks all metadata, intake actions, charge buttons, and a 3-button footer on every card. | Phase 3 |
| **D08** | Non-touch controls (`<44px`) in Finance Hub | `CohortCollectionsMatrixClient.tsx` renders `py-1` inputs and `py-0.5 text-[11px]` `HealthChip` buttons. `FinanceHubKpiStrip.tsx` stacks 7–8 tiles (`4 rows`) above the tabs on mobile. | Phase 3 |
| **D09** | Desktop-biased visual order on Admin Home | `AdminHubHomeOpsGrid.tsx` places the 30-day web traffic chart above pending payments, new registrations, unread messages, and birthdays on mobile. | Phase 4 |
| **D10** | Secondary tables and detail tabs lack mobile ergonomics | `AdminEventsScreen.tsx` and `AdminEventDetailTabs.tsx` / `AcademicHubCohortBoard.tsx` need compact mobile header/tab treatment and clear mobile sort controls. | Phase 4 |

---

## 3. Cross-Phase Architectural Invariants

Every phase must obey these rules without exception:

1. **Desktop invariance (`web-desktop`)**:
   - All desktop layouts, table columns, sidebar groups, and keyboard workflows remain unchanged on `web-desktop`.
2. **Canonical surface detection (`05-pwa-mobile-native.mdc`)**:
   - Screen adapters and shells read `useAppSurface()` (`"web-desktop" | "web-mobile" | "pwa-mobile"`). Do not add `window.innerWidth` listeners.
3. **File size limit (`03-architecture.mdc`)**:
   - No file may exceed **250 lines of code**. Split Web, Mobile/PWA, sheets, and pure helpers into dedicated modules.
4. **Design tokens & contrast (`01-design-system.mdc`, `26-accessibility-contrast.mdc`)**:
   - Use CSS custom properties (`--color-primary`, `--color-surface`, `--color-background`, `--color-muted`, `--color-border`, `--color-error`, `--color-success`, `--color-warning`).
   - Do not use hardcoded hex colors or `hover:opacity-*` on filled controls.
5. **Leading Lucide icons (`16-admin-buttons-icons.mdc`)**:
   - Every button with a visible text label must include a leading `lucide-react` icon (`h-4 w-4`, `aria-hidden`). Icon-only buttons must have an `aria-label` from `src/dictionaries/`.
6. **No native dialogs (`18-no-native-browser-dialogs.mdc`)**:
   - Use `Modal` (`src/components/atoms/Modal.tsx`) or design-system sheets for all filter, sort, and action sheets.
7. **Tour anchor contract (`33-admin-tutorials-contract.mdc`)**:
   - Every `data-tour` attribute in `ADMIN_TOUR_ANCHORS` (`src/lib/admin-tutorials/adminTourAnchors.ts`) and `listTourRuntimeChecks()` must remain mounted and visible on the expected route.
8. **i18n parity (`09-i18n-copy.mdc`, `40-neutral-spanish-copy.mdc`, `41-asd-ste100-english.mdc`)**:
   - Add every new user-visible key to `src/dictionaries/en.json`, `src/dictionaries/es.json`, and `src/dictionaries/pt.json` in the same phase.
   - Spanish uses neutral Latin American tuteo (*tienes*, *haz clic*, *filtra*). English uses short ASD-STE100 sentences.

---

## 4. Phase Execution Order & Dependencies

| Phase | Spec File | Scope Summary | Depends On |
|-------|-----------|---------------|------------|
| **Phase 1** | `2026-10-20-admin-pwa-phase1-shell-and-header-design.md` | Surface-aware `AdminDashboardShell`, `AdminPwaTabBar` (5 thumb tabs + badges), `PwaPullToRefresh`, removal of nested `PwaPageShell` wrappers, compact mobile `AdminPageHeader` & horizontal `AdminStatCard` strip, `AdminHelpLauncher` bottom offset. | None |
| **Phase 2** | `2026-10-20-admin-pwa-phase2-mobile-directories-design.md` | Unified mobile toolbar (`Search` + `Filter` badge button + `Sort` button), `AdminDirectoryFilterSortSheet`, floating bulk selection bar (`AdminUsersBulkBarMobile`), compact 2-line `AdminUsersPwaListItem`. | Phase 1 |
| **Phase 3** | `2026-10-20-admin-pwa-phase3-registrations-and-finance-design.md` | Triage-first `AdminRegistrationPwaCard` (primary `WhatsApp` + `Accept` CTAs, secondary `⋯` action sheet), registration sort/filter sheet, touch-sized `CohortCollectionsMatrixClient` (`min-h-11`), compact `FinanceHubKpiStrip`, mobile receipt approval ergonomics. | Phase 1, Phase 2 |
| **Phase 4** | `2026-10-20-admin-pwa-phase4-home-academic-events-design.md` | Events list sort and academic tab polish. The home card order moves to [`2026-10-20-admin-home-layout-design.md`](2026-10-20-admin-home-layout-design.md): one order per admin, factory order puts urgent cards before the chart. | Phase 1 |

---

## 5. Verification Strategy Across All Phases

1. **Self-contained unit & component tests (`30-harness-self-contained-tests.mdc`)**:
   - Each phase ships isolated Vitest tests under `src/__tests__/` covering both `web-desktop` and `web-mobile`/`pwa-mobile` branches.
2. **Tour contract gates (`33-admin-tutorials-contract.mdc`)**:
   - Run `src/__tests__/lib/admin-tutorials/` (L1/L2) after each phase.
   - Ensure `e2e/admin-tours.spec.ts` (L3) passes on commit.
3. **Dictionary parity test**:
   - Run `src/__tests__/i18n/dictionaries.test.ts` whenever keys are added.
4. **Typecheck and lint**:
   - Run `npm run lint` and `npx tsc --noEmit` after each phase.
5. **Product changelog (`39-commit-product-changelog.mdc`)**:
   - Prepend an entry in `src/lib/product-changelog/catalogEntriesLatest.ts` before committing product changes.
