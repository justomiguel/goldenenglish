# Courses as packaged products

## Context

Repository items and learning routes exist. A route step points at a content template. Staff need a sellable package: ordered modules and lessons, assignment to a section or a student, and a price on the institute shop. A minor must not pay. An adult student may.

## Decision

The package table is `learning_courses`. `public.courses` remains the CEFR level catalog from the initial schema. A course is the package. Lessons point at `content_templates`. A learning route is an ordered list of courses. Section access follows active enrollment. A purchase or an admin grant is personal and survives leaving the section. The shop lists a published course when `listed_in_shop` is true. Checkout reuses Flow and Mercado Pago. Self-pay uses `legal.age.majority`.

## Options considered

Put the course inside merch variants. Rejected. Variants, stock, and pickup are for goods.

Replace routes in one destructive cut. Rejected. Existing step rows stay. A migration copies each step into a course.

## Consequences

New tables and RLS in `supabase/migrations/230_courses.sql`. Student progress shows a Courses section. Paid checkout writes `student_course_grants` with source `purchase`. Audit uses `recordSystemAudit` on admin create. Product events use `recordUserEventServer` when a student completes a lesson.
