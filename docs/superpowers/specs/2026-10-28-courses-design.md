# Courses

**Date:** 2026-10-28
**Status:** Approved in chat (implement without visual mockups)
**Kind:** Design spec

**Related:** `docs/adr/2026-10-28-courses-as-packaged-products.md`, `docs/superpowers/specs/2026-09-03-tenant-merch-shop-design.md`

## Intent

An admin packages repository items into a **course**. A course has modules and lessons, in order, and an optional evaluation as a lesson. A **learning route** is an ordered list of one or more courses. A section route, a direct section assignment, or a personal grant gives a student the course. The student sees those courses under **Mi curso** (progress). A published course can also show in the institute shop with a price.

## Decisions

| Topic | Choice |
| --- | --- |
| Name | Course. The admin area stays **Contenidos académicos**, with a **Cursos** tab |
| Atoms | A lesson points at one `content_templates` row. The same item can sit in many courses |
| Shape | Course → modules → lessons |
| Route | A route contains only courses. A loose item is wrapped in a course first |
| Section access | Live. Current and future active enrollments see the course. Leaving the section removes it |
| Personal grant | Admin assignment or a purchase. It stays after the student leaves a section |
| Both grants | The student sees the course once. Origins can be section, purchase, and assignment together |
| Progress | Each course is `open` or `sequential`. Sequential unlocks the next lesson when the current one is completed. A low score does not lock the rest |
| Shop | The institute public shop. Flag `listed_in_shop` plus a price. Not a Centro Listo marketplace |
| Who pays | Age uses `legal.age.majority`. An adult student may pay for self. A minor cannot. A missing birth date blocks self-pay. A parent may buy for a linked student of any age. A public buyer for a minor becomes a parent. A public buyer for self with an adult birth date becomes a student |
| Price 0 | Listed and published enrolls with no gateway |
| Price > 0 | Flow or Mercado Pago, tenant billing currency. Paid status writes a personal grant with source `purchase` |
| Draft | Hidden from students and from the shop |
| Old routes | Each existing route step becomes one published open course (one module, one lesson). The step row stays. Access reads `learning_route_courses` |
| Table name | The package table is `learning_courses`. `public.courses` stays the CEFR catalog from `001_initial_schema.sql` (level, modality, year) used by student import |

## Surfaces (Web vs PWA)

Student progress is **Tier A**. It already uses `ParentProgressEntry` inside `ParentRouteSurfaceGate`. Narrow and installed PWA hide the lead and use the PWA ward picker. The course list is one column of full-width rows with a 44px target. The same list is the Web and PWA interaction: open a lesson in order. No second tree.

Admin contents is **Tier B**, desktop-only. The new tab follows the existing contents tabs.

The public shop catalog is Tier A marketing. Course cards match the existing shop grid. Checkout pages stay in the shop tree.

## Data

- `learning_courses` — title, slug, status `draft|published`, `progress_mode` `open|sequential`, price ≥ 0, `listed_in_shop`, optional cover, `migrated_from_step_id`. This is not `public.courses`
- `course_modules` — title, sort order
- `course_lessons` — title, `content_template_id`, sort order
- `learning_route_courses` — route, course, sort order
- `section_course_assignments` — extra courses on a section
- `student_course_grants` — student, course, source `admin|purchase`
- `course_lesson_progress` — student, lesson, `completed_at`
- `course_orders` — buyer, assignee student, course, amount, status, pay token

A listed course must be published and must have a slug.

## Screens

1. Admin **Cursos** tab: list, then a form that saves title, mode, price, shop flag, modules, and lessons picked from the repository.
2. Student progress picker gains **Cursos** when the student has at least one visible course. Each row shows origins. Lessons show locked, open, or completed. The student can mark an unlocked lesson complete.
3. Public shop lists published courses with `listed_in_shop` beside merch.

## Out of scope

- Centro Listo cross-tenant marketplace
- Drip by date
- Passing score as a lock
- Dropping `learning_route_steps`
- Rewriting the route graph editor in this change. New access uses `learning_route_courses`. The migration fills that table from current steps.

## Done when

- A published course on a section route is visible to an active enrollee and hidden after the enrollment is no longer active.
- A personal grant stays visible after the student leaves the section.
- Sequential mode locks lesson N until lesson N-1 is complete. Open mode does not.
- A minor student cannot self-pay. An adult student can. A parent can pay for a linked student.
- Admin can create a course from repository items.
- The student progress screen lists those courses.
- Existing route steps are copied into courses without deleting the steps.
