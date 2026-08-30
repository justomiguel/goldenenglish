# Join payment disposition (accept / first enroll)

**Date:** 2026-08-29  
**Status:** Approved (brainstorm)  
**Kind:** Design spec. One implementation plan under `docs/superpowers/plans/`.

**Related:**

- [`2026-08-28-registration-enrollment-fee-checkout-design.md`](2026-08-28-registration-enrollment-fee-checkout-design.md) — matrícula is a separate intake (pay / waive / receipt). This spec does not replace that flow.
- [`2026-08-28-trial-class-and-dual-cta-design.md`](2026-08-28-trial-class-and-dual-cta-design.md) — trial invite + `/unirse` convert. This spec changes the convert **quote** (matrícula if due **plus** current month) and seeds monthly status after capture.
- [`2026-08-07-class-pack-billing-design.md`](2026-08-07-class-pack-billing-design.md) — `billing_mode = class_pack` has no monthly fee. Skip month seeding on those sections.

**Governing rules:** `03-architecture.mdc` (250-line ceiling), `04-security.mdc`, `09-i18n-copy.mdc` (en + es; keep `pt.json` in the same shape), `12-supabase-app-boundaries.mdc`, `21-migrations-production-no-data-destruction.mdc`, `28-tenant-register-surface.mdc`.

No ADR: no new table, no new `payment_status` value, no new RLS. Reuses `payments` (`exempt` / approved without receipt), `section_enrollment_scholarships`, and `section_enrollments.last_enrollment_paid_at`.

## Intent

When a person **first enters a section**, someone must decide the monthly join state **explicitly**. If the course started in January and they join in October, January–September must not look like debt. October is paid, owed, or scholarship — according to that decision.

**Al día** means: matrícula paid or waived **if it exists**, **and** the join-month tuition paid. If either is missing, they are **not** al día.

## Context (today)

- Admin accept (`AdminRegistrationAcceptForm`) only collects optional `birth_date`. No monthly disposition.
- Intake (`waive` / `receipt` / `assign`) handles **enrollment fee only**.
- `academic_admin_section_enroll_commit` creates `section_enrollments` and **zero** `payments` rows.
- `buildStudentMonthlyPaymentsRow` treats months before `studentEnrolledAt` as `out-of-period` on the student strip. Admin collections with `billingScope: "plan-year"` can still show those months as `due` / overdue.
- Scholarships live in `section_enrollment_scholarships` and are assigned later from billing / collections.
- Trial convert (`planTrialConvertQuote`) charges **either** unpaid matrícula **or** first-month tuition, never both. Capture calls `acceptRegistrationLead` with `paidCapture` and only stamps `last_enrollment_paid_at`. The join month stays `due`.

There is no payment status named `ausente`. Class attendance `absent` is unrelated. Prior months that were never owed are stored as `payments.status = 'exempt'` so the collections matrix does not treat them as debt.

## Decisions

| Topic | Choice |
|-------|--------|
| Architecture | One **join billing disposition** applied at first section enrollment. Shared helper after enroll. |
| Admin choice | Required: `current` (al día) / `behind` (no al día) / `scholarship`. No default. |
| Scholarship extras | `%` 1–100 and scope: join month only, or join month through **last month of that section cycle** (`ends_on`, else last plan month of the cycle). Not calendar December unless that is the cycle end. |
| Prior months | Always `exempt` for billable months in the section/plan window **before** the join month. Join month only is what `behind` leaves owed. |
| Join month | Same “current period” helper the collections matrix uses for “this month” at enroll time. |
| Current / behind / scholarship writes | See table below. Future months untouched. |
| Matrícula | Unchanged intake. `current` also stamps `last_enrollment_paid_at` if a fee exists and is not already paid or waived. Scholarship does **not** waive matrícula. |
| Surfaces | Accept modal, assign-section intake, accept step-2 section picker, `enrollStudentInSectionAction` when it is the first enroll of that section. Same disposition for every section in that action. |
| Trial convert | No admin checkbox. Quote = unpaid matrícula (if any) **+** join-month tuition. Pay (or $0 total) → enroll as `current`. No pay → no enroll. No scholarship path on `/unirse`. |
| Class-pack section | Skip monthly seeding. `current` only closes matrícula if applicable. |
| New enum / “ausente” | No. Use `exempt`. |
| Existing students | Do not backfill. Only new enrolls after this ships. |
| Bulk import | Out of scope (already has its own payment seed). |

## Write table (per enrolled section)

Join month = current collections period at commit. Prior months = billable months in that section’s cycle window with period `<` join month.

| Disposition | Prior months | Join month | Later months | Matrícula |
|-------------|--------------|------------|--------------|-----------|
| `current` | Insert/ensure `payments.status = 'exempt'` | Approved without receipt (same core as cobranzas) | Untouched | Stamp paid if fee exists and not paid/waived |
| `behind` | Same exempt | No row (stays `due`) | Untouched | Do not stamp paid |
| `scholarship` | Same exempt | `section_enrollment_scholarships` at the given `%`, `valid_from` = join month, `valid_until` = join month **or** last cycle month | Covered only if scope is rest-of-cycle | Intake unchanged |

Reuse: `recordOnePaymentWithoutReceipt`, period exemption write, scholarship upsert used by admin billing. Do not invent a parallel writer.

## Admin UI

Cannot confirm accept / assign / first enroll without a disposition.

- Three explicit options (radio or equivalent). Empty is invalid.
- If `scholarship`: show `%` (1–100) and scope (this month / rest of cycle).
- Short preview from section start + join month, e.g. `Ene–Sep: exento · Oct: pagado`.
- Copy in en + es; keep `pt.json` keys in the same shape.

Server actions re-validate the same schema. UI-only checks are not enough.

## Trial convert

Invite mail (3-month link) stays. `/unirse` total:

1. Effective unpaid matrícula per selected payable section (already paid/waived → 0).
2. **Plus** join-month tuition for those sections (already paid month → 0).

One checkout. The amount line must show both parts (not “matrícula **or** month”).

`fee_snapshot` must record `kind` that reflects the combined quote (do not keep a single `enrollment` \| `first_month` discriminator that drops one side). After gateway capture / free path: accept lead, then run the same `current` seeder as admin.

Existing student adding a schedule: same quote + seeder on the **new** section only.

## Shared helper

One function, e.g. `applyJoinBillingDisposition`, called from:

- `finalizeAcceptedRegistrationLead` / accept path (after successful section enrolls)
- `assignRegistrationSectionAction` / `enrollStudentInSectionAction` when creating the enrollment
- `applyTrialConvertGatewayCapture` after accept (disposition fixed to `current`)

Input: `studentId`, `sectionIds`, disposition (`current` \| `behind` \| `scholarship` + percent + scope), “now”.

Idempotent:

- Do not overwrite an existing **approved** payment or an existing scholarship that already covers the join month.
- May fill missing prior-month `exempt` rows.
- Retry after a partial failure completes what is missing; does not double-charge.

If the seeder fails after enroll, the action returns an error. Do not report “al día” if months were not written. Admin retries the action or fixes the row in cobranzas.

## Edges

- Join month equals section start: no prior months; only join-month rule applies.
- Enroll **before** the section starts: do not exempt “backwards” into a window that is not billable yet. Do not create join-month debt until that month is billable.
- Several sections in one action: same disposition. Class-pack rows skipped; monthly sections still seeded.
- Validation failure (missing disposition, scholarship `%` outside 1–100, missing scope): reject before enroll when possible; if enroll already happened (trial capture), still fail the action and leave a retryable seed.

## Non-goals

- New `payment_status` / “ausente” billing state.
- Changing class attendance.
- Backfilling students already enrolled.
- Bulk import payment seed.
- Scholarship on the public trial convert page.
- Changing matrícula waive / receipt / public `/matricula` checkout (except `current` stamping `last_enrollment_paid_at` when needed).
- Seat holds, waitlist, or converting trial without payment when a positive total is due.

## Architecture (units)

| Unit | Responsibility |
|------|----------------|
| Join disposition schema | Zod: `current` \| `behind` \| `scholarship` + optional `%` / scope. Shared by accept, assign, enroll. |
| Cycle month planner | Given section window + join period, list prior months and last cycle month. Same period index as collections. |
| `applyJoinBillingDisposition` | Writes exempt / approved / scholarship. Idempotent. No UI. |
| Accept / assign / enroll actions | Require schema; enroll; call helper. |
| `planTrialConvertQuote` | Sum matrícula due + join-month due. |
| Trial capture | Accept + helper(`current`). |
| Accept / intake UI | Required control + preview. No default. |

Keep each file under the 250-line ceiling. Do not grow `AdminRegistrationAcceptForm` or `finalizeAcceptedRegistrationLead` with the write logic.

## Error handling

- Missing/invalid disposition: `validation` (no enroll).
- Seeder failure: log + action error. Enrollment may exist; retry is idempotent.
- Trial amount mismatch / expired token: unchanged skip/fail; no enroll.
- Class-pack + `current`: success without monthly rows.

## Testing

- **Planner:** January–December cycle, join October → prior Jan–Sep; join January → no prior; enroll before `starts_on` → no backwards exempt.
- **Seeder:** `current` / `behind` / `scholarship` (month vs rest-of-cycle %); does not overwrite approved; fills missing exempt; class-pack no-op.
- **Quote:** matrícula + month summed; either side 0 still works; both 0 → free enroll as `current`.
- **Actions:** accept without disposition rejected; accept with `behind` does not approve join month and does not stamp matrícula.
- **i18n:** new keys present in en, es, and pt shape.

No new Playwright unless an existing registration e2e already covers accept and is cheap to extend.

## Done when

1. Admin cannot accept or first-enroll without `current` / `behind` / `scholarship`.
2. Mid-cycle join: prior cycle months are `exempt` in cobranzas (not overdue). Join month matches the choice.
3. Scholarship `%` and scope persist as a real `section_enrollment_scholarships` row.
4. Trial convert checkout is matrícula (if due) + join-month tuition; payment enrolls as `current`; abandoning checkout leaves a lead.
5. Class-pack sections do not get fake monthly rows.
6. Isolated tests cover planner, seeder, and combined quote.

## Out of scope (confirmed)

- Import masivo.
- Historical enrollments.
- Admin checkbox on `/unirse`.
- Attendance “ausente” as a payment state.
