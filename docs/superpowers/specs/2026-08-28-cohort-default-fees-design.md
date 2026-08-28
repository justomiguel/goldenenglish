# Cohort default enrollment and monthly fees

**Date:** 2026-08-28
**Status:** Approved (brainstorm)
**Kind:** Design spec. One implementation plan under `docs/superpowers/plans/`.

**Related:**

- [`docs/adr/2026-04-section-enrollment-fee.md`](../../adr/2026-04-section-enrollment-fee.md) — matrícula lives on the section; `0` means this section does not charge. This spec adds a **nullable** stored amount and a cohort fallback. It does not move matrícula onto fee plans.
- [`docs/adr/2026-04-section-fee-plans-and-monthly-strip.md`](../../adr/2026-04-section-fee-plans-and-monthly-strip.md) — cuota is `section_fee_plans`. A cohort default is a live fallback when **no** plan is in effect, not a new plan row.
- [`2026-08-07-class-pack-billing-design.md`](2026-08-07-class-pack-billing-design.md) — `class_pack` sections ignore monthly-fee defaults. Enrollment fee is unchanged in meaning.

**Governing rules:** `03-architecture.mdc` (250-line ceiling), `09-i18n-copy.mdc`, `12-supabase-app-boundaries.mdc`, `15-entity-crud-completeness.mdc`, `21-migrations-production-no-data-destruction.mdc`, `30-harness-self-contained-tests.mdc`.

No ADR: this extends the existing section-fee contract. It does not introduce a new billing product.

## Intent

An admin sets matrícula and cuota once on the cohort. New sections inherit those amounts until the admin sets a section-specific value. Changing the cohort default updates every section that still has no own value, without rewriting section rows. Sections that already store a matrícula (including `0`) or already have a fee plan keep charging their own amounts.

## Context

Today:

- `academic_sections.enrollment_fee_amount` is `NOT NULL DEFAULT 0`. Create-section omits the column, so every new section stores `0` (“does not charge”).
- Cuota is only `section_fee_plans`. Create-section does not insert a plan. `resolveSectionPlanMonthlyAmount` returns `no_plan` when none exists.
- `academic_cohorts` has no fee columns. The cohort overview (lifecycle + KPIs) has no money fields.
- Billing readers (`loadStudentMonthlyPaymentsView`, `buildCohortCollectionsMatrix`, `loadAdminSectionPageData`, first-class checklist) treat `enrollment_fee_amount == null` as `0` and treat missing plans as unconfigured.

The admin must open every section to set the same matrícula and cuota.

## Decisions

| Topic | Choice |
|-------|--------|
| Storage | Defaults on `academic_cohorts`. Section stores its own matrícula or `NULL`. Cuota override = a real `section_fee_plans` row |
| Inheritance | Live fallback. Do not copy numbers onto sections when the cohort default changes |
| Section already has a value | Section always wins. Existing rows keep stored `0` or existing plans |
| `NULL` vs `0` on section matrícula | `NULL` = inherit. `0` = this section does not charge, even if the cohort has a default |
| New section | Insert `enrollment_fee_amount = NULL`. Do not create a fee plan |
| Create-section modal | No matrícula/cuota fields. Override happens on the section fees page |
| Where to edit defaults | Cohort overview, below the KPI strip. Not on “new cohort”. Not in Finanzas |
| Archived cohort | Defaults visible, not editable |
| Copy sections into another cohort | New rows stay empty and inherit the **destination** cohort |
| `class_pack` | Monthly default does not apply. Enrollment default still applies |
| Currency | No per-cohort currency. Inherited cuota uses `DEFAULT_SECTION_FEE_PLAN_CURRENCY` (`USD`). Matrícula still reuses the effective plan currency; if there is no plan, `USD` |
| Cohort field empty vs `0` | Empty saves `NULL` (no default). `0` is a real default: inheriting sections charge `0` for that concept (matrícula `0`; cuota is a virtual plan of `0`, not `no_plan`) |
| Apply-to-all / backfill | Out of scope |

## Architecture

### Data

Migration (additive, no deletes):

1. `academic_cohorts.default_enrollment_fee_amount NUMERIC(12,2) NULL` with `CHECK (default_enrollment_fee_amount IS NULL OR default_enrollment_fee_amount >= 0)`.
2. `academic_cohorts.default_monthly_fee NUMERIC(12,2) NULL` with the same CHECK.
3. `academic_sections.enrollment_fee_amount`: drop `NOT NULL` and change `DEFAULT` from `0` to `NULL`. Keep `CHECK (enrollment_fee_amount IS NULL OR enrollment_fee_amount >= 0)`. **Do not** UPDATE existing rows. Every current `0` stays `0` (explicit “no charge”).

Comments:

- Cohort columns: optional live defaults for sections that have no own value.
- Section column: `NULL` inherits the cohort default (or `0` if the cohort has none). `0` means this section does not charge matrícula.

RLS unchanged: cohort write is already admin-only; section write is already admin-only.

Do not change `admin_cohort_collections_bulk` SQL to bake in fallbacks. The RPC keeps returning the stored section amount (now nullable). TypeScript resolves after load, with the cohort defaults selected in the same admin query.

### Resolution

One pure helper module, e.g. `src/lib/billing/resolveCohortFeeDefaults.ts`, used by every charge path. No reader may treat raw `enrollment_fee_amount` as the amount due.

**Matrícula**

```
if section.enrollment_fee_amount != null → section.enrollment_fee_amount
else if cohort.default_enrollment_fee_amount != null → cohort.default_enrollment_fee_amount
else → 0
```

**Cuota**

```
if section billing_mode is class_pack → class_pack_section (unchanged)
else if resolveEffectiveSectionFeePlan(non-archived plans, year, month) is non-null → that plan
  (a plan that only starts in the future does not cover earlier months; those months inherit)
else if cohort.default_monthly_fee != null → virtual plan { monthlyFee, currency: USD }
else → no_plan
```

The virtual plan is not persisted. `resolveSectionPlanMonthlyAmount` runs the same proration, `full_month_fee`, scholarships, and annual-settlement branches it uses today, with `monthlyFee` / `currency` taken from the virtual plan.

Call sites that must resolve (not an exhaustive file list for the plan, but the contract):

- `resolveSectionPlanMonthlyAmount`
- `loadStudentMonthlyPaymentsView` / `buildStudentMonthlyPaymentsRow`
- `buildCohortCollectionsMatrix` / section collections views
- `loadAdminStudentBillingTabData`
- `loadAdminSectionPageData` (summary + editor need both stored and effective)
- `deriveAdminFirstClassChecklistFacts` / its loader (see below)
- Monthly checkout / Flow paths that already go through `resolveSectionPlanMonthlyAmount`

### First-class checklist

`hasSectionFees` is true when **any** live section has:

- a stored `enrollment_fee_amount > 0`, or
- a stored `NULL` matrícula and its cohort `default_enrollment_fee_amount > 0`, or
- an existing monthly plan with `monthly_fee > 0` (today’s global count), or
- a stored-empty monthly side and its cohort `default_monthly_fee > 0` (for non-`class_pack`), or
- `class_pack` + a class-pack price (unchanged).

The loader must select cohort defaults for the sections it already loads. Do not treat stored `NULL` as “no fees” when a default exists.

### Admin writes

**Cohort defaults** — new `updateAcademicCohortFeeDefaultsAction`:

- Admin only. Reject if the cohort is archived.
- Each field: empty → `NULL`; otherwise a finite number `>= 0`.
- Saving one field does not require the other.
- Audit: `academic_cohort_fee_defaults_updated`.
- Revalidate academic surfaces and the cohort page. Student/parent payment paths revalidate through the existing academic revalidate helper.

**Create section** — `createAcademicSectionAction` sets `enrollment_fee_amount: null` explicitly (do not rely on omit + leftover DEFAULT `0` on an unmigrated replica). No `section_fee_plans` insert.

**Section matrícula** — `setSectionEnrollmentFeeAmountAction` accepts `number | null`. Empty field in the editor saves `NULL` (inherit). `0` saves `0` (do not charge).

**Section cuota** — unchanged upsert/archive of `section_fee_plans`. Creating a plan is the override. Archiving the last plan that covers “now” returns the section to inherit.

**Copy sections** — keep today’s insert shape plus `enrollment_fee_amount: null`. Do not copy source fee plans or source matrícula.

### Admin UI

**Cohort overview** (`academic/[cohortId]` overview tab), below the student/section KPI grid:

- Block titled from i18n (defaults / matrícula / cuota).
- Two numeric inputs, optional. Empty is valid.
- Hint: sections without their own amount use these values; changing them updates those sections immediately.
- Save. Disabled when the cohort is archived (show stored values read-only).

Do not add these fields to `AcademicNewCohortModal`. After create, the admin lands on the cohort page and can fill the block there.

**Create section modal** — no fee fields.

**Section fees panel:**

- Summary tiles show **effective** amounts.
- When the stored matrícula is `NULL` and a cohort default exists, the enrollment editor and summary say the amount comes from the cohort default.
- Enrollment input: empty = inherit. Placeholder / helper text shows the cohort default when inheriting. `0` remains “this section does not charge”.
- When there is no fee plan and a cohort monthly default exists, the monthly summary tile shows that amount (same “from cohort default” wording). Adding a plan is the override.

Student, parent, and finance matrices never mention “default”. They only show the effective amount due.

### i18n

New keys under `dashboard.academicCohortPage` (defaults block) and `dashboard.academicSectionPage` (inherit hint on enrollment + monthly summary). Both `en` and `es`. No hardcoded user-facing strings.

## Error handling

| Case | Behaviour |
|------|-----------|
| Non-admin | Existing `assertAdmin` / RLS |
| Archived cohort, save defaults | `{ ok: false }` with a distinct code; UI uses the lifecycle-style error string |
| Invalid number (`< 0`, non-finite) | PARSE; do not write |
| Section save empty matrícula | `NULL` (inherit), not `0` |
| Cohort default cleared to empty | Stored `NULL`. Empty sections stop charging that concept (`0` / `no_plan`) |
| `class_pack` + cohort monthly default | Resolver still returns `class_pack_section` |

Changing a cohort default never UPDATEs `academic_sections` or `section_fee_plans`.

## Testing

Self-contained unit/component tests (no live DB except the existing migration SQL assertion pattern):

- Helper: section override wins (including `0`); `NULL` + default inherits; both empty → `0` / `no_plan`; `class_pack` ignores monthly default; virtual plan uses `USD`.
- `createAcademicSectionAction`: insert payload includes `enrollment_fee_amount: null` and does not insert a fee plan.
- `updateAcademicCohortFeeDefaultsAction`: save, clear to `NULL`, reject archived, reject negative.
- `setSectionEnrollmentFeeAmountAction`: accepts `null`.
- Enrollment editor: empty submit → `null`; `0` → `0`.
- Checklist facts: inherited default `> 0` counts as configured; stored `0` does not.
- Migration test: new columns nullable with CHECK; section column no longer `NOT NULL`; no `UPDATE academic_sections`.

Existing billing tests that assume `null` enrollment = `0` stay valid for **stored** `0` rows. Add cases where stored `NULL` + cohort default produces a positive due.

## Out of scope

- Default currency per cohort.
- Stamping or rewriting existing section rows when a default is saved.
- “Apply this default to all sections” / bulk overwrite.
- Fee fields on create-cohort or create-section.
- Copying source-section fees when duplicating into another cohort.
- Changing how `class_pack` prices work.
- Changing exemption, receipts, scholarships, or gateway reference encoding.
- SQL fallbacks inside `admin_cohort_collections_bulk` (resolution stays in TypeScript).

## Done when

1. Admin can set or clear matrícula and cuota defaults on a non-archived cohort overview. Archived: read-only.
2. A newly created section has `enrollment_fee_amount` `NULL` and no fee plan, and charges the cohort defaults (if set) on student/parent payments and admin cobranzas.
3. A section with stored matrícula `0` or `> 0` does not change when the cohort default changes. A section with a fee plan does not use `default_monthly_fee`.
4. Clearing a section matrícula field saves `NULL` and the effective amount follows the cohort again.
5. Existing sections (all stored `0` or an existing plan) keep current charges after migrate.
6. Tests above pass alone. No user-facing English/Spanish gaps.
)
