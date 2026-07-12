# Plan: Admin help — create user tours

**Spec:** [`docs/superpowers/specs/2026-07-11-admin-help-create-user-tours-design.md`](../specs/2026-07-11-admin-help-create-user-tours-design.md)  
**Date:** 2026-07-11

## Approach

1. Catalog ids `create-student` | `create-teacher` | `create-admin` + icons.
2. Pure path helper + step builders (shared staff + student with birth branch).
3. Extend Driver runner with student birth-path branch buttons (mirror cohort branch).
4. Client starters: navigate to `/users/new`, wait for form; student waits for guardian vs email after branch.
5. `data-tour` on create-user form, subnav Add, sidebar Users.
6. Dictionaries en/es/pt + `startAdminTutorial` switch + Vitest.

## Tasks

- [x] Path helper + selectors + catalog + icons
- [x] Pure step builders (student + staff) + tests
- [x] `runDriverTour` birth-path branch outcomes
- [x] Client starters + `startAdminTutorial` wiring
- [x] Form / subnav / sidebar anchors
- [x] i18n en/es/pt
- [x] Vitest catalog/list + runners (mocked)
- [ ] Manual QA (user): three tours, guide-only (no create)

## Defaults (from spec)

- Guide only — never submit
- Nav steps when not on create page
- Two guardian steps on minor path
- No birth steps on teacher/admin
