# Admin PWA Wave 1: Shell, Calendar Narrow Container, and Stackable Tables

**Intent:** Fix the shared mobile layout foundation across all admin routes so stackable tables do not mislabel `colSpan` or checkbox cells, mobile table wrappers do not render double borders, and the admin calendar does not nest a second full-viewport shell inside `AdminDashboardShell`.

**Done when:**

- `AdminStackableTableLabels` skips cells with `colSpan > 1` and skips columns whose `<thead>` header text is empty, so empty-state rows, expanded detail rows, and leading checkbox cells never receive an incorrect `data-label`.
- `src/app/globals.css` styles `table.ge-stack-cards` at `max-width: 767px` so rows have clean spacing, cells without `data-label` do not reserve a `40%` pseudo-label column, and wrappers around `table.ge-stack-cards` do not draw a redundant outer card border on narrow screens.
- `PortalCalendarEntry` does not wrap its narrow view in a second `min-h-dvh` padded container when rendered inside the admin dashboard shell.
- Unit tests in `src/__tests__/components/AdminStackableTableLabels.test.tsx` and `src/__tests__/components/PortalCalendarEntry.test.tsx` pass in isolation.

**Out of scope:**

- Section-specific roster layout (covered in Wave 2).
- Directory card and user dossier layout (covered in Wave 3).
- Event discount code and merch order components (covered in Wave 4).
