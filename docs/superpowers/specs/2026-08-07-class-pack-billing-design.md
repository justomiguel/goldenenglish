# Class-pack billing — non-linear price per number of classes, monthly credit bag

- **Date:** 2026-08-07
- **Status:** approved 2026-08-07 (user: "hazlo, pero recuerda no commitear ni intentar pushear el sql. toma todas las decisiones e implementa las specs")
- **Plans:** `docs/superpowers/plans/2026-08-07-class-pack-billing.md`
- **ADR:** `docs/adr/2026-08-class-pack-billing.md` (required by `10-engineering-governance.mdc`: new data model, new RLS, new payable product)
- **Scope:** a second tuition product alongside the fixed monthly section fee. An institute (or an individual
  section) can charge **per class**, where the price of a pack of N classes is an arbitrary table value, not
  N × unit price. Credits are consumed by attendance. Excused absences accumulate as recoverable classes.
- **Out of this spec (project 2):** booking and spending those recoverable classes.

---

## 1. Understanding

### 1.1 Today the price belongs to the section, and so does the class count

`section_fee_plans` (migration 055, simplified in 057) holds exactly one `monthly_fee` per section per
effectivity window `(effective_from_year, effective_from_month)`. The plan in force for a period is the one
with the highest `effective_from` that is `<= (year, month)` — `resolveEffectiveSectionFeePlan.ts`.

The number of classes is also a property of the section: `academic_sections.schedule_slots` (JSONB, migration
017) lists weekday slots, and `countSectionMonthlyClasses.ts` counts their calendar occurrences. Every student
in a section takes the same classes and pays the same fee.

What looks like per-class billing today is not. `academic_sections.monthly_fee_charge_mode` (migration 113)
switches between `'prorate_by_classes'` and `'full_month_fee'`, and the prorate branch computes

```
amount = monthly_fee × availableClassesForStudent / totalClassesInMonth
```

(`prorateMonthlyFee.ts`). That is strictly **linear**, and it exists to handle a student joining mid-month —
not a student choosing to take fewer classes. Migration 154 made `'full_month_fee'` the product default.

**There is no per-student class count anywhere in the schema.** That is the actual gap, not the price table.

### 1.2 The attendance model already encodes the consumption rule exactly

```11:21:supabase/migrations/021_section_attendance_grades_retention.sql
CREATE TABLE IF NOT EXISTS public.section_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.section_enrollments (id) ON DELETE CASCADE,
  attended_on DATE NOT NULL,
  status public.section_attendance_status NOT NULL DEFAULT 'present',
  notes TEXT,
  recorded_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT section_attendance_enrollment_day_uidx UNIQUE (enrollment_id, attended_on)
);
```

The enum is `'present' | 'absent' | 'late' | 'excused'` (`src/types/sectionAcademics.ts`). The requested rule —
*present, late and absent consume a class; excused does not and becomes recoverable* — is therefore a single
predicate over an existing column, and `UNIQUE (enrollment_id, attended_on)` gives every consumption a natural
idempotency key. No new academic concept is needed.

Attendance is **editable and deletable**, which is the constraint that shapes the whole ledger design (§2 D6).

### 1.3 `payments` cannot host a per-student, cross-section charge

`payments` carries two partial unique indexes (migration 055):

```140:146:supabase/migrations/055_section_fee_plans.sql
CREATE UNIQUE INDEX IF NOT EXISTS payments_student_section_period_uidx
  ON public.payments (student_id, section_id, month, year)
  WHERE section_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS payments_student_legacy_period_uidx
  ON public.payments (student_id, month, year)
  WHERE section_id IS NULL;
```

A class-pack charge belongs to the student, not to a section, so it would land in the second index — which
allows exactly one row per student per month and is reserved for legacy pre-055 receipts. `payment_kind` is
still `CHECK (payment_kind IN ('monthly','enrollment'))` (migration 009) and is **not** part of either index,
so it cannot disambiguate. On top of that, `payments` is consumed by the 12-month-per-section grid
(`buildStudentMonthlyPaymentsRow.ts`), the admin collections matrix, `validateStudentSectionMonthlySlot.ts`
and both gateway flows; inserting section-less rows would require auditing every one of them.

`event_payments` (migration 137) is the precedent for the opposite choice: a parallel payable product with its
own charge table, its own gateway finalize-records tables and its own admin panel, leaving `payments`
untouched.

### 1.4 Overloading `monthly_fee_charge_mode` would misbill silently

```5:9:src/lib/billing/monthlyFeeChargeMode.ts
export function parseMonthlyFeeChargeMode(raw: unknown): MonthlyFeeChargeMode {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (s === "full_month_fee") return "full_month_fee";
  return "prorate_by_classes";
}
```

The parser is permissive by design: any unrecognised value falls through to `'prorate_by_classes'`. Adding a
`'class_pack'` value there means every code path that has not yet learned the new mode would compute and
charge a prorated monthly fee instead of failing. That is the worst available failure mode, because it moves
money without an error.

### 1.5 Recovering a class in another section does not fit `section_attendance`

`section_attendance.enrollment_id` references `section_enrollments`, so attendance can only be recorded for a
student who is enrolled in that section. Recovering a class explicitly means attending a **different** section
("en otra sección o con otros profes"), and fake enrollments are not an option because the enrollment commit
RPC (`academic_admin_section_enroll_commit`, migration 017) rejects schedule overlaps.

There is no makeup/recovery concept anywhere in `src/**` today (verified). This is why booking recoveries is
deferred to project 2: it needs its own attendance-like table, capacity rules, and a decision about whether a
recovered class repairs the academic attendance percentage. Project 1 only **accrues and displays** the debt.

## 2. Decisions and assumptions

All product decisions were delegated to the agent ("toma todas las decisiones"). D1–D8 were agreed in the
design conversation; D9–D16 are the delegated ones.

| # | Decision | Rationale |
|---|---|---|
| D1 | Billing mode is chosen by the institute via `site_settings.billing_model`, but the **enforcement point is a new `academic_sections.billing_mode` column**. The amount resolver reads the section, never the global setting. | Mirrors migration 154, which expressed a product default as a column default plus backfill while the column stayed the runtime source of truth. Lets an institute migrate section by section, keeps historical sections billing as before, and keeps tests free of a global stub. |
| D2 | Fixed-fee and class-pack sections **may coexist** in one institute. | User's explicit choice. Falls out of D1 at no extra cost. |
| D3 | A **new** column and a **strict** parser, not a third `monthly_fee_charge_mode` value. `parseSectionBillingMode` returns `null` for unknown input and callers surface a typed error. | §1.4: the existing parser's permissive default would silently charge a prorated monthly fee for a class-pack section. |
| D4 | Prices live in a **site-level** catalog `class_pack_prices` with rows `(class_count, amount, currency)` plus an effectivity window. `amount` is the **total** price of the pack. No formula, no interpolation: a requested `class_count` with no row is a typed error. | The bag is per student and crosses sections, so a per-section price table cannot price it (a student in two sections with different fees would have no single price). "Total, not unit" is what makes the table non-linear by construction, which is the whole requirement. |
| D5 | The bag is `student_class_packs`: **strictly monthly**, and it is also the charge (own status, receipt and gateway columns), modelled on `event_payments`. | §1.3. Keeps `payments`, the monthly grid and both tuition gateway flows untouched — money code is where a bug costs cash. |
| D6 | Consumption is a **ledger derived from attendance**: `class_credit_consumptions`, one row per consuming attendance, `UNIQUE (attendance_id)`, `FK … ON DELETE CASCADE`. Never a counter on the bag. | Attendance is editable (§1.2). A counter descuadra on the first correction and cannot be audited; a ledger keyed by the attendance row makes correction idempotent and deletion self-reversing. |
| D7 | The ledger is maintained by a **Postgres trigger** on `section_attendance`, not by application code, and the ledger tables are **not writable** by `authenticated`. | Attendance has several write paths (matrix save, single-cell actions, RPC); the first one not instrumented would break billing silently. A trigger plus no direct write grants makes that impossible by construction. |
| D8 | Excused attendance produces a `class_recovery_credits` row. In project 1 these only **accrue and display**. | §1.5; booking is a separate subsystem. |
| D9 | **Who buys, and when:** the family/student buys from the portal by picking a catalog tier; an admin can also create a pack manually (cash, reconciliation) and can mark one `exempt`. | Symmetric with `payments`, where both the family (receipt, gateway) and staff (manual, exempt) can act. No new authorization concept. |
| D10 | **Advance purchase:** current and future months are allowed; past months only for an admin. Enforced in validation, with **no new column**. | `allow_advance_monthly_payment` is per section and cannot govern a per-student bag; a second flag for a rule nobody asked to configure is YAGNI. Past-month purchases are reconciliation, which is staff work by definition. |
| D11 | **Discounts on a pack are out of scope**, except `status = 'exempt'` (fully waived by an admin, with a note). | The catalog's non-linearity *is* the volume discount. `section_enrollment_scholarships` is keyed by section enrollment and cannot express a cross-section bag, and `exempt` already exists in `payment_status`, so the 100% case costs no new code. Percentage discounts would need a student-level mechanism — deferred to §7. |
| D12 | **Enrollment fee is unchanged**: class-pack sections keep charging `academic_sections.enrollment_fee_amount` through the existing flow. | Matrícula is a one-time per-section charge, orthogonal to how monthly classes are priced. Touching it would expand the blast radius for no requirement. |
| D13 | **Only `approved` and `exempt` packs grant credits.** A `pending` pack (transfer under review) grants nothing. | Credits are prepaid value; granting them before the money is confirmed converts a review queue into free classes. |
| D14 | **The trigger never blocks attendance, and the balance may go negative.** A class attended without credit is still recorded and shows up as a class debt for staff to resolve (by selling a top-up). | A teacher taking attendance must never get a billing error; the register is the academic record of what happened. Negative balance is therefore a consequence of D7, not a pricing choice, and it composes with D15. |
| D15 | **Several packs per month are allowed** (top-up); the month's balance is the sum of granted credits from `approved`/`exempt` packs minus consumptions. No unique index on `(student_id, year, month)`. | User's explicit choice. Each purchase is priced by its own size, so 4 + 2 legitimately costs more than 6 in one go; the portal shows the larger tier's price when topping up so the family can choose knowingly. |
| D16 | Switching a section to class-pack mode does **not** backfill consumption history: the trigger only writes for attendance on sections already in class-pack mode. | Backfilling would invent charges for months already settled under a monthly fee. |
| A1 | All migrations are additive; existing sections and settings default to the current behaviour. Nothing is dropped, truncated or mass-deleted. | `21-migrations-production-no-data-destruction.mdc`. |
| A2 | `resolveSectionPlanMonthlyAmount` gains an early branch returning a new `{ code: "class_pack_section" }` for class-pack sections. | Fail-loud: no code path may accidentally produce a monthly amount for a section that is not billed monthly. |
| A3 | The effectivity-window comparison is extracted to a shared pure helper reused by `resolveEffectiveSectionFeePlan` and the new price resolver, under a `REGRESSION CHECK`. | Two copies of a money-selection rule drift. `periodIndex` is already shared, so the extraction is small and mechanical. |

Open questions: none blocking.

## 3. Proposed plan

Migration numbering continues from `177`. Three migrations, split so each is independently reviewable.

### 3.1 Migration 178 — billing mode (section column + site setting)

```sql
ALTER TABLE public.academic_sections
  ADD COLUMN IF NOT EXISTS billing_mode TEXT NOT NULL DEFAULT 'section_monthly_fee';

ALTER TABLE public.academic_sections
  ADD CONSTRAINT academic_sections_billing_mode_check
  CHECK (billing_mode IN ('section_monthly_fee', 'class_pack'));
```

`COMMENT ON COLUMN` per repo convention, stating that this column — not `site_settings` — is what the amount
resolver reads (D1).

The `billing_model` key is seeded into `site_settings` with value `'section_monthly_fee'` and made readable by
portal users following the grant/policy pattern of `150_billing_currency_portal_read.sql`. The portal needs it
to decide which billing screen to render.

### 3.2 Migration 179 — price catalog and the monthly bag

```sql
CREATE TABLE IF NOT EXISTS public.class_pack_prices (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  effective_from_year   SMALLINT NOT NULL CHECK (effective_from_year BETWEEN 2000 AND 2100),
  effective_from_month  SMALLINT NOT NULL CHECK (effective_from_month BETWEEN 1 AND 12),
  class_count           SMALLINT NOT NULL CHECK (class_count > 0 AND class_count <= 60),
  amount                NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency              TEXT NOT NULL,
  archived_at           TIMESTAMPTZ,
  archived_by           UUID NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by            UUID NULL REFERENCES auth.users (id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS class_pack_prices_period_count_uidx
  ON public.class_pack_prices (effective_from_year, effective_from_month, class_count)
  WHERE archived_at IS NULL;
```

Archive-not-delete mirrors `section_fee_plans` (migration 056) so historical purchases keep pointing at the
row that priced them.

```sql
CREATE TABLE IF NOT EXISTS public.student_class_packs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  year              SMALLINT NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  month             SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  class_count       SMALLINT NOT NULL CHECK (class_count > 0),
  amount            NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency          TEXT NOT NULL,
  price_id          UUID NULL REFERENCES public.class_pack_prices (id) ON DELETE SET NULL,
  status                public.payment_status NOT NULL DEFAULT 'pending',
  purchased_by          UUID NULL REFERENCES public.profiles (id) ON DELETE SET NULL,
  receipt_storage_path  TEXT,
  reviewed_by           UUID NULL REFERENCES public.profiles (id) ON DELETE SET NULL,
  review_notes          TEXT,
  paid_at               TIMESTAMPTZ,
  gateway_provider      TEXT NULL CHECK (gateway_provider IN ('flow', 'mercadopago')),
  mp_preference_id      TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS student_class_packs_student_period_idx
  ON public.student_class_packs (student_id, year, month);
```

`class_count`, `amount` and `currency` are a **snapshot** taken at purchase time (same reasoning as
`student_promotions`): a later catalog edit must not restate a settled purchase. `price_id` is traceability
only, hence `ON DELETE SET NULL`. **No unique index on `(student_id, year, month)`** — that is D15.

The receipt / review / gateway columns are named after `event_payments` (migration 137), not after `payments`.
In `payments` the column is `receipt_url` but it actually stores a Storage **path**, and the review note lives in
`admin_notes`; there is no reason to carry that misleading pair into a new table. `mp_preference_id` and
`paid_at` are present for the same reason `event_payments` has them: the MercadoPago start needs somewhere to
park the preference, and the finance UI needs the settlement instant rather than the row's `created_at`.
`updated_at` is maintained by the shared `public.set_updated_at()` trigger function from migration 001, which
is what every other table in the schema uses.

RLS:

- `class_pack_prices` — SELECT for `authenticated` (families need prices to buy; the pattern is
  `150_billing_currency_portal_read.sql`); ALL for admin only.
- `student_class_packs` — SELECT for admin, the student, and the student's tutors via `tutor_student_rel`;
  INSERT/UPDATE for admin, plus a self-service policy restricted to `status = 'pending'` for the student and
  their tutors, mirroring `payments_insert_student_self` / `payments_update_student_self` (migration 055,
  lines 151–180).

`updated_at` triggers follow `section_fee_plans_set_updated_at`.

### 3.3 Migration 180 — consumption ledger, recovery credits, and the trigger

```sql
CREATE TABLE IF NOT EXISTS public.class_credit_consumptions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id  UUID NOT NULL UNIQUE
                   REFERENCES public.section_attendance (id) ON DELETE CASCADE,
  student_id     UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  enrollment_id  UUID NOT NULL REFERENCES public.section_enrollments (id) ON DELETE CASCADE,
  section_id     UUID NOT NULL REFERENCES public.academic_sections (id) ON DELETE CASCADE,
  attended_on    DATE NOT NULL,
  year           SMALLINT NOT NULL,
  month          SMALLINT NOT NULL,
  credits        SMALLINT NOT NULL DEFAULT 1 CHECK (credits > 0),
  source_status  public.section_attendance_status NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS class_credit_consumptions_student_period_idx
  ON public.class_credit_consumptions (student_id, year, month);
```

`class_recovery_credits` has the same shape keyed on `origin_attendance_id UUID NOT NULL UNIQUE REFERENCES
public.section_attendance (id) ON DELETE CASCADE`, plus `origin_enrollment_id`, `origin_section_id`,
`origin_attended_on`, `year`, `month`, `created_at`. It deliberately carries **no** consumption columns yet;
project 2 adds them.

`year` / `month` are denormalized from `attended_on` by the trigger so the monthly balance is a single indexed
read with no date arithmetic in the query path.

**Trigger.** `public.sync_class_credit_ledger()`, `AFTER INSERT OR UPDATE ON public.section_attendance
FOR EACH ROW`, `SECURITY DEFINER` with `SET search_path = public, pg_temp` per repo convention:

1. Resolve `enrollment_id → section_enrollments → academic_sections`. If `billing_mode <> 'class_pack'`,
   return without writing anything (D16).
2. `status IN ('present','late','absent')` → upsert the consumption `ON CONFLICT (attendance_id) DO UPDATE`
   refreshing `source_status`, and delete any recovery credit for that attendance.
3. `status = 'excused'` → delete any consumption for that attendance, and insert the recovery credit
   `ON CONFLICT (origin_attendance_id) DO NOTHING`.
4. Never raise on balance or billing state (D14).

There is no `DELETE` branch: both FKs are `ON DELETE CASCADE`, so removing an attendance row reverses its
ledger effect automatically. `FOR EACH ROW` is correct even for bulk matrix saves — the work per row is two
indexed single-row statements.

Two existing paths delete attendance in bulk and therefore return credits, which is the intended reading and
not an accident:

- **Column undo** (`runTeacherAttendanceColumnUndo`, `runAdminAttendanceColumnUndo`) deletes a whole day's
  column. The day is being declared un-taken, so the classes it consumed must come back.
- **Un-enrolling a student** cascades `section_enrollments` → `section_attendance` → the ledger. The student's
  attendance in that section no longer exists as a record, so it cannot keep consuming their bag; the classes
  return to the month's balance. If the institute wants to charge for a section a student was removed from,
  that is a refund decision at the pack level, not something the ledger should fabricate.

No INSERT/UPDATE/DELETE policies are created for `authenticated` on either ledger table, and table-level write
grants are revoked from `authenticated` and `anon`; only the `SECURITY DEFINER` trigger writes them. RLS is the
durable protection — migration 166 left `ALTER DEFAULT PRIVILEGES … GRANT ALL ON TABLES`, so a future blanket
grant would undo the `REVOKE` but not the absence of write policies. The DB test asserts it either way.

SELECT is granted to **admin and the student's family only** (a new `public.user_is_family_of_student` helper,
`SECURITY DEFINER` like the migration 177 helpers to avoid re-entering `tutor_student_rel` RLS from another
table's policy). Teachers are deliberately excluded: a credit balance is billing information, and teachers
already see the attendance that produced it. Narrower than `section_fee_plans_select_scope`, and it also avoids
the `academic_sections` ↔ `section_enrollments` policy cycle that migration 177 had to fix.

### 3.4 Domain layer — pure helpers (`src/lib/billing/`)

- `sectionBillingMode.ts` — `SECTION_BILLING_MODES`, `SectionBillingMode`,
  `parseSectionBillingMode(raw): SectionBillingMode | null` (**strict**, D3).
- `billingModelSetting.ts` + `loadBillingModelSetting.ts` — the site-level setting, following
  `loadBillingCurrencySetting.ts` including its safe fallback.
- `pickEffectiveForPeriod.ts` — extracted shared effectivity-window selector (A3), reused by
  `resolveEffectiveSectionFeePlan.ts` (refactor + `REGRESSION CHECK`) and by the new price resolver.
- `resolveClassPackPrice.ts` — `(prices, classCount, year, month)` → `{ code: "ok", amount, currency, priceId }`
  | `{ code: "no_tier" }`. Exact `class_count` match inside the effective window; no interpolation (D4).
- `listClassPackTiersForPeriod.ts` — the tiers offered to the family for a period, sorted by `class_count`.
- `computeClassPackBalance.ts` — pure: `{ granted, consumed, balance }` from granting packs (`approved` /
  `exempt` only, D13) and consumption rows. Negative balances are representable (D14).
- `resolveClassPackPurchaseWindow.ts` — pure: may this actor buy for `(year, month)`? (D10).

### 3.5 Server layer

- `resolveSectionPlanMonthlyAmount.ts` — early branch returning `{ code: "class_pack_section" }` (A2);
  `SectionPlanAmountResult` gains that member.
- `buildStudentMonthlyPaymentsRow.ts` / `loadAdminSectionCollectionsView.ts` — skip class-pack sections
  instead of rendering due cells for them.
- `validateStudentSectionMonthlySlot.ts` — reject class-pack sections with a typed code.
- `loadStudentClassPackMonth.ts` — bounded select of the month's packs plus consumptions plus recovery
  credits, for the portal and the admin ficha.
- `loadAdminClassPackCollectionsView.ts` — per-student month view for staff (granted, consumed, balance,
  debt), paginated per `13-postgrest-pagination-bounded-queries.mdc`.
- `loadUnregisteredClassDaysReport.ts` — for class-pack sections, the scheduled class days
  (`schedule_slots` + `countSectionMonthlyClasses.ts`, intersected with `starts_on`/`ends_on` and excluding
  `academic_no_class_days`) that have **no** attendance rows. This is the integrity control for the money
  (§4).
- Actions: `classPackPriceActions.ts` (admin catalog CRUD, audited via `recordSystemAudit`),
  `purchaseClassPackAction.ts` (family; server recomputes the amount from the catalog and never trusts the
  client), `adminClassPackActions.ts` (manual create, approve/reject receipt, mark `exempt` with a note).
- Gateways: a third payable kind reusing `payment_gateway_credentials`, the `payment_flow_checkout_refs`
  indirection (migrations 114/159) and the existing webhook entry points, with its own finalize-records table
  following the `event_payment_*_finalize_records` pattern. Rows stay **deferred** — the pack row materializes
  on gateway confirmation or on receipt upload (migration 159 behaviour).

### 3.6 UI

- Admin settings: `billing_model` selector with an explanation of what changes.
- Section configuration: a billing-mode control next to `AcademicSectionMonthlyFeeChargeModeEditor`;
  `AcademicSectionFeesPanel` becomes read-only with an explanation when the section is in class-pack mode, so
  it cannot display an editable monthly fee that nothing charges.
- Finance hub: a "Paquetes de clases" area with the price catalog editor (tier rows with add/archive), the
  per-student month view, and the unregistered-class-days report.
- Portal (student + parent, both surfaces per `05-pwa-mobile-native.mdc`): tier picker with prices, balance
  widget, consumption list, and the accrued recoverable-classes counter (read-only, D8). When topping up, the
  price of the larger tier is shown alongside (D15).
- All copy through `en.json` / `es.json` / `pt.json` per `09-i18n-copy.mdc`; no literals.

### 3.7 Tests (TDD, self-contained per rule 30)

- Pure units: `parseSectionBillingMode` (unknown → `null`), `resolveClassPackPrice` (effective window wins,
  missing tier → `no_tier`, archived rows ignored), `computeClassPackBalance` (pending pack grants nothing;
  several packs sum; negative balance), `resolveClassPackPurchaseWindow` (past month denied for family,
  allowed for admin), `pickEffectiveForPeriod`.
- `REGRESSION CHECK` in `resolveEffectiveSectionFeePlan.test.ts` for the A3 extraction, and in the monthly
  grid tests for the class-pack skip.
- Boundary-mocked: `resolveSectionPlanMonthlyAmount` returns `class_pack_section`;
  `validateStudentSectionMonthlySlot` rejects; `purchaseClassPackAction` recomputes the amount and rejects a
  tampered client amount; gateway context never trusts the client.
- Migration assertions under `src/__tests__/db/` following the repo's existing convention (those tests read
  the `.sql` file and assert on its text; they do **not** open a connection). One file per migration,
  pinning the properties whose loss would be silent: `UNIQUE (attendance_id)` and `ON DELETE CASCADE` on
  both ledger tables, `AFTER INSERT OR UPDATE … FOR EACH ROW`, `SECURITY DEFINER` + pinned `search_path`,
  the exact consuming status list, the early return for non-class-pack sections, the absence of any
  `RAISE EXCEPTION`, the absence of write policies plus the `REVOKE`, no unique index on
  `(student_id, year, month)`, and the full key list of the recreated `site_settings_select_public` policy.
- **Honest limit of the above:** a text assertion proves the SQL says the right thing, not that the trigger
  behaves. The behavioural cases — `present` creates one consumption, `present → excused` reverses it and
  accrues a recovery credit, `excused → present` reverses back, deleting the attendance row removes both, a
  monthly-fee section produces no rows, attendance at zero balance still succeeds, and `authenticated`
  cannot INSERT into either ledger table — need a live database. The repo's only live-Postgres harness is
  the Playwright e2e stack (`.env.local.e2e`, rule 34), so these belong there and are listed as a required
  task in the plan, not as something the unit suite covers.
- RTL: tier picker, balance widget, catalog editor, disabled fees panel.

## 4. Risks and mitigation

| Risk | Mitigation |
|---|---|
| A class is taught but nobody takes attendance, so nothing is consumed and the student rides free | `loadUnregisteredClassDaysReport` (§3.5) surfaces scheduled class days without a register for class-pack sections; it is part of project 1 precisely because it is the money's integrity control, not a nice-to-have |
| A teacher edits attendance weeks later and the balance descuadra | Ledger keyed `UNIQUE (attendance_id)` with cascade delete (D6); upsert on update; covered by the DB tests in §3.7 |
| An attendance write path is added later without touching billing | The trigger owns the ledger (D7) and `authenticated` has no write grant on the ledger tables, so a new app path cannot bypass it |
| Billing failure blocks a teacher from taking attendance | The trigger never raises on billing state (D14); the DB test suite includes attendance for a student with zero balance |
| Old code charges a prorated monthly fee for a class-pack section | New column plus strict parser (D3) and the `class_pack_section` result (A2), with tests asserting the resolver refuses |
| Client tampers with the pack price | Amount is recomputed server-side from `class_pack_prices` in the action and in the gateway context; test asserts rejection |
| Credits granted before money is confirmed | Only `approved` / `exempt` grant (D13), asserted in `computeClassPackBalance` tests |
| Catalog edit restates settled purchases | `class_count` / `amount` / `currency` snapshotted on the pack; catalog rows archived, never deleted |
| Family surprised that 4 + 2 costs more than 6 | Portal shows the larger tier's price when topping up (D15) |
| Switching a section's mode invents or erases charges | Trigger writes only for sections already in class-pack mode (D16); no backfill; existing sections default to `section_monthly_fee` (A1) |
| Recovery debt accrues with no way to spend it | Explicitly scoped: project 1 accrues and displays; project 2 (§7) books it. The counter being visible is what keeps it honest |
| 250-line file limit (`03-architecture.mdc`) | Each concern is its own module in §3.4/§3.5; UI split per surface |

## 5. Definition of done

- [ ] An institute can choose per-class billing, and an individual section can be in the other mode without
      affecting the rest.
- [ ] An admin defines a price table where 1, 2, 4, 8 … classes each have an arbitrary total price, with
      effectivity windows, and archives a tier without breaking past purchases.
- [ ] A family buys a pack for the current or a future month from the portal; the server prices it from the
      catalog and a tampered amount is rejected.
- [ ] Attendance marked present, late or absent consumes exactly one credit; excused consumes none and adds
      one recoverable class.
- [ ] Correcting an attendance record returns or re-consumes the credit; deleting it reverses the ledger.
- [ ] Taking attendance never fails because of billing state, including at zero balance.
- [ ] A student and their tutor see the month's granted, consumed and remaining classes, plus the accrued
      recoverable classes.
- [ ] Staff see, per section and month, the scheduled class days with no attendance register.
- [ ] Buying a second pack in the same month adds credits, priced by its own size.
- [ ] Fixed-fee sections behave exactly as before; `section_fee_plans`, `prorateMonthlyFee`,
      `monthly_fee_charge_mode` and the 12-month grid are unchanged for them.
- [ ] `authenticated` cannot write the ledger tables directly.
- [ ] All user-visible copy comes from `en` / `es` / `pt` dictionaries.
- [ ] `npm run lint`, `npx tsc --noEmit` and `npm run test` pass; coverage gate green; precommit e2e gate
      green (rule 34).

## 6. Out of scope

- Booking and spending recoverable classes (project 2) — including capacity for a visiting student, and
  whether a recovered class repairs the academic attendance percentage.
- Percentage discounts or scholarships on a pack; only full `exempt` exists (D11).
- Per-section class weights (a class worth 2 credits). Additive later on this same design.
- Changing how enrollment fee (matrícula) is charged (D12).
- Rolling balances, carry-over between months, or packs that never expire — the bag is strictly monthly.
- Migrating existing monthly-fee students onto packs; institutes opt in going forward.
- Refunds, cancellations and credit transfers between students.
- Automatic top-up when the balance reaches zero.

## 7. Follow-ups worth a later spec

1. **Project 2 — recoveries:** a booking model for attending a class in a section the student is not enrolled
   in, spending `class_recovery_credits`, with capacity rules and a decision on the attendance percentage.
2. Student-level percentage discounts, so a pack can carry a scholarship the way section enrollments do.
3. Per-section credit weight for institutes mixing individual and group classes.
4. Expiry for recovery credits (today they accrue indefinitely, which is a growing liability).
5. Blocking or warning at enrollment time when a student's balance cannot cover the classes they are
   scheduled for.
6. Automatic top-up offer in the portal when the balance hits zero mid-month.
