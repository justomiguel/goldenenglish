# Directory cuota, matrícula, and last enrollment

**Date:** 2026-08-29  
**Status:** Implementing on main  
**Kind:** Design spec. Implementation plan after this file is approved.  
**Governing rules:** `03-architecture.mdc` (250-line ceiling), `09-i18n-copy.mdc` (es / en / pt, no hardcoded UI), `30-harness-self-contained-tests.mdc`.

**Related:**

- Locked-role directories: `/admin/students`, `/admin/parents`
- Student extras: `loadAdminStudentDirectoryExtras` (sections, parents, current-month `monthlyDue`)
- Parent extras: `loadAdminParentDirectoryExtras` (children, sections)
- Sort/pagination: `sortAdminUsers` + `loadAdminLockedRoleDirectory` (in-memory sort, then page)
- Monthly overdue rule: `studentMonthlyPaymentsViewHasOverdueBalance` (portal + Finanzas)
- Matrícula visual: `enrollmentFeeMatrixVisualFromSectionRow`

## Intent

On admin **Alumnos** and **Padres**, staff can see at a glance whether a person is current on monthly fees and whether charged enrollment fees are paid, and can sort the full list by the most recent active section enrollment.

## Decisions locked

| Topic | Choice |
|-------|--------|
| Surfaces | Alumnos and Padres only. Teachers and unlocked Usuarios unchanged |
| Monthly mark | Same rule as Finanzas/portal: `overdue > 0` on the year summary. Matrícula and event invoices do not affect it |
| Monthly `—` | No monthly fee to evaluate: no active section, class-pack billing, or no monthly plan |
| Matrícula mark | Person-level. `no` if any charged enrollment fee is unpaid; `sí` if at least one is charged and all charged are paid; `—` if none are charged |
| Charged matrícula | Section `enrollment_fee_amount` > 0 and the enrollment is not exempt |
| Paid matrícula | `last_enrollment_paid_at` set **or** receipt status `approved`. Pending, rejected, or due = unpaid |
| Last enrollment | `MAX(section_enrollments.created_at)` among **active** enrollments. Parent: max across linked children. None: `—` |
| Parent monthly rollup | `no` if any child is monthly-overdue; `sí` if at least one child is monthly-current and none overdue; `—` if every child is `—` |
| Parent matrícula rollup | Same three-way rule over the union of the children's charged enrollments |
| Alumnos cuota column | Keep the current-month amount. Add the monthly mark in the **same** cell |
| New columns | **Matrícula** (mark) and **Última inscripción** (locale date) on both lists. Padres also get a **Cuota** mark-only column |
| Sort: last enrollment | New sort key. Click header like the others. Rows with no date sort **last** in both `asc` and `desc` |
| Sort: matrícula | New sort key. Rank `no` < `—` < `sí` (reverse when `desc`) |
| Sort: cuota | Unchanged: by current-month **amount**. The mark does not change that order |
| When computed | Directory extras, **before** filter/sort/paginate, so sort uses the full matched set |
| Persistence | No migrations, no new tables, no denormalized flags |
| Failure | If monthly overdue cannot be computed for one student, that student's monthly mark is `—`; the rest of the list still renders |

## Done when

1. Alumnos shows cuota amount + monthly mark, matrícula mark, and last-enrollment date. Padres shows monthly mark, matrícula mark, and last-enrollment date.
2. Marks are `Sí` (green pill), `No` (red pill), or `—` (muted, no pill). Tooltips: monthly current / overdue / not applicable; matrícula paid / unpaid / not charged. Copy in es / en / pt.
3. Clicking **Última inscripción** or **Matrícula** rewrites `sort` / `dir` in the URL and reorders the **full** filtered set, then paginates.
4. Parent marks and last-enrollment date follow the rollup rules above.
5. Desktop table and PWA list show the same three facts. PWA sort options include last enrollment and matrícula.
6. Isolated tests cover: monthly/matrícula tri-state (student and parent rollup), last-enrollment max + empty-last sort, URL sort keys, and table/PWA columns.

## Out of scope

- Teachers directory and unlocked `/admin/users`
- New filters (“solo vencidos”, “matrícula impaga”)
- Changing how Finanzas or the parent/student portal compute overdue
- Event invoices, class-pack balances, or emails/reminders
- Showing last enrollment on the user profile page
- Default sort change (lists still default to name ascending)
- Database objects or backfills

## Approaches considered

1. **Mark in the existing cuota cell + matrícula and last-enrollment columns (chosen).** Avoids a fourth money/status split on Alumnos. Padres get a mark-only cuota column because they have no amount today.
2. Separate columns for amount, monthly status, matrícula, and date. Rejected: too wide, especially on Padres.
3. Icons plus a “vencidos” filter, date hidden. Rejected: staff asked for an explicit mark and a visible sortable date.

## Data

Add to `AdminUserRow` (and the extras maps that fill it):

| Field | Type | Meaning |
|-------|------|---------|
| `monthlyStatus` | `"yes" \| "no" \| "na"` | Monthly cuota mark |
| `enrollmentFeeStatus` | `"yes" \| "no" \| "na"` | Matrícula mark |
| `lastEnrollmentAt` | `string \| null` | ISO timestamp of the latest active enrollment |

Pure helpers (no I/O) own the tri-state and parent rollup so tests do not boot Supabase:

- Student monthly: if no monthly fee applies (no active section, class-pack, or no plan) → `na`; else if year-summary overdue > 0 → `no`; else `yes`. The current-month amount in the Alumnos cell is independent of this mark.
- Student matrícula: ignore enrollments that are not charged; if none charged → `na`; if any charged unpaid → `no`; else `yes`.
- Parent rollup: apply the same three-way rule to the children’s statuses (monthly) or to the union of charged enrollments (matrícula).
- Last enrollment: `max(created_at)` of active enrollments; parent = max of children; `null` if empty.

Load path stays `loadAdminLockedRoleDirectory` → extras → `sortAdminUsers` → page. Extend `SortKey` with `lastEnrollment` and `enrollmentFee`. `lockedRoleUsersParams` accepts those keys.

Monthly overdue reuses `studentMonthlyPaymentsViewHasOverdueBalance` (or the year-summary it wraps). Matrícula reuses the charged/paid predicates behind `enrollmentFeeMatrixVisualFromSectionRow` (paid = approved or `lastEnrollmentPaidAt`; exempt / amount ≤ 0 = not charged). Do not invent a second billing rule.

## UI

**Alumnos columns:** Name · Sections · Cuota (amount + mark) · Matrícula · Última inscripción · Parents.

**Padres columns:** Name · Email · Children · Sections · Cuota (mark only) · Matrícula · Última inscripción · Last access.

Pills match the existing “sin sección” chip scale. Last enrollment formats as a short locale date (not relative time). Empty date shows `—`.

PWA cards list the same facts under the existing section/cuota/parent (or email/access) block. Sort menu adds the two new keys.

## Tests

- Helper tests: student monthly `yes` / `no` / `na` (including class-pack / no section); student matrícula `yes` / `no` / `na` (exempt, pending receipt, approved, multi-section mix); parent rollups; `lastEnrollmentAt` max; sort empty dates last in both directions; matrícula rank `no` < `na` < `yes`.
- Param parse: `sort=lastEnrollment` and `sort=enrollmentFee` accepted on locked directories.
- Table/PWA: new columns/labels present for student and parent lock; teacher lock unchanged.

No e2e required for this spec.
