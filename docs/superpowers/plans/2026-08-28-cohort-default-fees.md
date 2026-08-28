# Cohort Default Fees Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (this session: inline). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admins set live matrícula and cuota defaults on a cohort; sections with no own value inherit them on every charge path.

**Architecture:** Store nullable defaults on `academic_cohorts`. Make `academic_sections.enrollment_fee_amount` nullable (`NULL` = inherit, `0` = do not charge). Resolve amounts in one pure helper used by billing, admin UI, and the first-class checklist. Do not rewrite section rows when a default changes.

**Tech Stack:** Next.js App Router, Supabase Postgres, Zod server actions, Vitest, i18n dictionaries (`en` / `es` / `pt`).

## Global Constraints

- `03-architecture.mdc` — 250-line ceiling on new/edited files; split if needed.
- `09-i18n-copy.mdc` — no hardcoded user-facing strings; keys in `en.json`, `es.json`, and `pt.json`.
- `12-supabase-app-boundaries.mdc` — app uses the user-scoped client; no service-role in these actions.
- `21-migrations-production-no-data-destruction.mdc` — additive only; no `UPDATE academic_sections`.
- `30-harness-self-contained-tests.mdc` — tests pass alone.
- Next migration number is **194** (`193_registration_section_options_hide_full.sql` already exists).
- Spec: `docs/superpowers/specs/2026-08-28-cohort-default-fees-design.md`.

## File map

**Create**

- `supabase/migrations/194_cohort_default_fees.sql`
- `src/lib/billing/resolveCohortFeeDefaults.ts`
- `src/lib/billing/resolveCohortFeeDefaults.types.ts`
- `src/app/[locale]/dashboard/admin/academic/cohortFeeDefaultsActions.ts`
- `src/components/organisms/AcademicCohortFeeDefaultsEditor.tsx`
- `src/__tests__/lib/billing/resolveCohortFeeDefaults.test.ts`
- `src/__tests__/db/cohort_default_fees_migration.test.ts`
- `src/__tests__/app/cohortFeeDefaultsActions.test.ts`
- `src/__tests__/components/AcademicCohortFeeDefaultsEditor.test.tsx`

**Modify**

- `createAcademicSectionAction` — insert `enrollment_fee_amount: null`
- `copyCohortSectionStructureAction` — same
- `setSectionEnrollmentFeeAmountAction` — accept `null`
- `loadSectionBillingContext` — also load `cohort_id` + cohort defaults
- `resolveSectionPlanMonthlyAmount` — virtual plan when no section plan
- `loadStudentMonthlyPaymentsView` — resolve enrollment via helper; select cohort defaults
- `buildCohortCollectionsMatrix` — resolve enrollment via helper using cohort defaults on `raw.cohort`
- `loadAdminStudentBillingTabData` + mappers — select/resolve cohort defaults
- `loadAdminSectionPageData` + types — stored + effective + defaults
- `deriveAdminFirstClassChecklistFacts` + loader — inherited `> 0` counts as fees
- `AcademicSectionEnrollmentFeeEditor` — empty = inherit
- `AcademicSectionFeesSummary` / `AcademicSectionFeesPanel` — show effective + inherit hint
- Cohort overview page — mount editor
- Dictionaries `en` / `es` / `pt`
- Existing tests that assert create-section insert payload and enrollment editor empty submit

---

### Task 1: Pure resolution helper

**Files:**
- Create: `src/lib/billing/resolveCohortFeeDefaults.types.ts`
- Create: `src/lib/billing/resolveCohortFeeDefaults.ts`
- Test: `src/__tests__/lib/billing/resolveCohortFeeDefaults.test.ts`

**Interfaces:**
- Produces:
  - `parseOptionalFeeAmount(raw: unknown): number | null`
  - `resolveEffectiveEnrollmentFeeAmount(sectionAmount: number | null, cohortDefault: number | null): number`
  - `resolveEffectiveMonthlyFee(input: { billingMode: string | null | undefined; sectionPlan: { monthlyFee: number; currency: string } | null; cohortDefaultMonthlyFee: number | null }): { kind: "class_pack" } | { kind: "section"; monthlyFee: number; currency: string } | { kind: "cohort"; monthlyFee: number; currency: string } | { kind: "none" }`

- [x] **Step 1–4:** TDD helper (this session).
- [ ] **Step 5:** Commit with other green units when the slice is reviewable.

### Task 2: Migration 194

**Files:**
- Create: `supabase/migrations/194_cohort_default_fees.sql`
- Test: `src/__tests__/db/cohort_default_fees_migration.test.ts`

- [ ] Add nullable cohort defaults + CHECK; drop NOT NULL / change DEFAULT on section enrollment; no UPDATE of existing rows.

### Task 3: Create / copy section + enrollment action

**Files:**
- Modify: `src/app/[locale]/dashboard/admin/academic/sectionActions.ts`
- Modify: `src/app/[locale]/dashboard/admin/academic/copyCohortSectionsActions.ts`
- Modify: `src/app/[locale]/dashboard/admin/academic/sectionEnrollmentFeeActions.ts`
- Test: existing action tests

- [ ] Insert `enrollment_fee_amount: null` on create and copy.
- [ ] Accept `null` on set enrollment (empty field inherits).

### Task 4: Billing readers

**Files:**
- Modify: `resolveSectionPlanMonthlyAmount` + `loadSectionBillingContext`
- Modify: `loadStudentMonthlyPaymentsView`
- Modify: `buildCohortCollectionsMatrix` + cohort type if needed
- Modify: `loadAdminStudentBillingTabData` + mappers
- Modify: `loadAdminSectionPageData` + types
- Modify: checklist derive + loader
- Tests for helper call sites / facts

- [ ] Every charge path uses the helper. No raw `null → 0` without cohort default.

### Task 5: Admin UI + i18n

**Files:**
- Create: `cohortFeeDefaultsActions.ts` + `AcademicCohortFeeDefaultsEditor.tsx`
- Modify: cohort overview page
- Modify: enrollment editor, fees summary/panel
- Modify: `en.json` / `es.json` / `pt.json`

- [ ] Overview block below KPIs. Archived = read-only.
- [ ] Section editor: empty inherits; `0` does not charge; hint shows cohort default.
- [ ] Summary tiles show effective amounts + inherit wording.

### Task 6: Verify

- [ ] Targeted vitest for new/changed files.
- [ ] Browser: cohort overview save defaults, create section, confirm payments/cobranzas inherit; override section; existing `0` stays.

---

## Spec coverage

| Spec | Task |
|------|------|
| Cohort columns + nullable section amount, no backfill | 2 |
| Live fallback helper, `0` vs `NULL`, class_pack, USD virtual plan | 1, 4 |
| Create/copy insert NULL, no fee plan | 3 |
| Enrollment action accepts null | 3 |
| Readers + checklist | 4 |
| Overview editor, no create-modal fields | 5 |
| i18n en/es/pt | 5 |
)
