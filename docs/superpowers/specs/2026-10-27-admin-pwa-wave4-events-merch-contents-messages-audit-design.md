# Admin PWA Wave 4: Events, Merch, Content Studio, Messages, Audit, and Headers

**Intent:** Eliminate raw unstyled tables and buttons, duplicate page headers, side-stripe message borders, and uncollapsed mobile filter walls across Events, Merch, Content Studio, Messages, Audit, and Settings.

**Done when:**

- `AdminEventDiscountCodesPanel` renders discount codes and their expanded usage list with responsive mobile cards (`md:hidden`) and keeps the table for `md+`.
- `AdminMerchOrdersScreen` uses the design-system `Button` component with leading Lucide icons (`Check`, `PackageCheck`, `XCircle`) instead of raw unstyled `<button>` elements.
- Content Studio pages (`global/new`, `global/[contentId]`, `global/[contentId]/edit`, `sections/[sectionId]/edit`) render `AdminBackLink` + `AdminPageHeader` directly without wrapping `AdminPageHeader` inside a second bordered `<header className="rounded border p-5">`.
- `AdminGlobalContentRepositoryList` removes the duplicate `repositoryTitle` and `repositoryStudioLead` heading block that `AdminGlobalContentRepository` already renders above it.
- `AdminMessageCard` replaces `border-l-[3px]` and raw `amber-*` / `sky-*` classes with semantic design tokens and a 2-line mobile header so sender, recipient, badges, and timestamp do not collide.
- `AdminAuditToolbar` collapses secondary filters (action, resource type, date range, actor UUID) on mobile behind a toggle button while keeping search and domain visible; desktop (`md+`) shows all filters inline.
- `AdminSettingsPage` and `AdminUsersNewPage` use `AdminPageHeader` for visual consistency across admin pages.
- All affected component tests pass.

**Out of scope:**

- Event creation wizard steps or seat-map canvas logic.
- TipTap rich text editor internals.
