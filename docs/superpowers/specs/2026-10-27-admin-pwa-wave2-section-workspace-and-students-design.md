# Admin PWA Wave 2: Section Workspace and Students View

**Intent:** Make the section workspace (`/dashboard/admin/academic/[cohortId]/[sectionId]`) and its `Students`, `Configuration`, `Evaluations`, and `Attendance` areas clean, compact, and usable on phones (`< 768px`) without nested card bloat or cramped 3-column tables.

**Done when:**

- `AcademicSectionPageHeader` uses compact padding on narrow screens (`px-4 py-4 sm:px-6 sm:py-6`).
- `AcademicSectionShellWorkspace` renders `enrollmentLinkPanel` only on the section hub (`area === null`), so opening `?tab=students` (or any other area) shows the area workspace immediately above the fold.
- `AcademicSectionAreaBlock` and `AcademicSectionAreaSummaryBand` use responsive padding (`p-3.5 sm:p-5`) and avoid triple-nested card borders on mobile.
- `AcademicSectionStudentsPanel` integrates the active enrollment count badge into the roster header bar alongside the `AcademicSectionEnrollCard` button instead of rendering a separate full-width summary card above the roster.
- `AcademicSectionRosterToolbar` renders status filter pills with counts and places the `capacityOverride` checkbox inside a compact secondary row only when `tab === "active"` and `moveTargets.length > 0`.
- `AcademicSectionRosterTable` renders localized status labels from `dict.lifecycle.enrollmentStatus` (`active`, `dropped`, `transferred`, `completed`) instead of raw database status strings.
- On narrow viewports (`< md`), `AcademicSectionRosterTable` renders dedicated student cards with full-width student name link, debt/care badges, localized status badge, and a clean full-width transfer row (`select` + `Mover` button). Desktop (`md+`) keeps the sortable table.
- `AcademicSectionWeekScheduleGrid` wraps the 7-day grid in an `overflow-x-auto` container with `min-w-[38rem]` so weekday columns remain legible and tappable on phones.
- `AssessmentRosterGradingClient` and `AcademicPendingTransfers` use `ge-stack-cards` so their tables stack cleanly on narrow screens.
- All section workspace and roster unit tests pass.

**Out of scope:**

- Changing enrollment or section transfer server actions.
- Modifying database schema or RLS policies.
