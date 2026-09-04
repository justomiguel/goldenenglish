# Registration Intake E2E Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Precommit Playwright covers join-package `/matricula`, accept **No al día**, and (if the e2e tenant exposes it) trial convert — without breaking the existing `$0` Section A register→accept spec.

**Architecture:** New `e2e/critical-registration-*.spec.ts` files under the existing `chromium-critical-registration` project. Seed fees only on Section B / Tiny / Trial. Transfer receipts reuse `receipt-tiny.png`. Mail URLs via `extractMatriculaUrlFromHtml`.

**Tech Stack:** Playwright, isolated Supabase, `RecordingEmailProvider`, existing register helpers.

**Spec:** `docs/superpowers/specs/2026-09-01-registration-intake-e2e-design.md`

## Global Constraints

- Isolated stack only (`E2E_STACK=isolated`). Never point at nago/golden/prod.
- Do **not** change `E2E Section A` fee or `max_students`.
- No live MP/Flow. Transfer + receipt only.
- `workers: 1`. Stay inside ≤15 min warm precommit.
- Share helpers; do not copy `critical-registration.spec.ts` wholesale.
- TDD: write the spec file first, watch it fail, then seed/helper/product-wiring.

## File map

| File | Role |
|------|------|
| `e2e/helpers/acceptRegistration.ts` | Add `chooseJoinBillingBehind` |
| `e2e/helpers/extractMatriculaUrl.ts` | Shared with schedule-offer Task 8 (create here if that task has not) |
| `e2e/critical-registration-join-package.spec.ts` | Journey 1 |
| `e2e/critical-registration-join-behind.spec.ts` | Journey 3 |
| `e2e/critical-registration-assign.spec.ts` | Journey 2 or a skipped test with reason |
| `e2e/critical-registration-trial.spec.ts` | Journey 4 or skipped |
| `supabase/seeds/e2e/seed-admin.sql` | Section B fee; optional Trial section |
| `docs/runbooks/e2e-isolated-harness.md` | Project/seed rows |

---

### Task 1: Behind accept + join-package `/matricula`

**Files:**
- Modify: `e2e/helpers/acceptRegistration.ts`
- Create: `e2e/helpers/extractMatriculaUrl.ts` (skip create if schedule-offer Task 8 already added it)
- Create: `e2e/critical-registration-join-behind.spec.ts`
- Create: `e2e/critical-registration-join-package.spec.ts`
- Modify: `supabase/seeds/e2e/seed-admin.sql` — `E2E Section B.enrollment_fee_amount = 15000` (idempotent UPDATE). Leave A at 0.

**Interfaces:**
- Consumes: `chooseRegisterSectionByName`, `pickRegisterBirthIso`, `submitRegisterAfterDetails`, `chooseJoinBillingCurrent`, recorded-emails API, `e2e/fixtures/receipt-tiny.png`
- Produces:

```ts
export async function chooseJoinBillingBehind(dialog: Locator): Promise<void>;
export function extractMatriculaUrlFromHtml(html: string): string | null;
```

- [ ] **Step 1: Write the failing specs**

`acceptRegistration.ts` addition used by the behind spec:

```ts
export async function chooseJoinBillingBehind(dialog: Locator) {
  await dialog.getByRole("radio", { name: /^(No al día|Behind \(|Em atraso)/ }).check();
}
```

`critical-registration-join-behind.spec.ts` — copy the existing register→accept→login from `critical-registration.spec.ts` but call `chooseJoinBillingBehind` instead of `chooseJoinBillingCurrent`. Same Section A, same DNI login.

`critical-registration-join-package.spec.ts`:

```ts
test("register with fee → /matricula transfer → admin approves receipt → login", async ({
  browser, request,
}) => {
  test.setTimeout(180_000);
  await clearRecordedEmails(request);
  // anon register adult → chooseRegisterSectionByName(/E2E Section B/i) → submit
  const emails = await fetchRecordedEmails(request);
  const payUrl = extractMatriculaUrlFromHtml(emails.at(-1)!.html);
  expect(payUrl).toBeTruthy();

  const family = await browser.newContext();
  const pay = await family.newPage();
  await pay.goto(new URL(payUrl!, isolation.ok ? isolation.baseURL : "http://127.0.0.1:3100").pathname);
  await expect(pay.getByRole("heading", { name: /Pago de ingreso|Pay enrollment/i })).toBeVisible({ timeout: 30_000 });
  await pay.locator('input[type="file"]').setInputFiles("e2e/fixtures/receipt-tiny.png");
  await pay.getByRole("button", { name: /Enviar comprobante|Upload|Send receipt/i }).click();
  await expect(pay.getByText(/comprobante|receipt|revisando/i)).toBeVisible({ timeout: 30_000 });
  await family.close();

  const admin = await browser.newContext({ storageState: paths.storageState });
  const adminPage = await admin.newPage();
  await gotoIsolated(adminPage, `/${locale}/dashboard/admin/registrations`);
  const row = adminPage.locator("tr, li, article").filter({ hasText: dni }).first();
  await expect(row).toBeVisible({ timeout: 30_000 });
  // expand if needed, approve receipt + chooseJoinBillingCurrent
  await admin.close();

  // student login with normalizeDni(dni).password — same as critical-registration
});
```

Match upload selectors to `critical-payments.spec.ts` / `RegistrationMatriculaPayActions` (file input + `enrollmentPayUploadButton`).

- [ ] **Step 2: Run to verify fail**

```bash
npm run test:e2e:precommit -- --project=setup --project=chromium-critical-registration
```

Expected: behind may already pass if the radio exists; join-package FAILS until Section B has a fee and `/matricula` shows transfer (join-package product must already be on the branch).

- [ ] **Step 3: Seed B fee + helpers**

Idempotent:

```sql
UPDATE public.academic_sections
SET enrollment_fee_amount = 15000
WHERE name = 'E2E Section B' AND cohort_id = v_cohort;
```

If B insert path still uses `0`, change the INSERT default to `15000` as well.

Implement `chooseJoinBillingBehind` and `extractMatriculaUrlFromHtml`.

- [ ] **Step 4: Re-run**

Same command. Expected: `critical-registration.spec.ts`, `*-join-behind`, `*-join-package` PASS.

- [ ] **Step 5: Commit**

```bash
git add e2e/helpers/acceptRegistration.ts \
  e2e/helpers/extractMatriculaUrl.ts \
  e2e/critical-registration-join-behind.spec.ts \
  e2e/critical-registration-join-package.spec.ts \
  supabase/seeds/e2e/seed-admin.sql
git commit -m "$(cat <<'EOF'
test: e2e join-package matricula and behind accept

EOF
)"
```

---

### Task 2: Assign-without-section (or drop)

**Files:**
- Create: `e2e/critical-registration-assign.spec.ts`

**Interfaces:**
- Consumes: public register undecided option if `#rg-section` allows empty / “aún no sé”
- Produces: one journey **or** `test.skip(true, "public register requires a section")`

- [ ] **Step 1: Probe the form once**

Open `/register` on the isolated app (or read `RegisterSectionPicker`). If there is no undecided value, write:

```ts
test.skip(true, "public register requires a section — assign-from-needs_section is admin-only after a wipe we will not do in e2e");
```

and stop. That is an allowed Done-when.

- [ ] **Step 2: If undecided exists, write the failing journey**

Register with undecided → inbox `needsSection` copy → Asignar Section B → recorded pay mail → `/matricula` heading.

- [ ] **Step 3: Make it pass / keep the skip**

- [ ] **Step 4: Run** `chromium-critical-registration`

- [ ] **Step 5: Commit**

```bash
git add e2e/critical-registration-assign.spec.ts
git commit -m "$(cat <<'EOF'
test: e2e assign section before join-package pay

EOF
)"
```

---

### Task 3: Trial convert (or skip)

**Files:**
- Modify: `supabase/seeds/e2e/seed-admin.sql` — optional `E2E Section Trial` (`offers_trial = true`, schedule slot, `trial_fee_amount = 0` or `5000`)
- Create: `e2e/critical-registration-trial.spec.ts`

**Interfaces:**
- Consumes: dual CTA on `/register` when the e2e tenant has trial enabled
- Produces: book → recorded convert/unirse URL → `/unirse` quote visible

- [ ] **Step 1: Write the spec that fails or skips**

```ts
test("trial book → unirse quote", async ({ browser, request }) => {
  test.setTimeout(180_000);
  await clearRecordedEmails(request);
  await gotoIsolated(page, `/${locale}/register`);
  const trialCta = page.getByRole("button", { name: /clase de prueba|trial class/i });
  test.skip(!(await trialCta.isVisible().catch(() => false)), "e2e tenant has no trial CTA");
  // book Trial section, assert recorded mail or success, open /unirse if a token is mailed
});
```

- [ ] **Step 2: Run — expect skip or fail**

- [ ] **Step 3: Seed Trial section only if the CTA is on for `GE_DEV_TARGET=e2e`**

If the flag is off after reading `completeTrialRegistrationSubmit` / site settings, leave the skip and do **not** invent a hidden book API.

- [ ] **Step 4: Re-run registration project**

- [ ] **Step 5: Commit**

```bash
git add e2e/critical-registration-trial.spec.ts supabase/seeds/e2e/seed-admin.sql
git commit -m "$(cat <<'EOF'
test: e2e trial convert quote when the tenant exposes it

EOF
)"
```

---

### Task 4: Runbook + budget check

**Files:**
- Modify: `docs/runbooks/e2e-isolated-harness.md`
- Modify: `docs/superpowers/specs/2026-07-12-critical-e2e-coverage-roadmap-design.md` — add a short “Phase 6+ intake money” row pointing at these specs (do not reopen Phase 7)

- [ ] **Step 1: Document** Section B fee, Tiny (if present), new spec files in the runbook project table (they share `chromium-critical-registration`).

- [ ] **Step 2: Run full** `npm run test:e2e:precommit` once. Confirm wall-clock still ≤15 min warm. If over, do **not** move these money specs behind `E2E_SUITE=extended` — move a Phase 6 smoke (`portal-smoke-hubs`) instead, as the existing escape hatch already names that file.

- [ ] **Step 3: Commit docs**

```bash
git add docs/runbooks/e2e-isolated-harness.md \
  docs/superpowers/specs/2026-07-12-critical-e2e-coverage-roadmap-design.md
git commit -m "$(cat <<'EOF'
docs: intake money e2e on the isolated registration project

EOF
)"
```

---

## Self-review

| Spec journey | Task |
|--------------|------|
| Join package `/matricula` + receipt approve | 1 |
| Accept No al día | 1 |
| Assign then pay, or explicit skip | 2 |
| Trial convert, or skip with reason | 3 |
| Section A unchanged; budget | 1, 4 |
| Schedule offer | **other plan** Task 8 |
| Phase 6 / Phase 7 nightly | out of scope |

**Placeholder scan:** none.

**Type consistency:** helpers `chooseJoinBillingBehind`, `extractMatriculaUrlFromHtml`; seed name `E2E Section B` / `E2E Section Trial`.
