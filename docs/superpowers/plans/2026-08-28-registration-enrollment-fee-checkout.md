# Registration enrollment-fee checkout — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (this session: inline). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Public submit emails a branded pre-inscription note; when matrícula is due the family pays on `/matricula/[token]`; a confirmed payment or admin waive enrols the student (and tutor) and leaves the inbox.

**Architecture:** Lead stays a `registrations` row. Snapshot + `pay_token` + `intake_state` are written on submit. A public token page re-checks cupo and starts Flow/MP or transfer. One accept core (`acceptRegistrationLead`) is called by admin actions and gateway finalize. Home / inbox count staff actions separately from waiting payment.

**Tech Stack:** Next.js App Router, Zod server actions, Supabase Postgres (`SECURITY DEFINER` RPCs), `sendBrandedEmail`, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-28-registration-enrollment-fee-checkout-design.md`

## Global Constraints

- Spec authority: that file. Public submit never writes `section_enrollments`.
- Do not fork `RegisterForm` (`28-tenant-register-surface.mdc`).
- i18n `en` / `es` / `pt` same key shape (`09-i18n-copy.mdc`).
- Supabase only via `src/lib/supabase/` (`12-supabase-app-boundaries.mdc`).
- Migrations additive only (`21-migrations-production-no-data-destruction.mdc`).
- Files ≤ 250 lines (`03-architecture.mdc`).
- Tests under `src/__tests__/` are self-contained (`30-harness-self-contained-tests.mdc`).
- Commits: only when the user asks.
- Next migration number is **194** (`193_registration_section_options_hide_full.sql` exists). Cohort-default-fees plan also claimed 194; this feature ships first — that plan must bump to 195.
- Commands: `npx vitest run <path>`, `npx tsc --noEmit`.

## File map

**Create**

- `supabase/migrations/194_registration_enrollment_fee_checkout.sql`
- `src/lib/billing/resolveCohortFeeDefaults.ts` (tests already exist)
- `src/lib/register/registrationFeeSnapshot.ts`
- `src/lib/register/registrationIntake.ts`
- `src/lib/register/generateRegistrationPayToken.ts`
- `src/lib/register/resolveRegistrationFamilyEmail.ts`
- `src/lib/register/registrationSectionHasOpenSeat.ts`
- `src/lib/email/templates/registryRegistration.ts`
- `src/lib/email/registrationIntakeEmails.ts`
- `src/lib/register/acceptRegistrationLead.ts`
- `src/app/[locale]/matricula/[token]/page.tsx`
- `src/app/[locale]/matricula/matriculaPayActions.ts`
- `src/components/register/RegistrationMatriculaPayScreen.tsx`
- `src/lib/billing/parseEnrollmentGatewayReference.ts` (or extend `parseMonthlyGatewayReference.ts`)

**Modify**

- `templateRegistry.ts` — register new keys
- `submitPublicRegistration` / `submitSectionLinkRegistration` — cupo, snapshot, token, mails
- `acceptRegistrationAction.ts` — call accept core
- `parseMonthlyGatewayReference.ts` — `enrollment:<uuid>`
- `payment_flow_checkout_refs` target CHECK (in migration)
- `loadAdminHubSummary.ts` / hub card
- `loadPaginatedRegistrations.ts` + admin list UI
- Cohort overview — fee mode toggle
- Dictionaries `en` / `es` / `pt`

---

### Task 1: Effective fee helper (tests already written)

**Files:**
- Create: `src/lib/billing/resolveCohortFeeDefaults.ts`
- Test: `src/__tests__/lib/billing/resolveCohortFeeDefaults.test.ts` (exists)

**Interfaces:**
- Produces:
  - `parseOptionalFeeAmount(raw: unknown): number | null`
  - `resolveEffectiveEnrollmentFeeAmount(sectionAmount: number | null, cohortDefault: number | null): number`
  - `resolveEffectiveMonthlyFee(input: { billingMode: string | null; sectionPlan: { monthlyFee: number; currency: string } | null; cohortDefaultMonthlyFee: number | null }): { kind: "class_pack" } | { kind: "section"; monthlyFee: number; currency: string } | { kind: "cohort"; monthlyFee: number; currency: string } | { kind: "none" }`

- [x] **Step 1:** Helper already present; tests pass.

```bash
npx vitest run src/__tests__/lib/billing/resolveCohortFeeDefaults.test.ts
```

- [ ] **Step 2:** Implement the helper. Virtual cohort monthly plan uses `DEFAULT_SECTION_FEE_PLAN_CURRENCY` (`USD`).

- [ ] **Step 3:** Re-run — expect PASS.

---

### Task 2: Snapshot + once-for-all consistency + intake helpers

**Files:**
- Create: `src/lib/register/registrationFeeSnapshot.ts`
- Create: `src/lib/register/registrationIntake.ts`
- Create: `src/lib/register/generateRegistrationPayToken.ts`
- Create: `src/lib/register/resolveRegistrationFamilyEmail.ts`
- Test: `src/__tests__/lib/register/registrationFeeSnapshot.test.ts`
- Test: `src/__tests__/lib/register/registrationIntake.test.ts`
- Test: `src/__tests__/lib/register/resolveRegistrationFamilyEmail.test.ts`

**Interfaces:**
- Consumes: `resolveEffectiveEnrollmentFeeAmount`
- Produces:
  - `RegistrationFeeMode = "once_for_all" | "per_section"`
  - `RegistrationIntakeState = "none" | "awaiting_fee" | "receipt_pending" | "needs_section" | "section_full"`
  - `RegistrationFeeLine = { sectionId: string; sectionName: string; amount: number }`
  - `RegistrationFeeSnapshot = { mode: RegistrationFeeMode; currency: string; total: number; lines: RegistrationFeeLine[]; capturedAt: string }`
  - `canCohortUseOnceForAll(effectiveAmounts: number[]): boolean` — true iff every amount is the same
  - `buildRegistrationFeeSnapshot(input: { mode: RegistrationFeeMode; currency: string; nowIso: string; sections: { id: string; name: string; sectionAmount: number | null; cohortDefault: number | null }[]; alreadyCoveredSectionIds?: string[]; onceForAllAlreadyCovered?: boolean }): RegistrationFeeSnapshot`
  - `intakeStateForSnapshotTotal(total: number): "none" | "awaiting_fee"`
  - `isRegistrationStaffUrgent(input: { status: string; intakeState: RegistrationIntakeState; snapshotTotal: number }): boolean` — `status !== "enrolled"` and intake in `none|receipt_pending|needs_section|section_full`, treating `none`+total>0 as awaiting (not urgent)
  - `isRegistrationAwaitingFee(input: { status: string; intakeState: RegistrationIntakeState; snapshotTotal: number }): boolean`
  - `generateRegistrationPayToken(): string` — 32-byte hex via `crypto.randomBytes`
  - `resolveRegistrationFamilyEmail(input: { isMinor: boolean; tutorEmail: string | null; studentEmail: string | null; studentEmailIsSynthetic: boolean }): string | null`

**Snapshot rules (spec):**
- Effective amount per section via `resolveEffectiveEnrollmentFeeAmount`.
- Drop already-covered section ids from charge lines when `per_section`.
- `once_for_all` + `onceForAllAlreadyCovered` → `total = 0`.
- `once_for_all`: `total` = shared effective amount once; first charged line shows that amount, remaining lines `0`.
- Empty sections + `once_for_all`: `total` = shared amount from any section’s effective (caller must pass a synthetic line or a `sharedAmount` — use `sharedAmount?: number` when `sections` is empty).
- Empty sections + `per_section`: `total = 0`, `lines = []`.
- Currency = first line with amount > 0, else input `currency`, else `USD`.

**Family email:** minor → tutor email if present; else student email unless synthetic. Adult → student email unless synthetic.

- [ ] **Step 1:** Write failing tests for the rules above.

- [ ] **Step 2:** `npx vitest run src/__tests__/lib/register/registrationFeeSnapshot.test.ts src/__tests__/lib/register/registrationIntake.test.ts src/__tests__/lib/register/resolveRegistrationFamilyEmail.test.ts` — FAIL.

- [ ] **Step 3:** Implement the four modules.

- [ ] **Step 4:** Re-run — PASS.

---

### Task 3: Migration 194

**Files:**
- Create: `supabase/migrations/194_registration_enrollment_fee_checkout.sql`
- Test: `src/__tests__/db/registration_enrollment_fee_checkout_migration.test.ts`

**Interfaces:**
- Produces columns on `registrations`: `pay_token TEXT UNIQUE`, `intake_state TEXT NOT NULL DEFAULT 'none'`, `fee_snapshot JSONB NOT NULL DEFAULT '{}'`, `fee_captured BOOLEAN NOT NULL DEFAULT false`, `enrollment_fee_receipt_path TEXT`, `accepted_student_id UUID REFERENCES profiles(id)`.
- CHECK `intake_state IN ('none','awaiting_fee','receipt_pending','needs_section','section_full')`.
- `academic_cohorts.enrollment_fee_mode TEXT NOT NULL DEFAULT 'per_section'` CHECK in `('once_for_all','per_section')`.
- `payment_flow_checkout_refs.registration_id UUID REFERENCES registrations(id) ON DELETE CASCADE`.
- Recreate target CHECK to allow `registration_id` XOR existing families (payment_id / slot / bundle).
- `payment_flow_reserve_commerce_ref_enrollment(p_registration_id UUID) RETURNS TEXT` — `MAT-` + year + serial; service_role only.
- `registration_public_section_has_open_seat(p_section_id uuid) RETURNS boolean` — same seat rule as `list_registration_section_options`; grant anon + authenticated.
- `registration_public_pay_context(p_token text)` returns safe projection (no DNI/email of others): student first/last, intake_state, fee_captured, status, snapshot, preferred_section_id, additional_section_ids, section labels/schedules needed by the page. `SECURITY DEFINER`, revoke PUBLIC, grant anon + authenticated. Do not select tutor DNI or raw email in the return table.

- [ ] **Step 1:** Write SQL-assert tests (readFileSync pattern).

- [ ] **Step 2:** Run — FAIL (file missing).

- [ ] **Step 3:** Write the additive migration. No DROP of existing columns. No UPDATE of existing registration rows except new defaults apply to new inserts; existing rows get `intake_state='none'` via DEFAULT.

`pay_token` is UNIQUE but existing rows need a value: `ADD COLUMN pay_token TEXT`, backfill `encode(gen_random_bytes(32), 'hex')`, then `SET NOT NULL` and UNIQUE. That is additive, not destructive.

- [ ] **Step 4:** Re-run migration test — PASS.

---

### Task 4: Email registry + send helpers

**Files:**
- Create: `src/lib/email/templates/registryRegistration.ts`
- Create: `src/lib/email/registrationIntakeEmails.ts`
- Modify: `src/lib/email/templates/templateRegistry.ts`
- Test: `src/__tests__/lib/email/registryRegistration.test.ts`
- Test: `src/__tests__/lib/email/registrationIntakeEmails.test.ts`

**Keys:** `registration.received`, `registration.admin_received`, `registration.admin_receipt_pending`, `registration.admin_enrolled`, `registration.admin_needs_section`, `registration.welcome`, `registration.receipt_rejected`, `registration.section_full`. Category `notifications` (Settings group “other”).

`registration.received` placeholders: `greetingName`, `studentName`, `sectionName`, `scheduleLabel`, `payUrl`, `amountLabel`. Button HTML only when `payUrl` is non-empty (template can always include the link; caller passes `""` when total is 0 and the default body uses a second sentence without the button when `payUrl` is empty — use two body variants via vars `payBlock` filled by the sender).

- [ ] **Step 1:** Test `listEmailTemplateDefinitions()` includes all eight keys.

- [ ] **Step 2:** Implement registry + `sendRegistrationFamilyEmail` / `sendRegistrationAdminEmails` wrapping `sendBrandedEmail`. Admin list = `profiles.role = admin` excluding `PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID`. Failures logged, never thrown.

- [ ] **Step 3:** Tests PASS.

---

### Task 5: Submit — cupo + snapshot + mails

**Files:**
- Modify: `src/app/[locale]/register/actions.ts`
- Modify: `src/app/[locale]/i/actions.ts` (or shared helper)
- Create: `src/lib/register/finalizePublicRegistrationInsert.ts` (shared insert payload + mail)
- Test: `src/__tests__/app/submitPublicRegistration.enrollmentFee.test.ts`
- Test: `src/__tests__/app/submitSectionLinkRegistration.test.ts` (extend)
- Dictionaries: `register.sectionFilledUp`

**Behaviour:** Before insert, RPC `registration_public_section_has_open_seat` for each requested id. Any false → `{ ok: false, message: dict.register.sectionFilledUp }` no insert. On success set `pay_token`, `fee_snapshot`, `intake_state`, `fee_captured: false`. Then send family + admin mails (ignore send errors).

- [ ] **Step 1:** Failing tests: full section → no insert; open + fee → awaiting_fee + sendBrandedEmail called; open + 0 → none + received mail without payUrl.

- [ ] **Step 2:** Implement.

- [ ] **Step 3:** PASS.

---

### Task 6: Public pay page

**Files:**
- Create page + `RegistrationMatriculaPayScreen` + `matriculaPayActions.ts`
- Test: `src/__tests__/components/register/RegistrationMatriculaPayScreen.test.tsx`
- Test: `src/__tests__/app/matriculaPayActions.test.ts`
- Dictionaries: `register.enrollmentPay.*`

**Actions (token-keyed):** `switchRegistrationPaySectionAction`, `startRegistrationEnrollmentFlowAction`, `startRegistrationEnrollmentMercadoPagoAction`, `uploadRegistrationEnrollmentReceiptAction`.

Each re-checks cupo. Full → filled-section UI. `fee_captured` → no second charge; switch section runs accept core.

- [ ] Tests then implement.

---

### Task 7: Gateway finalize + accept core

**Files:**
- Create: `src/lib/register/acceptRegistrationLead.ts`
- Modify: `acceptRegistrationAction.ts` to call it
- Extend `parseMonthlyGatewayReference` with `{ kind: "enrollment"; registrationId: string }` and `enrollment:<uuid>`
- Wire Flow/MP finalize branches
- Test: `src/__tests__/lib/register/acceptRegistrationLead.test.ts`
- Test: `src/__tests__/lib/billing/parseMonthlyGatewayReference.test.ts` (extend)

**acceptRegistrationLead** matches the spec table (new minor / adult / existing / needs_section / waive / idempotent).

- [ ] Tests then implement.

---

### Task 8: Admin inbox, home counts, waive / receipt / assign

**Files:**
- Modify `loadAdminHubSummary.ts`, `AdminHubHomeOpsGrid.tsx`, `loadPaginatedRegistrations.ts`, registration table/PWA cards
- Actions: waive, approve receipt, reject receipt, assign section
- Cohort overview: `enrollment_fee_mode` toggle with `canCohortUseOnceForAll`
- Tests for hub counts, filters, waive reason required

- [ ] Tests then implement.

---

## Spec coverage

| Spec item | Task |
|-----------|------|
| Cohort mode + inconsistency | 2, 3, 8 |
| Snapshot / existing student covered | 2, 5 |
| Submit cupo reject | 5 |
| Received + admin mails | 4, 5 |
| Public token page + cupo on render | 6 |
| Transfer upload | 6 |
| Flow/MP + idempotency + fee_captured | 7 |
| Accept core / waive / assign | 7, 8 |
| Home urgent vs waiting payment | 8 |
| Undecided once_for_all | 2, 6, 7 |

## Execution

This session: inline executing-plans, starting at Task 1. Do not commit unless asked.
)
