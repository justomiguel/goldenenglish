# Plan — Class-pack billing (project 1)

- **Spec:** `docs/superpowers/specs/2026-08-07-class-pack-billing-design.md`
- **ADR:** `docs/adr/2026-08-class-pack-billing.md`
- **Constraint from the user:** do **not** commit and do **not** push/apply the SQL. Migration files are
  written to disk only; applying them to any Supabase instance is the user's call.

Phases are ordered so each one is verifiable on its own. Phases 1–3 carry all the money rules and are where
the risk lives; 4–6 are surface.

**Status 2026-08-07:** phases 1 and 2 are done, plus the fail-loud guards of phase 3. `npx tsc --noEmit`,
`npx eslint` and `npx vitest run` (4400 tests) are green. Migrations exist as files and have **not** been
applied anywhere. Remaining: the rest of phase 3 (loaders, actions), and phases 4–6.

**Revised 2026-08-08:** migration 179 now reuses the shared `public.set_updated_at()` (001) instead of
defining a per-table copy, and its receipt/review columns follow `event_payments` (137) —
`receipt_storage_path`, `reviewed_by`, `review_notes`, `paid_at`, `mp_preference_id` — rather than the
misleading `receipt_url` / `admin_notes` pair from `payments`. `src/types/classPack.ts` and the spec match.

---

## Phase 1 — Migrations (files only, never applied) — DONE

- [x] `supabase/migrations/178_section_billing_mode.sql`
  - `academic_sections.billing_mode TEXT NOT NULL DEFAULT 'section_monthly_fee'` +
    `CHECK (billing_mode IN ('section_monthly_fee','class_pack'))`.
  - `COMMENT ON COLUMN` stating this column, not `site_settings`, is what the resolver reads (spec D1).
  - Seed `site_settings` key `billing_model` = `'section_monthly_fee'` and grant portal read following
    `150_billing_currency_portal_read.sql`.
  - Idempotent (`IF NOT EXISTS`, guarded `ADD CONSTRAINT`), additive only (rule 21).
- [x] `supabase/migrations/179_class_pack_prices_and_student_packs.sql`
  - `class_pack_prices` + partial unique `(effective_from_year, effective_from_month, class_count)
    WHERE archived_at IS NULL`.
  - `student_class_packs` + index `(student_id, year, month)`. **No** unique on that triple (spec D15).
  - `updated_at` triggers modelled on `section_fee_plans_set_updated_at`.
  - RLS: prices → SELECT `authenticated`, ALL admin; packs → SELECT admin/student/tutor via
    `tutor_student_rel`, INSERT/UPDATE admin plus `status = 'pending'` self-service mirroring
    `payments_insert_student_self` / `payments_update_student_self` (055 lines 151–180).
  - `COMMENT ON TABLE` / `COMMENT ON COLUMN` for the snapshot columns explaining why they are frozen.
- [x] `supabase/migrations/180_class_credit_ledger.sql`
  - `class_credit_consumptions` (`UNIQUE (attendance_id)`, FK cascade) + index `(student_id, year, month)`.
  - `class_recovery_credits` (`UNIQUE (origin_attendance_id)`, FK cascade) + same index.
  - `public.sync_class_credit_ledger()` `AFTER INSERT OR UPDATE ON section_attendance FOR EACH ROW`,
    `SECURITY DEFINER`, `SET search_path = public, pg_temp`; branches per spec §3.3; no DELETE branch
    (cascade covers it); never raises on billing state.
  - `REVOKE INSERT, UPDATE, DELETE` on both ledger tables from `authenticated`, `anon`; SELECT policies for
    admin / student / tutor / section teacher-assistant.
  - Comment warning that a future blanket `GRANT ALL ON ALL TABLES` (precedent: migration 166) would re-open
    ledger writes, and that the DB test in Phase 3 is what enforces it.

Also done in phase 1: migration assertion tests `src/__tests__/db/section_billing_mode_migration.test.ts`,
`class_pack_prices_and_student_packs_migration.test.ts`, `class_credit_ledger_migration.test.ts` (31 tests).

## Phase 2 — Domain layer, pure (`src/lib/billing/`), TDD — DONE

Tests written first in `src/__tests__/lib/billing/<name>.test.ts`, self-contained per rule 30 (42 tests).

- [x] `sectionBillingMode.ts` — `SECTION_BILLING_MODES`, `SectionBillingMode`,
      `parseSectionBillingMode(raw): SectionBillingMode | null`. **Strict** (spec D3). Plus
      `sectionIsClassPackBilled` for the call sites that only need the predicate.
- [x] `pickEffectiveForPeriod.ts` — generic effectivity-window selector on `periodIndex`.
- [x] Refactor `resolveEffectiveSectionFeePlan.ts` onto it + `REGRESSION CHECK` note in its existing test.
- [x] `resolveClassPackPrice.ts` — `{ code: "ok", amount, currency, priceId } | { code: "no_tier" }`;
      exact `class_count` match inside the effective window; archived rows excluded. Also exports
      `listClassPackTiersForPeriod` (same module: they share the private `effectiveTiers`).
- [x] `computeClassPackBalance.ts` — `{ granted, consumed, balance }`; only `approved`/`exempt` grant
      (D13); negative balance representable (D14).
- [x] `resolveClassPackPurchaseWindow.ts` — may this actor buy for `(year, month)` (D10: family = current or
      future; admin = any).
- [x] `src/types/classPack.ts` + `src/types/classCreditLedger.ts` — row types + mappers mirroring
      `src/types/sectionFeePlan.ts`.

## Phase 3 — Server layer and the fail-loud guards

- [x] `resolveSectionPlanMonthlyAmount.ts` — early `{ code: "class_pack_section" }` branch (A2); extend
      `SectionPlanAmountResult`. The section read moved to a new `loadSectionBillingContext` in
      `resolveSectionPlanMonthlyAmountSupport.ts` so it happens **before** the fee-plan lookup and the
      main file stays under the 250-line limit.
- [x] `validateStudentSectionMonthlySlot.ts`, `recordPaymentWithoutReceiptCore.ts` — both rewritten from
      `code === "no_plan" | "out_of_period"` checks to `if (plan.code !== "ok") return … plan.code`, so a
      future result code fails compilation instead of passing as billable. `resolveStudentPaymentSlot.ts`
      reason union widened (which also covers both gateway checkout starters).
- [x] `recordPaymentWithoutReceiptActionShared.ts` + `actionErrors.recordPaymentAdmin.classPackSection` in
      `en` / `es` / `pt`.
- [x] `buildStudentMonthlyPaymentsRow.ts` — new `sectionBillingMode` input; a class-pack section's fee plans
      are **not resolved**, so every cell is `no-plan` with no amount and `hasActivePlan` is false. The
      failure this prevents is switching an existing section to packs: its `section_fee_plans` rows survive
      and the grid would keep showing months as `due`. Matrícula is untouched (spec D12).
      Same guard on the derived section-level figures: `referenceMonthlyFee*` in
      `buildSectionCollectionsView.ts` and `sectionMonthlyFee*` in `loadAdminStudentBillingTabData.ts`.
- [x] `loadSectionBillingModes.ts` — bounded, **error-tolerant** read of `academic_sections.billing_mode`.
      Deliberately a separate query instead of another column on the existing joined selects: migration 178
      may not be applied on a given database, and a `42703` there would blank out the payments view. Any
      unrecognised response shape yields an empty map, which every caller reads as monthly billing.
- [x] Wired into the four row-producing paths: `loadStudentMonthlyPaymentsView.ts` (portal),
      `loadAdminSectionCollectionsView.ts` (section collections), `loadAdminStudentBillingTabData.ts` (admin
      student billing tab) and `loadAdminCohortCollectionsBulk.ts` → `buildCohortCollectionsMatrix.ts`. The
      cohort matrix receives the map through its options rather than the `admin_cohort_collections_bulk`
      payload, so the RPC does not need a new version.
- [ ] `loadBillingModelSetting.ts` — following `loadBillingCurrencySetting.ts` incl. safe fallback.
- [ ] `loadStudentClassPackMonth.ts` — bounded select (rule 13) of packs + consumptions + recovery credits.
- [ ] `loadAdminClassPackCollectionsView.ts` — paginated per-student month view (granted / consumed /
      balance / debt).
- [ ] `loadUnregisteredClassDaysReport.ts` — scheduled class days without an attendance row for class-pack
      sections, reusing `countSectionMonthlyClasses.ts` + `intersectDateRange` and excluding
      `academic_no_class_days`.
- [ ] Actions: `classPackPriceActions.ts` (admin CRUD, `recordSystemAudit`), `purchaseClassPackAction.ts`
      (family; amount recomputed server-side, Zod validated, never trusts client),
      `adminClassPackActions.ts` (manual create, receipt approve/reject, `exempt` with note). All with
      `[ge:server]` logging (rule 25) and `revalidatePath` (rule 27).
- [ ] **Behavioural trigger verification against a live database.** The migration assertion tests added in
      phase 1 only check the SQL text; they cannot prove the trigger runs. The repo's only live-Postgres
      harness is the Playwright e2e stack (`.env.local.e2e`, rule 34), so add there: `present` → one
      consumption; `present → excused` reverses it and accrues a recovery credit; `excused → present`
      reverses back; deleting the attendance row removes both; a monthly-fee section produces no ledger
      rows; attendance at zero balance still succeeds; `authenticated` INSERT on both ledger tables is
      denied. **Until this exists, the trigger is unverified.**

## Phase 4 — Gateways (third payable kind)

- [ ] `startFlowClassPackPaymentCore.ts` / `startMercadoPagoClassPackPaymentCore.ts` modelled on the tuition
      equivalents, amount recomputed from `class_pack_prices`.
- [ ] Reuse `payment_flow_checkout_refs` (migrations 114/159) for the deferred slot; new finalize-records
      table following `event_payment_*_finalize_records`. This needs one more migration — take the next free
      number at the time, **not** `181`: that one was claimed by `181_student_care_notes.sql` from unrelated
      work while this project was paused.
- [ ] Webhook/finalize path creates the `student_class_packs` row with `status = 'approved'` on confirmation
      (deferred creation, migration 159 behaviour).
- [ ] Bank transfer: receipt upload creates the row as `pending` (grants nothing until approved, D13).

**Known loose end from the guards above:** `enrollmentFeeCurrency` was derived from the effective fee plan's
currency, so on a class-pack section it now resolves to `null` while `enrollmentFeeAmount` stays > 0 (D12
keeps charging matrícula). The row builder is pure and has no other currency source. The fix belongs with the
UI work: feed it the institute's `billing_currency` setting (`loadBillingCurrencySetting.ts`) instead of
reading it off a monthly plan, which is the right source for a class-pack section anyway.

## Phase 5 — Admin UI

- [ ] Site settings: `billing_model` selector with an explanation of what it changes.
- [ ] Section configuration: billing-mode control next to `AcademicSectionMonthlyFeeChargeModeEditor.tsx`.
- [ ] `AcademicSectionFeesPanel.tsx` — read-only with an explanation when the section is in class-pack mode.
- [ ] Finance hub: "Paquetes de clases" area — catalog editor (tier rows, add/archive), per-student month
      view, unregistered-class-days report. Split per file so nothing exceeds 250 lines (rule 03).

## Phase 6 — Portal UI (student + parent, both surfaces) and copy

- [ ] Tier picker, balance widget, consumption list, accrued recoverable-classes counter (read-only).
- [ ] Top-up shows the larger tier's price alongside (D15).
- [ ] Desktop + PWA trees per `05-pwa-mobile-native.mdc`.
- [ ] `en.json` / `es.json` / `pt.json` keys, identical shape (rule 09). `Dictionary` derives from `en.json`,
      so a missing key fails the build.
- [ ] RTL tests for picker, balance widget, catalog editor, disabled fees panel.

## Closing gates

- [ ] `npm run lint`
- [ ] `npx tsc --noEmit`
- [ ] `npm run test` and the coverage gate (≥90% on `src/lib/**`, `src/hooks/**`)
- [ ] Do **not** commit; do **not** run `supabase db push` or otherwise apply migrations.
