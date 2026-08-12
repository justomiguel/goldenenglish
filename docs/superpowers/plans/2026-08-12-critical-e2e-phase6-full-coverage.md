# Critical E2E Phase 6 Full Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship ten precommit Playwright journeys that close Phase 6 gaps (teacher, attendance, unenroll, event remove, record-payment, messaging, collections, forgot-password, scholarship, portal smokes), keeping Phase 7 nightly-only.

**Architecture:** Extend the isolated Supabase + `.next-e2e` harness: add teacher `storageState`, a fourth seeded due month for ledger tests, and one Playwright project per new spec. Specs follow existing patterns (`gotoIsolated`, dict labels / `data-tour`, multi-context browser when roles cross). Prefer mutation → UI post-condition over page inventory.

**Tech Stack:** Playwright, Next.js production server (`next start` via `run-e2e-precommit.mjs`), local Supabase seed SQL, Vitest only for pure harness helpers, `RecordingEmailProvider`.

**Spec:** `docs/superpowers/specs/2026-08-12-critical-e2e-phase6-full-coverage-design.md`

## Global Constraints

- `E2E_STACK=isolated` + `GE_DEV_TARGET=e2e` only; never point at nago/golden/prod.
- Keep `E2E_REQUIRE=1` fail-closed; do not soften the gate.
- `workers: 1`; reseed before precommit remains mandatory.
- Selectors: dictionary labels, roles, existing `data-tour`; add `data-testid` only if no stable hook.
- Warm precommit budget target **≤15 min**; escape hatch: `portal-smoke-hubs` + `critical-scholarship` + `critical-collections-bulk` behind `E2E_SUITE=extended` if needed.
- Phase 7 (MP/Flow, CMS, coupons, locale, assistant) is **out of this plan**.
- Ship green incrementally; commit after each task that leaves the suite green.

## File map

| Path | Responsibility |
|------|----------------|
| `e2e/env.ts` | Add `teacherStorageState` to `e2eAuthPaths()` |
| `e2e/auth.setup.ts` | Login teacher → write `e2e/.auth/teacher.json` |
| `supabase/seeds/e2e/seed-admin.sql` | Fourth due month (`v_record_month`) for record-payment |
| `e2e/buildE2eLocalEnvFile.ts` | Export `E2E_TEACHER_EMAIL` if not already (already present) |
| `playwright.config.ts` | One project per new spec |
| `e2e/critical-teacher-auth.spec.ts` | Teacher hub + finance deny |
| `e2e/critical-attendance.spec.ts` | Mark cell → save → persist |
| `e2e/critical-section-unenroll.spec.ts` | Remove student-b from section → dropped |
| `e2e/critical-event-attendee-remove.spec.ts` | Register pending transfer → admin delete |
| `e2e/critical-record-payment.spec.ts` | Admin mark paid without receipt |
| `e2e/critical-scholarship.spec.ts` | Assign % scholarship on enrollment |
| `e2e/critical-messaging.spec.ts` | Admin compose → student inbox |
| `e2e/critical-collections-bulk.spec.ts` | Collections bulk preview / compose degrade |
| `e2e/critical-forgot-password.spec.ts` | Reset via recorded email |
| `e2e/portal-smoke-hubs.spec.ts` | Parent/student/teacher landmark smokes |
| `docs/runbooks/e2e-isolated-harness.md` | Project table + budget + fixtures |
| `docs/superpowers/specs/2026-07-12-critical-e2e-coverage-roadmap-design.md` | Mark Phase 6 shipped |
| `docs/superpowers/specs/2026-07-12-critical-e2e-suite-design.md` | Follow-ups pointer |

---

### Task 1: Harness — teacher storage + record-payment due month

**Files:**
- Modify: `e2e/env.ts`
- Modify: `e2e/auth.setup.ts`
- Modify: `supabase/seeds/e2e/seed-admin.sql`
- Modify: `src/__tests__/e2e/resolveE2eIsolation.test.ts` (optional assert on path helper shape if you add a tiny export test; otherwise skip Vitest)
- Test: reseed + `auth.setup` via Playwright setup project

**Interfaces:**
- Consumes: `E2E_TEACHER_EMAIL` (already written by `buildE2eLocalEnvFile`), `e2eSharedPassword()`, `loginOnPage`
- Produces: `e2eAuthPaths().teacherStorageState` → `e2e/.auth/teacher.json`; seed payment for `v_record_month`

- [ ] **Step 1: Extend `e2eAuthPaths`**

In `e2e/env.ts`, change the return of `e2eAuthPaths()` to:

```ts
export function e2eAuthPaths() {
  const dir = join(process.cwd(), "e2e", ".auth");
  return {
    dir,
    storageState: join(dir, "admin.json"),
    studentStorageState: join(dir, "student.json"),
    parentStorageState: join(dir, "parent.json"),
    teacherStorageState: join(dir, "teacher.json"),
    readyMarker: join(dir, "ready"),
  };
}
```

- [ ] **Step 2: Login teacher in `auth.setup.ts`**

After the parent block (before `writeFileSync(paths.readyMarker, "1")`):

```ts
  const teacherEmail = (process.env.E2E_TEACHER_EMAIL ?? "e2e-teacher@example.test").trim();

  const teacherCtx = await browser.newContext();
  const teacherPage = await teacherCtx.newPage();
  await loginOnPage(teacherPage, locale, teacherEmail, password);
  await teacherCtx.storageState({ path: paths.teacherStorageState });
  await teacherCtx.close();
```

Also update the isolation-fail empty-file loop to include `paths.teacherStorageState`.

- [ ] **Step 3: Seed fourth due month in `seed-admin.sql`**

Next to `v_reject_month`, add a distinct month (avoid current / parent / reject):

```sql
  v_record_month int;
  -- ...
  v_record_month := CASE
    WHEN v_month <= 9 THEN v_month + 3
    WHEN v_month = 10 THEN 8
    WHEN v_month = 11 THEN 7
    ELSE 6
  END;
```

Upsert a pending monthly payment for `(v_student, v_section, v_record_month, v_year)` the same way as reject month (amount 100, `receipt_url` NULL, `status` pending). Comment: `-- Fourth due month for admin record-payment-without-receipt E2E`.

- [ ] **Step 4: Reseed + verify teacher storage**

```bash
docker exec -i supabase_db_goldenenglish psql -U postgres -d postgres < supabase/seeds/e2e/seed-admin.sql
E2E_REQUIRE=1 npm run test:e2e:precommit -- --project=setup
```

Expected: exit 0; `e2e/.auth/teacher.json` exists and is non-empty.

- [ ] **Step 5: Commit**

```bash
git add e2e/env.ts e2e/auth.setup.ts supabase/seeds/e2e/seed-admin.sql
git commit -m "$(cat <<'EOF'
feat(e2e): teacher storage and record-payment due month seed

Unblocks Phase 6 teacher auth and ledger-without-receipt journeys.
EOF
)"
```

---

### Task 2: `critical-teacher-auth`

**Files:**
- Create: `e2e/critical-teacher-auth.spec.ts`
- Modify: `playwright.config.ts` (add project after setup dependents)

**Interfaces:**
- Consumes: `paths.teacherStorageState`, `gotoIsolated`, isolation guards
- Produces: green project `chromium-critical-teacher-auth`

- [ ] **Step 1: Write the spec**

```ts
import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import {
  e2eAuthPaths,
  e2eRequireFailureMessage,
  resolveE2eIsolation,
} from "./env";
import { gotoIsolated } from "./helpers/gotoIsolated";

const paths = e2eAuthPaths();
const isolation = resolveE2eIsolation();
const authReady = existsSync(paths.readyMarker);

test.describe("@critical-teacher-auth", () => {
  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) throw new Error(requireFailure);
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
    test.skip(!authReady, "Auth storage not ready");
  });

  test("teacher storage lands on teacher hub", async ({ browser }) => {
    const locale = isolation.ok ? isolation.locale : "es";
    const ctx = await browser.newContext({ storageState: paths.teacherStorageState });
    const page = await ctx.newPage();
    await gotoIsolated(page, `/${locale}/dashboard`);
    await expect(page).toHaveURL(new RegExp(`/${locale}/dashboard/teacher`));
    await ctx.close();
  });

  test("teacher cannot open admin finance", async ({ browser }) => {
    test.setTimeout(180_000);
    const locale = isolation.ok ? isolation.locale : "es";
    const ctx = await browser.newContext({ storageState: paths.teacherStorageState });
    const page = await ctx.newPage();
    await gotoIsolated(page, `/${locale}/dashboard/admin/finance`, {
      timeout: 45_000,
      attempts: 3,
    });
    await expect
      .poll(() => page.url(), { timeout: 60_000 })
      .not.toMatch(new RegExp(`/${locale}/dashboard/admin/finance(?:/|\\?|$)`));
    await ctx.close();
  });
});
```

- [ ] **Step 2: Wire project in `playwright.config.ts`**

```ts
    {
      name: "chromium-critical-teacher-auth",
      dependencies: ["setup"],
      testMatch: /critical-teacher-auth\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
```

- [ ] **Step 3: Run**

```bash
npm run test:e2e:precommit -- --project=setup --project=chromium-critical-teacher-auth
```

Expected: 2 passed.

- [ ] **Step 4: Commit**

```bash
git add e2e/critical-teacher-auth.spec.ts playwright.config.ts
git commit -m "$(cat <<'EOF'
test(e2e): teacher role landing and admin finance deny

EOF
)"
```

---

### Task 3: `critical-attendance`

**Files:**
- Create: `e2e/critical-attendance.spec.ts`
- Modify: `playwright.config.ts`

**Interfaces:**
- Consumes: admin (or teacher) storage, `E2E_COHORT_ID`, `E2E_SECTION_ID`, tour path `…/attendance`
- Produces: green `chromium-critical-attendance`

- [ ] **Step 1: Write failing journey**

Path: `/${locale}/dashboard/admin/academic/${cohortId}/${sectionId}/attendance` (admin) **or** teacher section attendance if admin matrix is flaky — prefer admin first (tour `task:take-attendance` already opens this).

Flow:
1. `gotoIsolated` attendance page.
2. Wait for matrix (`data-tour` from take-attendance tour, or first grid cell).
3. Click one cell for seeded student until accessible name / text includes `Presente` (dict `segPresent` / `present`).
4. Click `Guardar asistencia` (`saveFloating`).
5. Reload page.
6. Expect same cell still Presente.

Skeleton:

```ts
test("admin marks one attendance cell and it persists after refresh", async ({ page }) => {
  test.setTimeout(120_000);
  const locale = isolation.ok ? isolation.locale : "es";
  const cohortId = process.env.E2E_COHORT_ID?.trim();
  const sectionId = process.env.E2E_SECTION_ID?.trim();
  test.skip(!cohortId || !sectionId, "missing cohort/section ids");

  await gotoIsolated(
    page,
    `/${locale}/dashboard/admin/academic/${cohortId}/${sectionId}/attendance`,
  );
  // Prefer first interactive attendance cell for E2E Student row.
  const cell = page.getByRole("button", { name: /E2E Student|Student E2E|Presente|Ausente/i }).first();
  await expect(cell).toBeVisible({ timeout: 60_000 });
  await cell.click();
  // Toggle until Presente if needed (cycle Presente→Ausente→…).
  await page.getByRole("button", { name: /Guardar asistencia|Save attendance/i }).click();
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("button", { name: /Presente|Present/i }).first(),
  ).toBeVisible({ timeout: 60_000 });
});
```

Tune selectors against the live matrix during implementation (cell may be `gridcell` / custom). If no stable hook, add a single `data-testid="e2e-attendance-cell"` on the first editable cell only.

- [ ] **Step 2: Wire project + run**

```bash
npm run test:e2e:precommit -- --project=setup --project=chromium-critical-attendance
```

Expected: 1 passed.

- [ ] **Step 3: Commit**

```bash
git add e2e/critical-attendance.spec.ts playwright.config.ts
# include any data-testid product tweak if required
git commit -m "$(cat <<'EOF'
test(e2e): attendance mark persists after refresh

EOF
)"
```

---

### Task 4: `critical-section-unenroll`

**Files:**
- Create: `e2e/critical-section-unenroll.spec.ts`
- Modify: `playwright.config.ts`

**Interfaces:**
- Consumes: admin storage, `E2E_STUDENT_B` path via user search or enroll then remove; labels `admin.users.detailSectionAssignRemove` / `detailSectionAssignRemoveTitle` (“Quitar” / “¿Quitar de la sección?”)
- Produces: green unenroll project

**Product path:** `removeStudentFromSectionAction` is exposed on user detail via `AdminStudentCurrentCohortAssignmentCard` — **not** on the section roster tabs alone.

- [ ] **Step 1: Write journey**

1. Ensure EnrolleeB is active on section A (reuse enroll UI from `critical-section-enroll.spec.ts` if not already active).
2. Resolve student-b user id: from admin users search for `EnrolleeB` / `e2e-student-b@example.test`, open detail.
3. In current-cohort assignment card, click **Quitar** for `E2E Section A`.
4. Confirm modal (`¿Quitar de la sección?` → confirm).
5. Navigate to section roster `?tab=students`, open **dropped** tab, expect `EnrolleeB`.

```ts
test("admin removes student-b from section → dropped roster", async ({ page }) => {
  test.setTimeout(180_000);
  // enroll if needed (copy enroll block from critical-section-enroll)
  // then users → EnrolleeB → Quitar → confirm
  // then section roster dropped tab
});
```

Place this Playwright **project after** `chromium-critical-section-enroll` in config so enroll likely already ran in the same precommit (still keep in-spec enroll fallback).

- [ ] **Step 2: Run + commit**

```bash
npm run test:e2e:precommit -- --project=setup --project=chromium-critical-section-enroll --project=chromium-critical-section-unenroll
```

```bash
git commit -m "$(cat <<'EOF'
test(e2e): section unenroll drops student-b from roster

EOF
)"
```

---

### Task 5: `critical-event-attendee-remove`

**Files:**
- Create: `e2e/critical-event-attendee-remove.spec.ts`
- Modify: `playwright.config.ts`

**Interfaces:**
- Consumes: anon register on `e2e-paid-event` with transfer proof (same as `critical-paid-event`); admin storage; `canDeleteEventAttendee` allows pending transfer; labels `attendeesDelete` / `attendeesDeleteConfirm` (“Eliminar asistente”)
- Produces: green remove project

- [ ] **Step 1: Write journey**

```ts
test("admin removes a pending transfer attendee", async ({ browser }) => {
  test.setTimeout(180_000);
  const locale = isolation.ok ? isolation.locale : "es";
  const suffix = Date.now().toString(36);
  const lastName = `Rm${suffix}`;
  // 1) anon paid register (copy critical-paid-event fills) with lastName
  // 2) admin → /dashboard/admin/events/{E2E_PAID_EVENT_ID or discover via slug list}
  // 3) find row with lastName → click Eliminar asistente (aria-label)
  // 4) ConfirmActionModal confirm
  // 5) expect row gone
});
```

Use `E2E_EVENT_ID` if it points at paid event; otherwise navigate events list and open `e2e-paid-event`. Confirm via dialog button matching `/Eliminar asistente|Delete attendee/i`, not `window.confirm`.

- [ ] **Step 2: Run + commit**

```bash
npm run test:e2e:precommit -- --project=setup --project=chromium-critical-event-attendee-remove
git commit -m "$(cat <<'EOF'
test(e2e): admin can remove pending event attendee

EOF
)"
```

---

### Task 6: `critical-record-payment` + `critical-scholarship`

**Files:**
- Create: `e2e/critical-record-payment.spec.ts`
- Create: `e2e/critical-scholarship.spec.ts`
- Modify: `playwright.config.ts`

**Interfaces:**
- Consumes: admin storage; finance collections / record-payment matrix for section A; labels `recordPaymentActionMarkPaid` (“Registrar como pagado”), `recordPaymentActionAddScholarship`
- Produces: two green projects

- [ ] **Step 1: Record payment without receipt**

1. Open `/${locale}/dashboard/admin/finance/collections/${sectionId}` (or finance tab that mounts `AdminRecordPayment*` matrix for section A).
2. Select the cell for E2E Student × `v_record_month` (fourth seeded month — if UI shows month labels, match that month number).
3. Click **Registrar como pagado**, confirm note if required.
4. Assert cell status Paid / Pagado.
5. Optional: student payments page shows settled for that month.

If matrix selection UX is checkbox-per-cell, follow the same interactions as the assign-scholarship tour (`task:assign-scholarship-percent` anchors) but choose Mark Paid.

- [ ] **Step 2: Scholarship assign**

1. Same collections/section matrix (or section billing UI from tour `task:assign-scholarship-percent`).
2. Select enrollment cell → **Add scholarship** / dict action → enter `25` percent → confirm.
3. Assert scholarship badge / 25% visible on matrix or user billing.

Use a percent that does not require a dedicated seed month; do **not** mark the same cell paid in both specs if they collide — scholarship first on a non-record month, or scholarship on student-b after re-enroll.

- [ ] **Step 3: Run both + commit**

```bash
npm run test:e2e:precommit -- --project=setup --project=chromium-critical-record-payment --project=chromium-critical-scholarship
git commit -m "$(cat <<'EOF'
test(e2e): record payment without receipt and assign scholarship

EOF
)"
```

---

### Task 7: `critical-messaging` + `critical-forgot-password`

**Files:**
- Create: `e2e/critical-messaging.spec.ts`
- Create: `e2e/critical-forgot-password.spec.ts`
- Modify: `playwright.config.ts`

**Interfaces:**
- Consumes: admin + student storage; `RecordingEmailProvider` + `GET/DELETE /api/e2e/recorded-emails`; forgot-password page; compose labels `composePageTitle` / `composeSend` / `composeSent`
- Produces: two green projects

- [ ] **Step 1: Messaging**

```ts
test("admin sends portal message → student inbox shows it", async ({ browser }) => {
  test.setTimeout(120_000);
  const locale = isolation.ok ? isolation.locale : "es";
  const subject = `E2E msg ${Date.now().toString(36)}`;

  const adminCtx = await browser.newContext({ storageState: paths.storageState });
  const adminPage = await adminCtx.newPage();
  await gotoIsolated(adminPage, `/${locale}/dashboard/admin/messages/compose`);
  // Pick seeded student as recipient (combobox / search e2e-student)
  // Fill body/subject with subject marker
  await adminPage.getByRole("button", { name: /Enviar|Send/i }).click();
  await expect(adminPage.getByText(/Mensaje enviado|Message sent/i)).toBeVisible({
    timeout: 30_000,
  });
  await adminCtx.close();

  const studentCtx = await browser.newContext({ storageState: paths.studentStorageState });
  const studentPage = await studentCtx.newPage();
  await gotoIsolated(studentPage, `/${locale}/dashboard/student/messages`);
  await expect(studentPage.getByText(subject)).toBeVisible({ timeout: 30_000 });
  await studentCtx.close();
});
```

Clear recorded emails at start if asserting email side-effect.

- [ ] **Step 2: Forgot password**

1. `DELETE /api/e2e/recorded-emails`.
2. Anon → `/${locale}/forgot-password`, submit `e2e-student@example.test` (or a dedicated fixture email that reseed restores).
3. `GET /api/e2e/recorded-emails` → extract reset URL from latest message HTML/text.
4. Navigate URL → set new password (then restore original via reseed — do **not** leave password changed across suite; prefer changing and relying on next precommit reseed, **or** change back in-spec).
5. Assert reset success UI.

**Important:** `auth.setup` runs once per suite; if you change student password mid-suite, later student specs break. Prefer requesting reset for a **dedicated** email created in-spec via admin create-user, or only assert “email recorded + link opens form” without submitting a new password that replaces the fixture hash. Spec allows: “Form accepts token path; fixture restored by reseed” — safest: open form with token, fill fields, submit, then **do not** use student storage afterward in the same run without re-login. Place this project **last** among student-touching specs, or use a throwaway user.

Recommended: create throwaway user in-spec (admin create-user) → forgot-password for that email → full reset → login with new password.

- [ ] **Step 3: Run + commit**

```bash
npm run test:e2e:precommit -- --project=setup --project=chromium-critical-messaging --project=chromium-critical-forgot-password
git commit -m "$(cat <<'EOF'
test(e2e): admin messaging and forgot-password via recorded email

EOF
)"
```

---

### Task 8: `critical-collections-bulk` + `portal-smoke-hubs`

**Files:**
- Create: `e2e/critical-collections-bulk.spec.ts`
- Create: `e2e/portal-smoke-hubs.spec.ts`
- Modify: `playwright.config.ts`

**Interfaces:**
- Consumes: admin storage + section collections URL; parent/student/teacher storage for smokes
- Produces: two green projects

- [ ] **Step 1: Collections bulk**

Open `/${locale}/dashboard/admin/finance/collections/${sectionId}` (or cohort collections). Trigger bulk message control if present. Prefer assert **preview / recipient list** without sending. If product only offers send:

- Degrade: open compose with recipients prefilled from collections selection (no mass Resend assert).
- Never call real Resend (`EMAIL_PROVIDER=recording`).

- [ ] **Step 2: Portal smokes (no mutations)**

```ts
test.describe("@portal-smoke-hubs", () => {
  test("student hub + payments + messages landmarks", async ({ browser }) => { /* … */ });
  test("parent hub + child + payments landmarks", async ({ browser }) => { /* … */ });
  test("teacher hub + sections landmarks", async ({ browser }) => { /* … */ });
});
```

For each role: `gotoIsolated` home, expect heading/tour landmark; open 2 deep links from shell config; expect one stable landmark (heading or `data-tour`). No forms submitted.

- [ ] **Step 3: Run + commit**

```bash
npm run test:e2e:precommit -- --project=setup --project=chromium-critical-collections-bulk --project=chromium-portal-smoke-hubs
git commit -m "$(cat <<'EOF'
test(e2e): collections bulk preview and portal hub smokes

EOF
)"
```

---

### Task 9: Docs + full-suite verification

**Files:**
- Modify: `docs/runbooks/e2e-isolated-harness.md`
- Modify: `docs/superpowers/specs/2026-07-12-critical-e2e-coverage-roadmap-design.md`
- Modify: `docs/superpowers/specs/2026-07-12-critical-e2e-suite-design.md`
- Modify: `docs/superpowers/specs/2026-08-12-critical-e2e-phase6-full-coverage-design.md` (status → Shipped when green)

- [ ] **Step 1: Update runbook**

Add all new projects to the Playwright projects table. Document:
- Teacher fixture + `teacher.json`
- Fourth due month for record-payment
- Warm budget ≤15 min
- Escape hatch `E2E_SUITE=extended` (only if implemented in `run-e2e-precommit.mjs` / config grep)

- [ ] **Step 2: Full precommit E2E**

```bash
npm run test:e2e:precommit
```

Expected: exit 0. Record wall-clock warm time. If >15 min, implement extended filter for the three lightest specs and document it.

- [ ] **Step 3: Mark roadmap Phase 6 shipped; Phase 7 still open**

- [ ] **Step 4: Commit**

```bash
git add docs/runbooks/e2e-isolated-harness.md docs/superpowers/specs/
git commit -m "$(cat <<'EOF'
docs: mark Phase 6 E2E coverage shipped

EOF
)"
```

---

## Self-review (plan vs spec)

| Spec requirement | Task |
|------------------|------|
| Teacher storage + hub + finance deny | 1, 2 |
| Attendance mark persist | 3 |
| Unenroll / drop | 4 |
| Event attendee remove | 5 |
| Record payment w/o receipt | 1 seed + 6 |
| Scholarship | 6 |
| Messaging | 7 |
| Collections bulk dry/degrade | 8 |
| Forgot-password | 7 |
| Portal smokes | 8 |
| playwright projects + runbook | 2–9 |
| Phase 7 out of scope | Global + Task 9 |
| Budget / extended escape | Global + Task 9 |
| No soft `E2E_REQUIRE` | Global |

No TBD placeholders. Phase 7 intentionally has no implementation tasks.

## Execution notes for agents

- Prefer **subagent-driven-development**: one task per subagent, review between tasks.
- After Task 1, every later task must leave `test:e2e:precommit` green for the projects it touches (and ideally not regress prior Phase 6 projects).
- Do not implement Phase 7 in this plan.
