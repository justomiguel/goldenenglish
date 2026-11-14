# Move a student and choose what follows

**Intent:** When staff move a student from one section to another, a menu asks which agreements follow. The student always moves. Checked items leave the origin section and attach to the destination enrollment. Unchecked items stay on the transferred origin enrollment.

**Done when:** The section roster and the enrolled-registration panel open the same menu before any save. Payments, scholarships, the enrollment fee, and the annual settlement start checked. Attendance and grades start unchecked. A payment for the same month, or an active scholarship for the same student, on the destination section is a collision. Each collision offers Leave or Replace. One database transaction applies the move and the chosen items. A missing collision choice saves nothing. Staff can quote a stable error code.

**Out of scope:** A second student profile. Learning-task progress. Retention alerts. Class-reminder jobs (the old enrollment still cancels them). Teacher transfer flows. Editing the destination fee plan. Profile-level `profiles.enrollment_fee_exempt`.

## Surfaces (Web vs PWA)

Tier B. The academic section page is admin. It already splits a desktop table and narrow cards with `useAppSurface` (`AcademicSectionRosterTable`, `AcademicSectionRosterCards`). There is no `src/components/pwa/` tree for this screen.

The menu is one shared modal. The desktop table and the narrow cards both open it. On a narrow surface, each action is at least 44px tall and the actions stack full width. The enrolled-registration panel (`AdminRegistrationEnrolledPanel`) is admin desktop. It opens the same modal. Shared props do not add a second move path.

## What staff see

Staff pick a destination section and press Move. The menu opens. Nothing is saved yet.

The student always moves. The origin enrollment becomes `transferred`. The destination enrollment is `active`.

Checkboxes:

| Box | Starts | What moves |
|---|---|---|
| Monthly payments | On | `payments` rows for that student and the origin `section_id` |
| Scholarships and discounts | On | `section_enrollment_scholarships` for the origin enrollment |
| Enrollment fee | On | Fee fields on `section_enrollments` listed below |
| Annual settlement | On | `section_enrollment_annual_settlements` for the origin enrollment |
| Attendance | Off | `section_attendance` for the origin enrollment |
| Grades | Off | `section_grades` and `enrollment_assessment_grades` for the origin enrollment |

Checked rows leave the origin and attach to the destination. Unchecked rows stay on the transferred origin enrollment. The student is no longer active there and has none of those unchecked agreements on the new enrollment.

Learning tasks stay on the origin enrollment. The menu does not list them.

## Collisions

A payment collides when the destination section already has a non-superseded `payments` row for the same student, month, and year.

A scholarship collides when the destination section already has an active `section_enrollment_scholarships` row for the same student. Each origin scholarship that staff chose to carry is its own collision row.

The enrollment fee, the annual settlement, attendance, and grades attach to the new enrollment. That enrollment is empty, so those four do not collide.

Each collision row has two actions:

- **Leave.** That item stays on the origin. The destination row does not change. The rest of the checked items still move.
- **Replace.** For a payment, the destination row is superseded and the origin row takes that section and month. For a scholarship, the active destination scholarships for that student on that section become inactive, and that origin scholarship moves. A second origin scholarship can still be left behind. Deactivating the destination rows again is safe.

If staff confirm while a collision has no choice, the server saves nothing. The message names the month or the scholarship and shows the code `carry_choice_missing`.

## Replace without deleting money

Do not delete a payment. Add nullable `payments.superseded_at` and `payments.superseded_by_payment_id`. Rebuild `payments_student_section_period_uidx` so a superseded row does not occupy `(student_id, section_id, month, year)`.

Replace sets `superseded_at` and `superseded_by_payment_id` on the destination payment, then sets the origin payment `section_id` to the destination. Billing reads ignore superseded rows. The receipt stays on the superseded row for support.

Deactivate a replaced destination scholarship with `is_active = false`. Do not delete it.

## Enrollment fee fields

When the fee box is checked, copy these columns from the origin enrollment to the new enrollment, then clear them on the origin enrollment:

- `enrollment_fee_exempt`
- `enrollment_exempt_reason`
- `enrollment_fee_receipt_url`
- `enrollment_fee_receipt_status`
- `last_enrollment_paid_at`
- `enrollment_fee_paid_method`
- `enrollment_fee_paid_on`

When the box is unchecked, the new enrollment keeps the column defaults. The origin enrollment keeps its values.

Carried payments keep the amount already stored. Later months use the destination section fee plan. A carried scholarship applies its percent on that plan.

A carried grade keeps its `assessment_id`. The exam stays the exam of the cohort that recorded it. If the destination section is in another cohort, the grade still refers to the original exam.

## Save path

One RPC in `supabase/migrations/` runs the whole write. The server action calls it only after `assertAdmin`. A failure rolls back the enrollment change and every carry update.

`moveStudentSectionWithCarryAction` is the shared action.

- The roster still previews capacity and schedule before the save. `CAPACITY_EXCEEDED` and `SCHEDULE_OVERLAP` keep today's behavior. The carry choices stay in the client and go with the final commit.
- The registration panel still requires an enrolled lead and a section in the same cohort. It then calls the same action.

The RPC checks collisions again. It does not trust the client list alone.

After success, the server revalidates the academic surfaces and the registration inbox. The client calls `router.refresh()`.

`recordSystemAudit` uses action `academic_section_move_carry`, resource type `section_enrollment`, and a payload of student id, section ids, checkbox flags, and collision choices (`leave` or `replace` plus row ids). The payload has no receipt URLs and no scholarship note text.

## Errors

Each cause has its own code and its own sentence in `en.json`, `es.json`, and `pt.json`. The sentence says why it failed and what to do next. The same code is in the `[ge:server]` log.

| Code | When |
|---|---|
| `carry_choice_missing` | A collision has no Leave or Replace choice |
| `section_move_same` | The destination is the current section |
| `section_move_outside_cohort` | The registration panel target is outside the lead cohort |
| `CAPACITY_EXCEEDED` | The roster target is full and override is off |
| `SCHEDULE_OVERLAP` | The roster target overlaps and staff have not confirmed |
| `forbidden` | The caller is not an admin |
| `not_found` | The student, section, or enrollment is missing |
| `save_failed` | The RPC failed after the checks above |

An unknown code is shown raw in the message.

## ADR

This change alters who can see a payment or a scholarship on a section, and it adds columns on `payments`. Write `docs/adr/2026-11-13-section-move-carry.md` in the same implementation. The ADR records the superseded payment, the single RPC, and the decision to keep learning tasks on the origin enrollment.

## Tests

- A pure planner maps flags and collision choices to row updates. Leave skips that row. Replace supersedes the destination payment or deactivates the destination scholarship.
- An unchecked flag produces no update for that table.
- A missing choice returns `carry_choice_missing` and writes nothing.
- The modal starts with the four finance boxes on and attendance and grades off.
- The roster and the registration panel both send the carry payload.
- A test fails if a known code renders a generic sentence. The unknown-code assertion shows the raw code.

## Manual QA (user)

Move one student on a tenant roster with a paid month and a scholarship. Confirm Leave and Replace on a month that already exists in the destination. Repeat the menu from the enrolled registration panel.
