# Admin experience unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every admin destination use the same experience as Alumnos: banner, white rounded-2xl body, primary CTAs, sky pills, primary back links.

**Architecture:** Lock a page-type contract (list / hub / form / detail / editor / wizard). Fix the shared `UniversalListView` shell first so people + audit inherit it. Then swap leftover editor `h1`s for `AdminPageHeader`, then academic / finance / Instituto / ficha bodies. No new routes, RPCs, or table rebuilds.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind theme tokens, Lucide, Vitest + Testing Library.

**Spec:** [`docs/superpowers/specs/2026-08-22-admin-experience-unification-design.md`](../specs/2026-08-22-admin-experience-unification-design.md)

## Global Constraints

- No `git commit` unless the user explicitly asks.
- No migrations, new routes, or new RPCs.
- `--color-secondary` is never an admin page `h1` / chrome `h2` / list CTA.
- Existing `data-tour` ids relocate onto `AdminPageHeader` or stay on the same element; do not rename them.
- Home, Impulsa, and people-page KPI cards are the reference — do not restyle Home.
- Teacher / parent / student **content** is out of scope.
- Tables/filters/forms stay; only chrome (radius, card fill, CTA color, header) changes.
- Copy in `es` / `en` / `pt` stays; no new product nouns.
- Inputs may keep `rounded-[var(--layout-border-radius)]`. Shells may not.
- Finish mini N before starting mini N+1.

## File map

| File | Responsibility |
|------|----------------|
| `src/components/organisms/UniversalListView.tsx` | One table card for every consumer (people, audit, …) |
| `src/components/dashboard/AdminBackLink.tsx` | Primary back link used by details |
| `src/components/dashboard/AdminPageHeader.tsx` | Already shipped — editors must call it |
| `src/components/dashboard/AdminSurfaceCard.tsx` | Already shipped — forms wrap with it or copy its classes |
| Editor shells under `src/components/dashboard/admin/cms/` | Replace raw `h1` with `AdminPageHeader` |
| `SiteSetupWizard.tsx` / `BootstrapAdminForm.tsx` | Banner once, keep step chrome |
| Academic / finance / Instituto / ficha organisms | Body-card class sweep |

**Body-card class (copy verbatim):**

```
rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-[var(--shadow-soft)]
```

---

### Task 00: Shared list shell

**Files:**
- Modify: `src/components/organisms/UniversalListView.tsx`
- Create: `src/components/dashboard/AdminBackLink.tsx`
- Test: `src/__tests__/components/organisms/UniversalListView.test.tsx`
- Test: `src/__tests__/components/dashboard/AdminBackLink.test.tsx`

**Interfaces:**
- Consumes: existing `UniversalListViewProps` (do not change the public API)
- Produces: `AdminBackLink({ href, children, title?: string })`

- [ ] **Step 1: Write the failing tests**

`src/__tests__/components/organisms/UniversalListView.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { UniversalListView } from "@/components/organisms/UniversalListView";

const sortLabels = { sortHintAsc: "asc", sortHintDesc: "desc", sortedAsc: "sorted asc", sortedDesc: "sorted desc" };

describe("UniversalListView", () => {
  it("wraps the table in the admin body card", () => {
    const { container } = render(
      <UniversalListView
        columns={[{ id: "name", label: "Name" }]}
        sortKey="name"
        sortDir="asc"
        onToggleSort={() => {}}
        sortLabels={sortLabels}
        emptyMessage="none"
        isEmpty={false}
      >
        <tr>
          <td>Ada</td>
        </tr>
      </UniversalListView>,
    );
    const shell = container.querySelector("table")?.parentElement;
    expect(shell?.className).toContain("rounded-2xl");
    expect(shell?.className).toContain("--color-background");
    expect(shell?.className).toContain("--shadow-soft");
    expect(shell?.className).not.toContain("--layout-border-radius");
    expect(screen.getByText("Ada")).toBeInTheDocument();
  });
});
```

`src/__tests__/components/dashboard/AdminBackLink.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminBackLink } from "@/components/dashboard/AdminBackLink";

describe("AdminBackLink", () => {
  it("is a primary link", () => {
    render(<AdminBackLink href="/es/dashboard/admin/users">Back</AdminBackLink>);
    const link = screen.getByRole("link", { name: "Back" });
    expect(link).toHaveAttribute("href", "/es/dashboard/admin/users");
    expect(link.className).toContain("--color-primary");
    expect(link.className).not.toContain("--color-secondary");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/components/organisms/UniversalListView.test.tsx src/__tests__/components/dashboard/AdminBackLink.test.tsx`

Expected: FAIL — `AdminBackLink` missing; UniversalListView wrapper still has `--layout-border-radius`.

- [ ] **Step 3: Implement**

In `UniversalListView.tsx`, replace the table wrapper `className` with:

```tsx
className={`rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-[var(--shadow-soft)] ${
  tableOverflow === "hidden" ? "overflow-x-hidden" : "overflow-x-auto"
}`}
```

Create `AdminBackLink.tsx`:

```tsx
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export function AdminBackLink({
  href,
  children,
  title,
}: {
  href: string;
  children: ReactNode;
  title?: string;
}) {
  return (
    <Link
      href={href}
      title={title}
      className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-[var(--color-primary)] hover:underline"
    >
      <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
      {children}
    </Link>
  );
}
```

- [ ] **Step 4: Re-run tests — pass**

Run: `npx vitest run src/__tests__/components/organisms/UniversalListView.test.tsx src/__tests__/components/dashboard/AdminBackLink.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit** — skip until the user asks.

---

### Task 01: Editors and wizard titles

**Files:**
- Modify: `src/components/dashboard/admin/cms/SiteThemeEditorShell.tsx`
- Modify: `src/components/dashboard/admin/cms/SiteThemeRawEditorShell.tsx`
- Modify: `src/components/dashboard/admin/cms/LandingEditorOverview.tsx`
- Modify: `src/components/dashboard/admin/cms/LandingSectionEditorShell.tsx`
- Modify: `src/components/dashboard/admin/cms/HeroVisualEditorShellTop.tsx`
- Modify: `src/components/dashboard/admin/site-setup/SiteSetupWizard.tsx`
- Modify: `src/components/dashboard/admin/site-setup/BootstrapAdminForm.tsx`
- Modify: `src/components/dashboard/admin/cms/blog/BlogArticleEditor.tsx`
- Modify: `src/app/[locale]/dashboard/admin/cms/blog/new/page.tsx`
- Modify: `src/app/[locale]/dashboard/admin/cms/blog/[id]/edit/page.tsx`

**Interfaces:**
- Consumes: `AdminPageHeader({ title, lead?, iconId, actions?, tourAnchor? })`
- Produces: `BlogArticleEditor` gains optional `pageTitle: string`

- [ ] **Step 1: Write a failing test for the theme editor title**

Add to `src/__tests__/components/SiteThemeEditorShell.test.tsx` (file already exists) an assertion that the page title is inside a `banner` (`getByRole("banner")`) and the heading class contains `--color-primary`. If the current test looks for a raw `h1` only, keep that role query — `AdminPageHeader` still renders `h1`.

- [ ] **Step 2: Run the existing SiteTheme / Landing / SiteSetup tests — note failures**

Run: `npx vitest run src/__tests__/components/SiteThemeEditorShell.test.tsx src/__tests__/components/SiteThemeRawEditorShell.test.tsx`

- [ ] **Step 3: Replace each raw title block**

Pattern for `SiteThemeEditorShell` (keep the existing back link; swap the `<header>…<h1>` for):

```tsx
<AdminPageHeader
  title={labels.title.replace("{{name}}", theme.name)}
  lead={theme.isActive ? labels.activeNotice : labels.draftNotice}
  iconId="cms"
  actions={
    <div className="flex flex-wrap items-center gap-2">
      {/* existing ghost/primary buttons unchanged */}
    </div>
  }
/>
```

Same `iconId="cms"` on landing / hero / raw shells. `iconId="siteSetup"` on `SiteSetupWizard` and `BootstrapAdminForm`. `iconId="blog"` on `BlogArticleEditor`.

`BlogArticleEditor` props: add `pageTitle: string`. Render `<AdminPageHeader title={pageTitle} iconId="blog" tourAnchor={ADMIN_TOUR_ANCHORS.blogEditorRoot} />` **above** the locale tabs. Move `data-tour={ADMIN_TOUR_ANCHORS.blogEditorRoot}` from the outer grid onto the header.

New page passes `pageTitle={dict.admin.cms.blog.list.create}`. Edit page passes `pageTitle={dict.admin.cms.blog.list.title}`.

- [ ] **Step 4: Grep the eight shells for `<h1` — empty**

Run: `rg '<h1' src/components/dashboard/admin/cms src/components/dashboard/admin/site-setup src/components/dashboard/admin/cms/blog/BlogArticleEditor.tsx`

Expected: no matches.

- [ ] **Step 5: Re-run SiteTheme / blog / tour tests**

Run: `npx vitest run src/__tests__/components/SiteThemeEditorShell.test.tsx src/__tests__/components/SiteThemeRawEditorShell.test.tsx src/__tests__/lib/admin-tutorials/tourAnchorDomPresence.test.tsx`

Expected: PASS. `blogEditorRoot` still exists (now on the banner).

- [ ] **Step 6: Commit** — skip.

---

### Task 02: Academic bodies

**Files:**
- Modify: `src/components/organisms/AcademicCohortDetailShell.tsx`
- Modify: `src/components/organisms/AcademicSectionPageShellBody.tsx`
- Modify: `src/components/organisms/AcademicSectionEnrollCard.tsx`
- Modify: `src/components/organisms/AcademicSectionFeesPanel.tsx`
- Modify: `src/components/organisms/AcademicSectionTeachersPanel.tsx`
- Modify: `src/components/organisms/AcademicSectionHealthOverview.tsx`
- Modify: `src/components/organisms/AcademicSectionAssessmentsPanel.tsx`
- Modify: `src/components/organisms/AcademicSectionConfigurationPanel.tsx`
- Modify: `src/components/organisms/AcademicSectionLearningRoutePanel.tsx`
- Modify: `src/components/organisms/AcademicSectionStudentsPanel.tsx`
- Modify: `src/components/admin/AdminLearningRoutesGrid.tsx`
- Modify: `src/components/admin/AdminGlobalContentRepositoryList.tsx` (only leftover item shells)

**Interfaces:**
- Consumes: body-card class string from the spec
- Produces: no new public API

- [ ] **Step 1: Grep academic shells for leftover surface**

Run: `rg 'bg-\[var\(--color-surface\)\]|rounded-\[var\(--layout-border-radius\)\]' src/components/organisms/Academic*.tsx src/components/admin/AdminLearningRoutesGrid.tsx src/components/admin/AdminGlobalContentRepositoryList.tsx`

- [ ] **Step 2: Replace each **wrapper** (not inputs) with the body-card class.** Do not change tab ids, loaders, or the section name `h1`.

Example wrapper:

```tsx
<section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-5 shadow-[var(--shadow-soft)]">
```

- [ ] **Step 3: Run academic tests**

Run: `npx vitest run src/__tests__/components/AcademicHubCohortBoard.test.tsx src/__tests__/components/AcademicHubToolbar.tour.test.tsx src/__tests__/components/AdminGlobalContentRepository.test.tsx`

Expected: PASS

- [ ] **Step 4: Commit** — skip.

---

### Task 03: Finance bodies

**Files:**
- Modify: leftover wrappers in `src/components/dashboard/admin/finance/` that still use `bg-surface` + old radius (inbox, collections toolbar/export, receipt bulk bars, insights cards)
- Modify: `src/components/dashboard/AdminRecordPaymentActionBar.tsx`
- Modify: `src/components/dashboard/AdminRecordPaymentRevertBar.tsx`
- Modify: `src/components/dashboard/PaymentReviewRow.tsx` only if reject/approve still use secondary (approve already primary)

**Interfaces:**
- Consumes: body-card class; `Button variant="ghost" | "primary"`; reject uses `--color-error`
- Produces: no new public API

- [ ] **Step 1: Grep finance leftovers**

Run: `rg 'bg-\[var\(--color-surface\)\]|variant="secondary"' src/components/dashboard/admin/finance src/components/dashboard/AdminRecordPaymentActionBar.tsx src/components/dashboard/AdminRecordPaymentRevertBar.tsx src/components/dashboard/PaymentReviewRow.tsx`

- [ ] **Step 2: Restyle wrappers to the body-card class. Change list `variant="secondary"` to `ghost` except modal Cancel.**

- [ ] **Step 3: Run finance tests**

Run: `npx vitest run src/__tests__/components/FinanceHubTabs.test.tsx src/__tests__/components/FinanceHubKpiStrip.test.tsx src/__tests__/components/AdminEventPaymentReviewActions.test.tsx`

Expected: PASS

- [ ] **Step 4: Commit** — skip.

---

### Task 04: Instituto list bodies

**Files:**
- Modify: `src/components/organisms/PortalSpecialEventCreateForm.tsx`
- Modify: `src/components/organisms/PortalSpecialEventsTable.tsx`
- Modify: `src/components/dashboard/admin/communications/EmailTemplatesShell.tsx` (select/workspace wrappers only)
- Modify: leftover `bg-surface` in `src/components/dashboard/admin/cms/blog/` list/review if any remain
- Modify: `src/components/dashboard/AdminAuditToolbar.tsx` only if its chrome uses secondary

Audit table inherits Task 00 automatically.

**Interfaces:**
- Consumes: body-card class
- Produces: no new public API

- [ ] **Step 1: Grep Instituto leftover shells**

Run: `rg 'bg-\[var\(--color-surface\)\]|rounded-\[var\(--layout-border-radius\)\]' src/components/organisms/PortalSpecialEvent*.tsx src/components/dashboard/admin/communications src/components/dashboard/admin/cms/blog src/components/dashboard/AdminCouponsClient.tsx src/components/dashboard/AdminPromotionsTable.tsx src/components/dashboard/admin/badges`

Treat hits on **inputs** as OK. Fix **wrappers**.

- [ ] **Step 2: Apply body-card to those wrappers. Calendar special create/table must look like the coupons form+table pair.**

- [ ] **Step 3: Run**

Run: `npx vitest run src/__tests__/components/dashboard/AdminEventsStatsRow.test.tsx src/__tests__/lib/admin-tutorials/tourAnchorDomPresence.test.tsx`

Expected: PASS

- [ ] **Step 4: Commit** — skip.

---

### Task 05: Details and PWA admin

**Files:**
- Modify: `src/components/desktop/organisms/AdminUserDetailDesktop.tsx` — replace the hand-rolled back `Link` with `AdminBackLink`
- Modify: `src/components/pwa/organisms/AdminUserDetailPwa.tsx` — same
- Modify: `src/components/dashboard/AdminStudentBillingEntry.tsx` — same
- Modify: `src/app/[locale]/dashboard/admin/events/[eventId]/page.tsx` — same
- Modify: `src/app/[locale]/dashboard/admin/finance/collections/[sectionId]/page.tsx` — same
- Modify: `src/components/dashboard/admin/events/AdminEventAttendeeExpandedDetails.tsx`
- Modify: `src/components/dashboard/admin/events/AdminEventPaymentReviewActions.tsx`
- Modify: leftover mailbox/compose wrappers in `src/components/dashboard/AdminPortalCompose.tsx` and `AdminPortalMessageDetailView.tsx` **except** the prose `[&_h1]:text-[var(--color-secondary)]` rule (message HTML)

**Interfaces:**
- Consumes: `AdminBackLink`
- Produces: no new public API

- [ ] **Step 1: Swap back links**

```tsx
<AdminBackLink href={`/${locale}/dashboard/admin/users`} title={labels.tipDetailBack}>
  {labels.detailBack}
</AdminBackLink>
```

- [ ] **Step 2: Restyle event-detail inner cards to the body-card class.**

- [ ] **Step 3: Run**

Run: `npx vitest run src/__tests__/lib/admin-tutorials/tourAnchorDomPresence.test.tsx src/__tests__/components/dashboard/AdminBackLink.test.tsx src/__tests__/components/AdminEventPaymentReviewActions.test.tsx`

Expected: PASS

- [ ] **Step 4: Commit** — skip.

---

### Task 06: Verify

**Files:** none new. Greps + existing tests.

**Interfaces:** none

- [ ] **Step 1: Editor `h1` grep is empty**

Run: `rg '<h1' src/components/dashboard/admin/cms src/components/dashboard/admin/site-setup src/components/dashboard/admin/cms/blog/BlogArticleEditor.tsx`

Expected: no matches.

- [ ] **Step 2: No admin chrome title uses secondary**

Run: `rg 'h1[^\n]*--color-secondary' src/app/\[locale\]/dashboard/admin src/components/dashboard src/components/organisms --glob '*.tsx'`

Expected: no matches except `AdminPortalMessageDetailView` prose selectors (message HTML). If that file matches, confirm the hit is `[&_h1]:text-[var(--color-secondary)]` only.

- [ ] **Step 3: Shell surface grep**

Run: `rg 'bg-\[var\(--color-surface\)\].*rounded-\[var\(--layout-border-radius\)\]|rounded-\[var\(--layout-border-radius\)\].*bg-\[var\(--color-surface\)\]' src/components/dashboard src/components/organisms src/components/admin src/components/desktop/organisms src/components/pwa --glob '*.tsx'`

Expected: remaining hits are inputs, drawers, or help FAB — not page list/hub/form/detail shells. Fix any leftover **page shell**.

- [ ] **Step 4: Chrome + tour suite**

Run: `npx vitest run src/__tests__/components/dashboard/StaffChromeThemeTokens.test.tsx src/__tests__/components/dashboard/AdminPageHeader.test.tsx src/__tests__/lib/admin-tutorials/tourAnchorDomPresence.test.tsx src/__tests__/components/organisms/UniversalListView.test.tsx src/__tests__/components/dashboard/AdminBackLink.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit** — skip until the user asks. One commit should cover spec + minis + plan + implementation when they ask.

## Self-review

1. **Spec coverage:** Mini 00–06 each have a task. Contract tokens, editor `h1` list, UniversalListView, back link, academic/finance/Instituto/ficha, verify greps are tasked.
2. **Placeholders:** None. Body-card class and `AdminBackLink` / `AdminPageHeader` signatures are written out.
3. **Types:** `AdminBackLink` props and `BlogArticleEditor.pageTitle` are the only new names; later tasks use those exact names.

## Manual QA (user)

1. Alumnos unchanged.
2. Every daily drawer item: banner + white body card.
3. Every Instituto tile: same.
4. One CMS editor + Site setup: banner, canvas/steps still work.
5. One ficha + one event: primary back + banner + white cards.
6. Phone admin lists: no secondary chips.
