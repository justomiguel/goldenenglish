# Usability audit — remediation program

**Date:** 2026-08-06
**Status:** Approved
**Kind:** Umbrella / program index (not implementable on its own)
**Source:** UI usability audit run against the seeded local stack on 2026-08-06 (parent, student and admin sessions; desktop 1440×900 and mobile 390×844)

## Intent

The audit produced 20 findings. They are not one change: they span data correctness,
page metadata, navigation structure, routing and visual hierarchy. This document is the
index that keeps the program honest — every finding maps to exactly one child spec, and
this file is the closing checklist. It is **not** implemented directly; each child spec
gets its own approval, plan and TDD cycle.

## Diagnosis

The product does not have a visual design problem; it has a **naming and addressing**
problem. What the user reads in the menu is not what they read on arrival, the browser
tab does not say where they are, and several important screens have no address of their
own. Each of those breaks how a person builds a mental map of a system. Together they
explain why users report getting lost.

## Child specs and execution order

Order is driven by dependencies, not by severity alone.

| # | Spec | Closes | Depends on | State |
|---|------|--------|------------|-------|
| 1 | `2026-08-06-student-portal-own-chrome-design.md` | F03 | — | Merged |
| 2 | `2026-08-06-parent-active-student-persistence-design.md` | F01, F02 (behaviour) | 1 | Merged |
| 3 | `2026-08-06-mimundo-contrast-design.md` | F17 | — | Merged |
| 4 | `2026-08-06-page-titles-design.md` | F05 | — | Merged |
| 4b | Page identity: heading and breadcrumb | F04 (non-admin), F20 | 4 | **Not started** |
| 5 | `2026-08-06-admin-menu-design.md` | F06, F07, F14, F04 (admin) | 4 | Merged |
| 6 | `2026-08-06-section-areas-and-schedule-naming-design.md` | F08, F10 | 4 | Merged |
| 7 | `2026-08-06-home-screen-priority-design.md` | F11, F12, F15, F18 | 6 | Merged |
| 8 | `2026-08-06-destructive-actions-design.md` | F16, F19 | — | Merged |

Spec 1 precedes spec 2 because the student portal currently mounts the family shell.
Separating the two portals first means the active-student work touches only the family
portal, instead of a component shared by two audiences with different needs.

### How this differs from the plan above it

Two things changed once the code was read.

**Spec 4 was split.** It was going to carry titles, headings and breadcrumbs together. Titles
turned out to be a mechanical sweep of thirty-odd pages with almost no judgement in it,
while headings and breadcrumbs need decisions about wording and about which back
affordance to keep. Shipping them together would have buried the risky half inside a large,
boring diff. Spec 4 is the sweep; spec 4b is the judgement, and is **still open**.

**Spec 6 shrank, because two of its three findings were not real.** See the corrections
below.

## Corrections to the audit

Three of the twenty findings did not survive contact with the code. They are recorded here
so nobody re-opens them from the original report.

| ID | Claim | What the code shows |
|----|-------|---------------------|
| F08 | The section areas have no URL | They do — `?tab=fees`, read by the server on a cold load, and already deep-linked from the rubric editor. The real defect was `router.replace`, which meant no history entry, so the back button could not step through them. Fixed in spec 6 |
| F09 | The class schedule lives inside a modal | It does not. `AcademicSectionWeekScheduleEditor` is rendered inline in the section's configuration area. The only schedule-in-a-modal is the family read-only agenda, which is a reasonable use of one. **Closed as not reproducible** |
| F10 | "Asistencias" points at `/calendar` and mostly shows the agenda | The page is primarily attendance — a card per section per child with marks and a monthly percentage — so the family label is accurate. Only the internal route segment is misnamed. But the same screen is labelled "Mi agenda" in the **student** portal, which the audit did not check. That was the real instance of this defect, and spec 6 fixed it |

F17 was also misattributed: the audit read it as a component problem, and it was one value
in one tenant's database row. Spec 3 has the detail.

The lesson worth keeping: the audit was measured through a browser, so it was reliable about
symptoms and unreliable about causes. Every finding in it deserves a code check before work
starts.

## Finding inventory

Severity as assessed in the audit. Every finding appears in exactly one spec above.

| ID | Finding | Severity | Spec |
|----|---------|----------|------|
| F01 | Selected student is lost when navigating (`?child=` vs `?studentId=`) | Critical | 2 |
| F02 | Two different student pickers depending on the screen | High | 2 |
| F03 | Students see copy written for their parents | High | 1 |
| F04 | Menu label does not match the heading of the page it opens | High | 4 |
| F05 | Almost every page shares the same browser-tab title | High | 4 |
| F06 | A third of the admin menu belongs to no group | High | 5 |
| F07 | Four distinct destinations are named almost identically | High | 5 |
| F08 | The five academic-section areas have no URL | High | 6 |
| F09 | The class schedule lives inside a modal, inside another page | High | 6 |
| F10 | "Asistencias" points at `/calendar` and mostly shows the agenda | Medium | 6 |
| F11 | Family home omits Progress, the most sought-after data | Medium | 7 |
| F12 | Desktop and mobile show different content at the same address | Medium | 7 |
| F13 | Four portal sections are reachable only through inner tabs | Medium | 7 |
| F14 | The admin menu starts 427 px below the top edge | Medium | 5 |
| F15 | Admin home puts birthdays above pending payments | Medium | 7 |
| F16 | The only solid buttons on the section page are archive and delete | Medium | 8 |
| F17 | Near-invisible text on the family mobile home | High | 3 |
| F18 | Family desktop home wastes half the screen | Medium | 7 |
| F19 | The interface explains its own layout instead of being self-evident | Low | 8 |
| F20 | Inconsistent breadcrumbs and two contradictory ways back | Medium | 4 |

## Measured evidence

Kept here so child specs can cite it without re-measuring.

### Browser-tab titles

11 of 13 measured routes return the brand name duplicated (`<brand> | <brand>`) with no
page name. Only `/admin/academic`, `/admin/site-setup`, `/admin/glossary` and
`/parent/calendar` set a real title. `/admin/analytics`, `/admin/coupons` and
`/dashboard/profile` render no `<h1>` at all.

### Menu label vs page heading (admin)

| Menu label | Page heading |
|------------|--------------|
| Resumen | Panel de administración |
| Hub académico | Cohortes y secciones |
| Contenido y temas | Gestión del sitio público |
| Configuración del sitio | Configuración del instituto |
| Inscripciones | Inscripciones web |
| Analítica | *(no heading)* |

### Contrast, family mobile home (390×844)

| Element | Size | Measured | Required |
|---------|------|----------|----------|
| "Ver blog" / "Ver eventos" | 12 px | 1.08 : 1 | 4.5 : 1 |
| Greeting `h1` | 20 px bold | 1.65 : 1 | 3 : 1 |
| Ward name and instruction line | 14 px | 2.02 : 1 | 4.5 : 1 |
| "Novedades" heading | 11 px | 2.02 : 1 | 4.5 : 1 |
| Bottom tab-bar labels | 10 px | 4.11 : 1 | 4.5 : 1 |

## Done when

1. All eight child specs are written, approved, implemented and merged.
2. Every finding F01–F20 is either closed by its spec or explicitly reopened here with a
   reason.
3. This file records the closing state of each child spec.

## Closing state

Eight specs written and approved; seven implemented and merged. Every finding is accounted
for below.

| Finding | State |
|---------|-------|
| F01, F02 | Closed on behaviour by spec 2. The two pickers still look different; see the open item below |
| F03 | Closed by spec 1 |
| F04 | Admin half closed by spec 5. Parent, student and teacher halves open in spec 4b |
| F05 | Closed by spec 4 for the parent, student, teacher and assistant portals; spec 5 covered the six admin pages it renamed. The remaining admin pages are the open item below |
| F06, F07, F14 | Closed by spec 5 |
| F08 | Reframed and closed by spec 6 |
| F09 | Closed as not reproducible. See Corrections |
| F10 | Reframed and closed by spec 6 |
| F11, F12, F15, F18 | Closed by spec 7 |
| F13 | Narrowed by spec 7: the grouping is by design, the missing `feedback` alias was the defect and is fixed |
| F16, F19 | Closed by spec 8 |
| F17 | Closed by spec 3, plus the `color.error` addendum found during spec 8 |
| F20 | **Open.** Spec 4b |

### Still open, and why

**Spec 4b — headings and breadcrumbs (F04 non-admin, F20).** Not started, deliberately.
The breadcrumb work needs a decision this programme could not make without looking at real
screens: all five breadcrumb components return `null` when a path yields a single crumb, so
on many pages the `ArrowLeft` link the audit called a redundant second way back is in fact
the *only* way back. Removing it where a breadcrumb is genuinely present, and only there,
needs eyes on each breakpoint. Research already done and worth reusing:

- Five components — `AdminBreadcrumb`, `ParentBreadcrumb`, `StudentBreadcrumb`,
  `TeacherBreadcrumb`, `AssistantBreadcrumb` — all skip UUID segments through the same
  `UUID_RE`, so `/teacher/sections/<uuid>/attendance` never names the section.
- `AdminBreadcrumb` falls back to the raw string for an unrecognised non-UUID segment; the
  other four silently drop it. That inconsistency is cheap to fix and carries no visual risk.
- `SectionAttendancePageBody` and `teacherAttendanceMatrixNav` are the two confirmed places
  where a breadcrumb and a back arrow appear together. `ArrowLeft` appears in roughly forty
  further files, almost all of them legitimate — galleries, wizards, hero navigation — so a
  blanket sweep would be wrong.

**Remaining admin tab titles.** Spec 4 deliberately skipped the admin portal so spec 5 could
rename first. Spec 5 titled the six pages it renamed; about a dozen admin pages still fall
back to the brand name alone. Mechanical, and `buildPageMetadata` is waiting for them.

**The two family pickers still look different.** `ParentChildSwitcher` is a row of chips and
`ParentWardPicker` is a select. Spec 2 unified what they do; spec 7 reworked the home around
them without merging them. Half of F02's complaint therefore stands.

**Mi Mundo inherits navy `color.primary.light` and `color.primary.dark`** because its seed
never overrode them, so an olive brand renders navy hovers and gradients across forty-odd
components. A real defect, out of scope for spec 3 because it is brand consistency rather
than contrast and it changes the public landing pages.

**A `color.error.dark` token** would let destructive labels be red and still legible on every
tenant. Spec 8 had to use a border instead. Worth doing as a palette change with its own QA.

**Confirmation flows are inconsistent** — modal with checkbox, `ConfirmActionModal`, a
bespoke modal, and an in-page two-step toggle. Spec 8 unified how destructive buttons look,
not how they behave.

## Out of scope

- The teacher portal beyond its home screen, the assistant portal, gateway payment flows,
  the public-site CMS and event registration. Not reviewed in this audit pass; a separate
  audit would be needed before specifying work there.
- Rebuilding the design system (shared `Card`, `Select`, `Toast`, `EmptyState`
  primitives). Real gaps, but orthogonal to "users get lost" and large enough to need
  their own program.
- Any Supabase schema change. Two data-only migrations were needed after all —
  `174_site_theme_mimundo_contrast.sql` and `175_site_theme_mimundo_error_contrast.sql`,
  both correcting one tenant's palette, following the precedent of
  `124_site_themes_accessible_contrast.sql`. No table, column or policy changed.

## Follow-up to investigate separately

Immediately after login, `/es/dashboard` returned a 500 with
`SyntaxError: Unexpected end of JSON input` and recovered on reload. Observed once in the
dev server; not reproduced. Not attributable to any finding above and not covered by any
child spec.
