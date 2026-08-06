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

| # | Spec | Closes | Depends on |
|---|------|--------|------------|
| 1 | `2026-08-06-student-portal-own-chrome-design.md` | F03 | — |
| 2 | Active-student persistence in the family portal | F01, F02 | 1 |
| 3 | Contrast of the family mobile shell | F17 | — |
| 4 | Page identity: title, heading, breadcrumb, menu names | F04, F05, F20 | — |
| 5 | Admin menu grouping and naming | F06, F07, F14 | 4 |
| 6 | Real URLs for section areas and family schedule | F08, F09, F10 | 4 |
| 7 | Priority and density of the home screens | F11, F12, F13, F15, F18 | 6 |
| 8 | Destructive-action weight and self-describing copy | F16, F19 | — |

Spec 1 precedes spec 2 because the student portal currently mounts the family shell.
Separating the two portals first means the active-student work touches only the family
portal, instead of a component shared by two audiences with different needs.

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

## Out of scope

- The teacher portal beyond its home screen, the assistant portal, gateway payment flows,
  the public-site CMS and event registration. Not reviewed in this audit pass; a separate
  audit would be needed before specifying work there.
- Rebuilding the design system (shared `Card`, `Select`, `Toast`, `EmptyState`
  primitives). Real gaps, but orthogonal to "users get lost" and large enough to need
  their own program.
- Any Supabase migration. None of the eight specs requires a schema change.

## Follow-up to investigate separately

Immediately after login, `/es/dashboard` returned a 500 with
`SyntaxError: Unexpected end of JSON input` and recovered on reload. Observed once in the
dev server; not reproduced. Not attributable to any finding above and not covered by any
child spec.
