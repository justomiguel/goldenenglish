# Workplace internal headers

**Date:** 2026-08-22
**Status:** Ready to execute (user asked for spec + implementation of every leftover internal screen)
**Kind:** Full. One contract, one wave.

**Depends on:** workplace chrome unification (`WorkplaceShell`) and section banners already shipped (`AdminPageHeader` + `artFamily` parent / student / teachers / staff). This spec does **not** reopen rail IA, destinations, or Home.

**Plan:** [`../plans/2026-08-22-workplace-internal-headers.md`](../plans/2026-08-22-workplace-internal-headers.md)

## Intent

Every authenticated workplace destination that is **not Home** must introduce itself with `AdminPageHeader`. Chrome is already shared. Banners are not: several parent, student, teacher, PWA-narrow, billing, and leftover import screens still use a raw `h1`.

A tutor who opens Calendario, a teacher who opens Contenidos de sección, or a student who opens una tarea must feel they are still in the same product as Mensajes / Pagos / Alumnos.

## Why now

Homes already greet (admin Home, parent Today, student greeting, teacher home). Section hubs already have banners. The leftover internals are the last mismatch.

## Approaches considered

1. **Swap the page header block only (chosen).** Same `AdminPageHeader` contract: `title`, optional `lead`, `iconId`, `artFamily`, optional `actions`, optional `tourAnchor`. Lists, forms, cards, and tours stay.
2. Restyle bodies in the same pass. Out of scope; that is the admin-experience unification, not this wave.
3. Leave PWA-narrow screens on compact `h1`s. Rejected: they now sit inside `WorkplaceShell`.

## Page types (normative)

| Type | Required chrome |
|------|-----------------|
| **Section / list** | `AdminPageHeader` once at the top. Embedded children (`embedded === true`) render **no** second banner. |
| **Detail** | Optional primary back link already owned by a layout, then `AdminPageHeader` (title = entity name). Status chips go in `actions`. |
| **Form** | Layout owns the banner when one exists. The form must not repeat title + back. |
| **Status return** | `AdminPageHeader` + existing status body / receipt. No second `h1`. |

Homes stay greetings. Do not put `AdminPageHeader` on `ParentTodayScreen`, `ParentHomeInbox`, `ParentHomePwaFocus`, `StudentDashboardEntry`, teacher home, or `AdminHubHome`.

## Art + icon map

| Screen family | `iconId` | `artFamily` |
|---------------|----------|-------------|
| Parent academic (tasks, assessments, task detail) | `academic` | `parent` |
| Parent badges (standalone only) | `badges` | `parent` |
| Parent calendar / attendance PWA | `calendar` | `parent` |
| Parent messages / payments PWA-narrow | `messages` / `finance` | `parent` |
| Student mini-tests / task detail / billing | `academic` / `academic` / `finance` | `student` |
| Teacher section contents / section tasks | `contents` / `academic` | `teachers` |
| Payment flow return | `finance` | omit (icon map → finance art) |
| Leftover admin import (non-embedded) | `students` | omit |

Keep existing `data-tour` ids. Put `tourAnchor` on `AdminPageHeader` when the old `h1` wrapper owned the tour.

## Inventory (must convert)

Standalone header only when **not** embedded (progress + `/parent/child/*` already own a banner):

- `ParentAssessmentsScreen`
- `ParentTasksListScreen`
- `ParentBadgesScreen` — drop the kicker; the banner is the title

Always convert:

- `ParentTaskDetailScreen`
- `StudentMiniTestsSection`
- `StudentLearningTaskDetail`
- `TeacherSectionContentsScreen` (enabled + disabled titles)
- `TeacherSectionLearningTasks`
- `ParentAttendancePwaScreen` (schedule CTA → `actions` on desktop)
- `ParentMessagesPwaClient`
- `ParentPaymentsScreenPwa`
- `BillingPortalEntry`
- `PaymentsFlowReturnSurfaceEntry`
- `PortalProfileSurfaceEntry`
- `AdminImportScreenDesktop` / `AdminImportScreenNarrow` when **not** `embedded`
- `PortalCalendarPageLayout` portal (non-admin) path — same banner as admin calendar

## Duplicate chrome (must remove, not banner)

`ParentWardProfileForm` is only mounted inside `ParentChildDetailLayout`, which already has back + `AdminPageHeader`. Remove the form’s back link, `h1`, and lead. Keep `childDetailBody` / `profileForm` tours. `childDetailTitle` stays on the layout.

## Out of scope

- Home greetings and Impulsa
- `MyProfileScreen` / `MyProfilePwaScreen` identity hero (person name + avatar, same class as `AdminUserIdentityHero`)
- `AcademicSectionNameEditor` (inline section-name control)
- Public / auth / blog / register / landing
- Body card restyle, new copy, new routes, renamed tours
- `--color-secondary` as a page `h1`

## Done when

- Every screen in the inventory uses `AdminPageHeader` (or no header when embedded / layout-owned).
- `ParentWardProfileForm` no longer renders a page title or home back link.
- Existing tour ids still present.
- Tests that query `h1` / heading still pass against the banner `h1`.
- `npx vitest` on the touched screen tests is green.
