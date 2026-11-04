# E2E: task delivery, shop catalog, parent attendance

## Intent

Cover three journeys that the isolated suite does not cover today.

1. A student submits an open learning task. The section teacher sees the answer.
2. An admin creates a shop product and activates it. The public catalog lists it. No checkout.
3. An admin marks the seeded student present. The parent sees Presente on the child attendance page.

## Done when

- `e2e/critical-learning-task.spec.ts` passes on Desktop Chrome with the student and teacher storage states.
- `e2e/critical-shop-catalog.spec.ts` passes on Desktop Chrome with the admin storage state.
- `e2e/critical-parent-attendance.spec.ts` passes on Desktop Chrome with the admin and parent storage states.
- The e2e seed leaves one open task, `E2E Learning Task`, on section A for `e2e-student`, status `OPENED`. Each reseed resets that progress so the submit can run again.
- Playwright has a project whose `testMatch` includes each new file.

## Out of scope

- Shop checkout and paid courses.
- A second teacher attendance matrix. `e2e/critical-attendance.spec.ts` already marks the same admin grid.
- PWA layout changes. These specs use Desktop Chrome.
- Product changelog. This change is tests and seed only.

## Surfaces (Web vs PWA)

- Learning task: Tier A. The student home and the task detail already render on web and PWA through the same task list. This spec uses Desktop Chrome. It does not change props, hooks, or actions.
- Shop catalog: admin merch is Tier B (desktop-only). The public `/tienda` page is the existing catalog. No PWA tree change.
- Parent attendance: Tier A. `/dashboard/parent/child/attendance` already renders `ParentAttendanceHistory` for the web page. This spec uses Desktop Chrome. It does not change the PWA attendance screen.

## Seed

`supabase/seeds/e2e/seed-admin.sql` inserts or updates `task_instances` titled `E2E Learning Task` on `v_section`. `start_at` is yesterday. `due_at` is 14 days ahead. It deletes that task's `student_task_progress` (submissions cascade) and inserts one `OPENED` row for the active enrollment of `v_student`.

`merch_enabled` is already true. The shop spec creates a new product in the UI, so the seed does not insert a product.

## Assertions

- Student opens `/dashboard/student/progress?tab=tasks`, follows `E2E Learning Task` to `/dashboard/student/tasks/{id}`, writes an answer, and sees `Tarea completada` / `Task completed`. The student progress list uses that student route. The parent list stays on the tutor route.
- Teacher opens `/dashboard/teacher/sections/{E2E_SECTION_ID}/tasks` and sees the student label, the task title, and that answer.
- Admin opens `/dashboard/admin/merch`, creates a product, adds one variant, clicks Activar / Activate, then `/tienda` shows the title. A product stays a draft until it has a variant.
- Admin marks the first editable `Student E2E` cell as `P` when it is not already `P`. Parent opens `/dashboard/parent/child/attendance`, expands the latest records, and sees `Presente` / `Present`.
