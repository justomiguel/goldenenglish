# Admin PWA Wave 3: Directories, User Dossier, and Finance Mobile UX

**Intent:** Give person names and metadata full breathing room on directory cards, remove duplicate chrome in the user dossier, and make section collections and receipt review scannable on mobile.

**Done when:**

- `AdminUsersPwaListItem` removes the duplicate `Pencil` icon link (which pointed to the exact same `/${locale}/dashboard/admin/users/${r.id}` URL as the `Eye` link and the name link), keeping one profile link + the delete button, and stacks the name row and metadata cleanly so names are not crushed to ~140px.
- `AdminUserIdentityHero` uses compact mobile padding (`p-4 sm:p-5`), removes the duplicate role card from the `<dl>` (since the role pill is already next to the `<h1>`), and renders DNI and member-since in a 2-column compact grid (`grid-cols-2`).
- `AdminUserProfileFicha` and `AdminUserProfileTabPanels` avoid double card padding on narrow viewports (`p-3 sm:p-5`).
- `SectionCollectionsMatrixMobile` adds Prev/Next student navigation buttons beside the student `<select>` and shows each student's overdue/paid status in the option label so the admin can scan and step through the section roster with one tap.
- `AdminFinanceReceiptReviewClient` uses a compact preview height on mobile (`max-h-[42vh] lg:max-h-[70vh]`), uses `Button` / `useRouter` instead of `window.location.href`, and keeps the Approve/Reject controls immediately reachable.
- `AdminStudentBillingPaymentsTable` replaces `border-l-4` with a token-compliant row tint (`bg-[var(--color-success)]/10`) to satisfy the no-side-stripe design rule.
- Tests for directory items, user dossier, and section collections mobile pass.

**Out of scope:**

- Changing billing calculation rules or payment gateway logic.
- Desktop directory table columns.
