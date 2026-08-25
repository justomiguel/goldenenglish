# Mini 00 — Shared list shell

**Parent:** [`../2026-08-22-admin-experience-unification-design.md`](../2026-08-22-admin-experience-unification-design.md)

## Intent

Every table that already uses `UniversalListView` inherits the people-page card in one place. Optional `AdminBackLink` so detail pages stop inventing secondary “Volver” colors.

## Done when

- `UniversalListView` table wrapper is `rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-[var(--shadow-soft)]`.
- Empty state with toolbar still renders the toolbar.
- `AdminBackLink` renders a primary underlined-on-hover link with optional `ArrowLeft`.
- Tests cover those two facts and do not import Next.js pages.

## Out of scope

Changing columns, sort, or pagination API. Restyling consumers one by one (they inherit).

## Files

- Modify: `src/components/organisms/UniversalListView.tsx`
- Create: `src/components/dashboard/AdminBackLink.tsx`
- Test: `src/__tests__/components/organisms/UniversalListView.test.tsx`
- Test: `src/__tests__/components/dashboard/AdminBackLink.test.tsx`
