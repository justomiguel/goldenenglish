# Admin PWA and Mobile Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the mobile and PWA experience across all `/dashboard/admin/**` routes in 4 ordered waves, starting with the shared table/shell foundation and the section Students view.

**Architecture:** Flatten nested container padding on narrow viewports (`< 768px`), replace squished multi-column tables with responsive cards or guarded stackable tables, remove duplicate headers and action icons, and keep all `ADMIN_TOUR_ANCHORS` and server contracts intact.

**Tech Stack:** Next.js App Router, React 19, Tailwind CSS v4, Lucide React, Vitest + Testing Library.

## Global Constraints

- No file may exceed 250 lines (`03-architecture.mdc`).
- Use semantic design tokens only (`01-design-system.mdc`). Do not use `border-l-*` side stripes (`impeccable` ban).
- All user-visible strings must come from `src/dictionaries/{en,es,pt}.json` (`09-i18n-copy.mdc`). Spanish uses neutral tuteo (`40-neutral-spanish-copy.mdc`).
- Every button must include a leading Lucide icon or an `aria-label` when icon-only (`16-admin-buttons-icons.mdc`).
- Preserve all `data-tour` attributes (`33-admin-tutorials-contract.mdc`).
- Self-contained tests in `src/__tests__/` (`30-harness-self-contained-tests.mdc`).

---

### Task 1: Wave 1 — Stackable Table Labels, Mobile Table CSS, and Calendar Shell

**Spec:** `docs/superpowers/specs/2026-10-27-admin-pwa-wave1-shell-and-tables-design.md`

**Files:**
- Modify: `src/components/dashboard/AdminStackableTableLabels.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/components/organisms/PortalCalendarEntry.tsx`
- Test: `src/__tests__/components/AdminStackableTableLabels.test.tsx`

- [ ] **Step 1: Write failing tests for `AdminStackableTableLabels` skipping `colSpan` and empty headers**
- [ ] **Step 2: Run `npx vitest run src/__tests__/components/AdminStackableTableLabels.test.tsx` and verify failure**
- [ ] **Step 3: Update `AdminStackableTableLabels.tsx`, `src/app/globals.css`, and `PortalCalendarEntry.tsx`**
  - In `AdminStackableTableLabels.tsx`: skip `cell` when `cell.hasAttribute("colspan") && Number(cell.getAttribute("colspan")) > 1`; remove `delete cell.dataset.label` when header is empty.
  - In `src/app/globals.css`: scope `table.ge-stack-cards` mobile rules so cells without `data-label` do not reserve label space, and `div:has(> table.ge-stack-cards)` drops outer border/background on `max-width: 767px` to prevent card-in-card borders.
  - In `PortalCalendarEntry.tsx`: when `admin` is set (rendered inside `AdminDashboardShell`), render `narrowBody` directly without a duplicate `min-h-dvh bg-[var(--color-muted)] px-3 pb-[max(2.5rem,...)]` wrapper.
- [ ] **Step 4: Run `npx vitest run src/__tests__/components/AdminStackableTableLabels.test.tsx` and verify pass**

---

### Task 2: Wave 2 — Section Workspace, Students View, and Schedule Grid

**Spec:** `docs/superpowers/specs/2026-10-27-admin-pwa-wave2-section-workspace-and-students-design.md`

**Files:**
- Modify: `src/components/organisms/AcademicSectionPageHeader.tsx`
- Modify: `src/components/organisms/AcademicSectionPageShellBody.tsx`
- Modify: `src/components/organisms/AcademicSectionShellWorkspace.tsx`
- Modify: `src/components/molecules/AcademicSectionAreaBlock.tsx`
- Modify: `src/components/molecules/AcademicSectionAreaBlockHeader.tsx`
- Modify: `src/components/molecules/AcademicSectionAreaSummaryBand.tsx`
- Modify: `src/components/organisms/AcademicSectionStudentsPanel.tsx`
- Modify: `src/components/organisms/AcademicSectionRosterToolbar.tsx`
- Modify: `src/components/organisms/AcademicSectionRosterTable.tsx`
- Modify: `src/components/organisms/AcademicSectionWeekScheduleGrid.tsx`
- Modify: `src/components/organisms/AssessmentRosterGradingClient.tsx`
- Modify: `src/components/organisms/AcademicPendingTransfers.tsx`
- Test: `src/__tests__/components/AcademicSectionShellWorkspace.test.tsx`
- Test: `src/__tests__/organisms/AcademicSectionRosterTableCareBadge.test.tsx`

- [ ] **Step 1: Write/update tests for `AcademicSectionShellWorkspace` (enrollment link visible on hub only, hidden inside area tabs) and `AcademicSectionRosterTable` (localized status badge, mobile student cards, transfer controls)**
- [ ] **Step 2: Run `npx vitest run src/__tests__/components/AcademicSectionShellWorkspace.test.tsx src/__tests__/organisms/AcademicSectionRosterTableCareBadge.test.tsx` and verify failure**
- [ ] **Step 3: Implement Wave 2 changes**
  - Pass `enrollmentLinkPanel` into `AcademicSectionShellWorkspace` so it renders only when `area == null`.
  - Compact mobile padding in `AcademicSectionPageHeader` (`px-4 py-4 sm:px-6 sm:py-6`), `AcademicSectionShellWorkspace` (`px-3 py-3 sm:px-5 sm:py-5`), `AcademicSectionAreaBlock` (`p-3.5 sm:p-5`), and `AcademicSectionAreaSummaryBand` (`p-3.5 sm:p-5`).
  - Simplify `AcademicSectionStudentsPanel` so the active student count is displayed as a compact inline pill in the header of the roster block rather than a separate outer summary card.
  - Update `AcademicSectionRosterToolbar` to display tab counts (`Activos (N)`, `Dados de baja (N)`, `Transferidos (N)`) and only show the `capacityOverride` checkbox when `tab === "active"` and `showMoveControls` is true.
  - Update `AcademicSectionRosterTable` to:
    - Map `r.status` to localized `dict.lifecycle.enrollmentStatus[r.status]` labels.
    - Render a clean mobile card list (`md:hidden`) where each student card shows the name link, debt/care badges, localized status badge, and (when `tab === "active"` and `moveTargets.length > 0`) a full-width transfer bar (`select` + `Mover` button).
    - Keep the desktop `<table>` on `hidden md:block`.
  - Wrap `AcademicSectionWeekScheduleGrid` inner 7-column grid in `overflow-x-auto` with `min-w-[38rem]`.
  - Add `ge-stack-cards` and visible status text to `AssessmentRosterGradingClient` and `AcademicPendingTransfers`.
- [ ] **Step 4: Run `npx vitest run src/__tests__/components/AcademicSectionShellWorkspace.test.tsx src/__tests__/organisms/AcademicSectionRosterTableCareBadge.test.tsx` and verify pass**

---

### Task 3: Wave 3 — Directories, User Dossier, and Finance Mobile UX

**Spec:** `docs/superpowers/specs/2026-10-27-admin-pwa-wave3-directories-dossier-and-finance-design.md`

**Files:**
- Modify: `src/components/pwa/molecules/AdminUsersPwaListItem.tsx`
- Modify: `src/components/molecules/AdminUserIdentityHero.tsx`
- Modify: `src/components/molecules/AdminUserProfileFicha.tsx`
- Modify: `src/components/molecules/AdminUserProfileTabPanels.tsx`
- Modify: `src/components/dashboard/admin/finance/SectionCollectionsMatrixMobile.tsx`
- Modify: `src/components/billing/AdminFinanceReceiptReviewClient.tsx`
- Modify: `src/components/dashboard/AdminStudentBillingPaymentsTable.tsx`
- Test: `src/__tests__/components/AdminUsersPwaListItem.test.tsx`
- Test: `src/__tests__/components/SectionCollectionsMatrixTable.test.tsx`

- [ ] **Step 1: Write/update tests for `AdminUsersPwaListItem` (no duplicate profile icon button, full name/meta layout) and `SectionCollectionsMatrixMobile` (prev/next student navigation and summary)**
- [ ] **Step 2: Run targeted tests and verify failure**
- [ ] **Step 3: Implement Wave 3 changes**
  - In `AdminUsersPwaListItem.tsx`: remove the duplicate `Pencil` link (keeping `Eye` + `Trash2`), wrap the card in a 2-row responsive structure so the name + status badge and the 2-line metadata summary have full width.
  - In `AdminUserIdentityHero.tsx`: use `p-4 sm:p-5`, remove the duplicate role `<dl>` box, and render DNI + Member Since in `grid-cols-2 gap-2.5`.
  - In `AdminUserProfileFicha.tsx` and `AdminUserProfileTabPanels.tsx`: use `p-3 sm:p-5` on mobile to eliminate cramped double padding.
  - In `SectionCollectionsMatrixMobile.tsx`: add Prev/Next student buttons (`ChevronLeft`, `ChevronRight`) next to the `<select>` and include paid/overdue amounts in the student summary card header.
  - In `AdminFinanceReceiptReviewClient.tsx`: use `max-h-[42vh] lg:max-h-[70vh]` on mobile preview, use `useRouter` on approve/reject, and add leading icons to action buttons.
  - In `AdminStudentBillingPaymentsTable.tsx`: remove `border-l-4` side-stripe class.
- [ ] **Step 4: Run targeted tests and verify pass**

---

### Task 4: Wave 4 — Events, Merch, Content Studio, Messages, Audit, and Headers

**Spec:** `docs/superpowers/specs/2026-10-27-admin-pwa-wave4-events-merch-contents-messages-audit-design.md`

**Files:**
- Modify: `src/components/dashboard/admin/events/AdminEventDiscountCodesPanel.tsx`
- Modify: `src/components/dashboard/admin/merch/AdminMerchOrdersScreen.tsx`
- Modify: `src/components/admin/AdminGlobalContentRepositoryList.tsx`
- Modify: `src/app/[locale]/dashboard/admin/academic/contents/global/new/page.tsx`
- Modify: `src/app/[locale]/dashboard/admin/academic/contents/global/[contentId]/page.tsx`
- Modify: `src/app/[locale]/dashboard/admin/academic/contents/global/[contentId]/edit/page.tsx`
- Modify: `src/app/[locale]/dashboard/admin/academic/contents/sections/[sectionId]/edit/page.tsx`
- Modify: `src/components/dashboard/AdminMessageCard.tsx`
- Modify: `src/components/molecules/AdminAuditToolbar.tsx`
- Modify: `src/app/[locale]/dashboard/admin/settings/page.tsx`
- Modify: `src/app/[locale]/dashboard/admin/users/new/page.tsx`
- Test: `src/__tests__/components/AdminMessageCard.test.tsx`

- [ ] **Step 1: Write/update tests for `AdminMessageCard`, `AdminEventDiscountCodesPanel`, and `AdminMerchOrdersScreen`**
- [ ] **Step 2: Run targeted tests and verify failure**
- [ ] **Step 3: Implement Wave 4 changes**
  - In `AdminEventDiscountCodesPanel.tsx`: add mobile card layout (`md:hidden`) for discount codes and their expanded usage rows; keep `hidden md:table` for desktop.
  - In `AdminMerchOrdersScreen.tsx`: replace raw `<button>` elements with `Button` + leading Lucide icons (`PackageCheck`, `Check`, `XCircle`, `UserCheck`).
  - In Content Studio pages (`global/new`, `global/[contentId]`, `global/[contentId]/edit`, `sections/[sectionId]/edit`): remove the outer `<header className="rounded border p-5">` wrapper around `AdminPageHeader`; in `AdminGlobalContentRepositoryList.tsx`, remove the duplicate `<h2>{labels.repositoryTitle}</h2>` block.
  - In `AdminMessageCard.tsx`: replace `border-l-[3px]` and raw `amber`/`sky` classes with token classes (`bg-[var(--color-warning)]/15 text-[var(--color-foreground)]`, `bg-[var(--color-muted)]`) and organize the card into a clean top row (sender → recipient + time) and badge/preview rows.
  - In `AdminAuditToolbar.tsx`: keep search + domain visible on mobile and collapse secondary filters (action, resource, date range, actor UUID) behind a mobile toggle button (`SlidersHorizontal`), while keeping all fields visible on `md+`.
  - In `AdminSettingsPage.tsx` and `AdminUsersNewPage.tsx`: render `AdminPageHeader` with `tourAnchor` preserved.
- [ ] **Step 4: Run targeted tests and full test suite**
- [ ] **Step 5: Prepend product changelog entry in `src/lib/product-changelog/catalogEntriesNow.ts`**
