# Registration Schedule Offer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a reserve lead’s requested schedule is full, admin can propose an open one; the family confirms on `/matricula` (or picks another) and then the join-package checkout starts.

**Architecture:** Additive `registrations.proposed_section_id` + `intake_state = offer_pending`. Propose writes the offer and mails; it does **not** overwrite `preferred_section_id`. Family confirm reuses `switchRegistrationPaySectionCore` (clear proposal, rebuild join package). Assign stays for offline yes.

**Tech Stack:** Next.js App Router, Supabase SQL + RPC, Vitest, existing `/matricula/[token]` + inbox filters.

**Spec:** `docs/superpowers/specs/2026-09-01-registration-schedule-offer-design.md`

## Global Constraints

- 250-line file ceiling (`03-architecture.mdc`). `AdminRegistrationIntakeActions.tsx` is already 226 lines and `registrationIntakeActions.ts` is 230 — do **not** grow them; extract propose UI and propose action.
- en + es copy; `pt.json` same keys (`09-i18n-copy.mdc`)
- Additive migration only: no `DROP COLUMN`, no new table, no backfill (`21-migrations-production-no-data-destruction.mdc`)
- Postgres cannot `CREATE OR REPLACE` an RPC that **adds** a `RETURNS TABLE` column — `DROP FUNCTION` then `CREATE FUNCTION`, then re-`GRANT`
- No seat hold; trial `/unirse` out of scope; do not replace Assign
- Home-card count is optional and **out of this plan**
- TDD: failing test before production code
- Playwright for this feature is Task 8 (required). Other intake money e2e: `docs/superpowers/plans/2026-09-01-registration-intake-e2e.md`
- Do not mix unrelated dirty tree files (join-package WIP, Progress typecheck) into these commits

## File map

| File | Role |
|------|------|
| `supabase/migrations/206_registration_schedule_offer.sql` | Column + CHECK + RPC |
| `src/lib/register/registrationIntake.ts` | `offer_pending` in union; **not** staff-urgent |
| `src/lib/register/parseRegistrationPayContext.ts` | `proposedSectionId` |
| `src/lib/register/registrationInboxFilter.ts` | Filter `offer_pending` |
| `src/lib/register/countRegistrationInboxFilters.ts` | Count + empty object |
| `src/lib/register/formatRegistrationIntakeLabel.ts` | “Esperando respuesta — propusimos {section}” **before** `requestedSectionFull` |
| `src/lib/register/registrationInboxPrimaryKind.ts` | `offer_pending` → `assign` (Propose + Assign stay) |
| `src/lib/register/canProposeRegistrationSchedule.ts` | Pure gate |
| `src/lib/register/proposeRegistrationScheduleCore.ts` | Cupo check, write, mail |
| `src/lib/register/notifyRegistrationScheduleOffer.ts` | `registration.schedule_offer` |
| `src/app/[locale]/dashboard/admin/registrations/proposeRegistrationScheduleAction.ts` | Admin-only action (new file) |
| `src/components/dashboard/AdminRegistrationProposeSchedule.tsx` | Select + Proponer (no join disposition) |
| `src/lib/register/switchRegistrationPaySectionCore.ts` | Clear proposal; persist `section_full` if the offer itself filled |
| `src/lib/register/registrationPayPageKind.ts` | Kind `offer` **before** `sectionIsFull` |
| `src/lib/register/loadRegistrationMatriculaPayPage.ts` | Proposed label, alternatives omit offer + full original; persist stale offer |
| `src/components/register/RegistrationMatriculaPayScreen.tsx` | Offer block; hide pay until confirmed |
| `src/lib/email/templates/registryRegistration.ts` | New key |
| Dictionaries en/es/pt | Filter, inbox, propose, `/matricula`, mail CTA |

---

### Task 1: Intake state, pay-context parse, migration

**Files:**
- Create: `supabase/migrations/206_registration_schedule_offer.sql`
- Create: `src/__tests__/db/registration_schedule_offer_migration.test.ts`
- Modify: `src/lib/register/registrationIntake.ts`
- Modify: `src/__tests__/lib/register/registrationIntake.test.ts`
- Modify: `src/lib/register/parseRegistrationPayContext.ts`
- Modify: `src/__tests__/lib/register/parseRegistrationPayContext.test.ts`
- Modify: `src/lib/register/canStartRegistrationEnrollmentFeeFlow.ts` (add `offer_pending` to `BLOCKED_INTAKE`)
- Modify: `src/__tests__/lib/register/canStartRegistrationEnrollmentFeeFlow.test.ts`

**Interfaces:**
- Consumes: existing `RegistrationIntakeState`, `registration_public_pay_context` from `194_registration_enrollment_fee_checkout.sql`
- Produces: `RegistrationIntakeState` includes `"offer_pending"`; `parseRegistrationIntakeState("offer_pending") === "offer_pending"`; unknown still `"none"`; `isRegistrationStaffUrgent({ intakeState: "offer_pending", ... }) === false`; `RegistrationPayContext.proposedSectionId: string | null`

- [ ] **Step 1: Write the failing tests**

Add to `registrationIntake.test.ts`:

```ts
it("does not count offer_pending as staff-urgent", () => {
  expect(
    isRegistrationStaffUrgent({
      status: "new",
      intakeState: "offer_pending",
      snapshotTotal: 80,
    }),
  ).toBe(false);
});
```

Add to `parseRegistrationPayContext.test.ts`:

```ts
it("reads proposed_section_id from the RPC row", () => {
  const ctx = parseRegistrationPayContext([
    {
      first_name: "Ana",
      last_name: "Pérez",
      status: "new",
      intake_state: "offer_pending",
      fee_captured: false,
      fee_snapshot: { total: 80, currency: "CLP" },
      preferred_section_id: "sec-full",
      additional_section_ids: [],
      proposed_section_id: "sec-open",
    },
  ]);
  expect(ctx?.proposedSectionId).toBe("sec-open");
  expect(ctx?.preferredSectionId).toBe("sec-full");
  expect(ctx?.intakeState).toBe("offer_pending");
});
```

Add `src/__tests__/db/registration_schedule_offer_migration.test.ts` (same `readFileSync` style as `registration_enrollment_fee_checkout_migration.test.ts`):

```ts
it("adds proposed_section_id and offer_pending without dropping columns", () => {
  expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS proposed_section_id UUID/);
  expect(sql).toMatch(/offer_pending/);
  expect(sql).toMatch(/DROP FUNCTION IF EXISTS public\.registration_public_pay_context\(text\)/);
  expect(sql).toMatch(/proposed_section_id/);
  expect(sql).not.toMatch(/DROP COLUMN/i);
});
```

Add to `canStartRegistrationEnrollmentFeeFlow.test.ts`:

```ts
expect(
  canStartRegistrationEnrollmentFeeFlow(row({ intakeState: "offer_pending" })),
).toBe(false);
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/lib/register/registrationIntake.test.ts src/__tests__/lib/register/parseRegistrationPayContext.test.ts src/__tests__/lib/register/canStartRegistrationEnrollmentFeeFlow.test.ts src/__tests__/db/registration_schedule_offer_migration.test.ts`

Expected: FAIL — `offer_pending` not in union / file missing / `proposedSectionId` undefined.

- [ ] **Step 3: Minimal implementation**

`registrationIntake.ts` — add `"offer_pending"` to the type and `REGISTRATION_INTAKE_STATES`. Do **not** add it to `STAFF_URGENT`.

`parseRegistrationPayContext.ts` — add `proposedSectionId: string | null` to the type and parse:

```ts
proposedSectionId:
  r.proposed_section_id == null ? null : String(r.proposed_section_id),
```

`canStartRegistrationEnrollmentFeeFlow.ts` — add `"offer_pending"` to `BLOCKED_INTAKE`.

`supabase/migrations/206_registration_schedule_offer.sql`:

```sql
BEGIN;

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS proposed_section_id UUID
    REFERENCES public.academic_sections(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.registrations.proposed_section_id IS
  'Admin-proposed open section while intake_state is offer_pending. preferred_section_id stays the original request until the family confirms or admin assigns.';

ALTER TABLE public.registrations
  DROP CONSTRAINT IF EXISTS registrations_intake_state_chk;

ALTER TABLE public.registrations
  ADD CONSTRAINT registrations_intake_state_chk
  CHECK (intake_state IN (
    'none',
    'awaiting_fee',
    'receipt_pending',
    'needs_section',
    'section_full',
    'offer_pending'
  ));

DROP FUNCTION IF EXISTS public.registration_public_pay_context(text);

CREATE FUNCTION public.registration_public_pay_context(p_token text)
RETURNS TABLE (
  first_name text,
  last_name text,
  status text,
  intake_state text,
  fee_captured boolean,
  fee_snapshot jsonb,
  preferred_section_id uuid,
  additional_section_ids uuid[],
  proposed_section_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.first_name,
    r.last_name,
    r.status::text,
    r.intake_state,
    r.fee_captured,
    r.fee_snapshot,
    r.preferred_section_id,
    r.additional_section_ids,
    r.proposed_section_id
  FROM public.registrations r
  WHERE r.pay_token = p_token
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.registration_public_pay_context(text) IS
  'Safe guest projection for /matricula/[token]. No DNI, email, or tutor identity.';

REVOKE ALL ON FUNCTION public.registration_public_pay_context(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registration_public_pay_context(text) TO anon;
GRANT EXECUTE ON FUNCTION public.registration_public_pay_context(text) TO authenticated;

COMMIT;
```

- [ ] **Step 4: Run tests to verify they pass**

Same vitest command. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/206_registration_schedule_offer.sql \
  src/__tests__/db/registration_schedule_offer_migration.test.ts \
  src/lib/register/registrationIntake.ts \
  src/__tests__/lib/register/registrationIntake.test.ts \
  src/lib/register/parseRegistrationPayContext.ts \
  src/__tests__/lib/register/parseRegistrationPayContext.test.ts \
  src/lib/register/canStartRegistrationEnrollmentFeeFlow.ts \
  src/__tests__/lib/register/canStartRegistrationEnrollmentFeeFlow.test.ts
git commit -m "$(cat <<'EOF'
feat: add offer_pending intake and proposed_section_id

EOF
)"
```

---

### Task 2: Inbox filter, counts, labels, primary kind

**Files:**
- Modify: `src/lib/register/registrationInboxFilter.ts`
- Modify: `src/__tests__/lib/register/registrationInboxFilter.test.ts`
- Modify: `src/lib/register/countRegistrationInboxFilters.ts`
- Modify: `src/__tests__/lib/register/countRegistrationInboxFilters.test.ts`
- Modify: `src/lib/register/registrationInboxPrimaryKind.ts`
- Modify: `src/__tests__/lib/register/registrationInboxPrimaryKind.test.ts`
- Modify: `src/lib/register/formatRegistrationIntakeLabel.ts`
- Modify: `src/__tests__/lib/register/formatRegistrationIntakeLabel.test.ts`
- Modify: `src/components/molecules/RegistrationListToolbar.tsx`
- Modify: `src/__tests__/components/dashboard/RegistrationListToolbar.test.tsx`
- Modify: `src/dictionaries/en.json`, `es.json`, `pt.json` (`admin.registrations.intake` only in this task)
- Modify: `src/types/adminRegistration.ts` — `proposedSectionId?: string | null`
- Modify: `src/lib/dashboard/loadPaginatedRegistrations.ts` — select + map `proposed_section_id`
- Modify: `src/lib/register/registrationIntakeActionSupport.ts` — add `proposed_section_id` to `IntakeLeadRow` select

**Interfaces:**
- Consumes: `offer_pending` from Task 1
- Produces: `RegistrationInboxFilter` includes `"offer_pending"`; `registrationInboxOrFilter("offer_pending") === "intake_state.eq.offer_pending"`; `RegistrationInboxCounts.offer_pending`; `registrationInboxPrimaryKind({ intakeState: "offer_pending" }) === "assign"`; `formatRegistrationIntakeLabel` returns offer copy **even when** `requestedSectionFull` is true

Copy (add under `admin.registrations.intake` in en / es / pt):

| Key | en | es | pt |
|-----|----|----|-----|
| `filterOfferPending` | Waiting for a reply ({{count}}) | Esperando respuesta ({{count}}) | Aguardando resposta ({{count}}) |
| `offerPending` | Waiting for a reply — we offered {{section}} | Esperando respuesta — propusimos {{section}} | Aguardando resposta — propusemos {{section}} |
| `proposeSchedule` | Propose a new schedule | Proponer nuevo horario | Propor novo horário |
| `proposeScheduleCta` | Propose | Proponer | Propor |

- [ ] **Step 1: Write the failing tests**

`registrationInboxFilter.test.ts`:

```ts
it("filters offer_pending by intake_state", () => {
  expect(parseRegistrationInboxFilter("offer_pending")).toBe("offer_pending");
  expect(registrationInboxOrFilter("offer_pending")).toBe(
    "intake_state.eq.offer_pending",
  );
});

it("keeps offer_pending out of the urgent or-filter", () => {
  expect(registrationInboxOrFilter("urgent")).not.toContain("offer_pending");
});
```

`countRegistrationInboxFilters.test.ts` — add a row `{ status: "new", intake_state: "offer_pending" }` and expect `offer_pending: 1` and that `urgent` does **not** increment for that row.

`registrationInboxPrimaryKind.test.ts`:

```ts
expect(
  registrationInboxPrimaryKind({
    status: "new",
    intakeState: "offer_pending",
    snapshotTotal: 80,
  }),
).toBe("assign");
```

`formatRegistrationIntakeLabel.test.ts` — extend `labels` with `offerPending: "Waiting for a reply — we offered {{section}}"`:

```ts
it("names the proposed schedule even when the original request is still full", () => {
  expect(
    formatRegistrationIntakeLabel({
      intakeState: "offer_pending",
      requestedSectionFull: true,
      proposedSectionName: "B1 Tarde",
      locale: "en",
      labels,
    }),
  ).toBe("Waiting for a reply — we offered B1 Tarde");
});
```

Toolbar test: add `offer_pending: 0` to the `inboxCounts` fixture (compile fail until the type exists).

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/lib/register/registrationInboxFilter.test.ts src/__tests__/lib/register/countRegistrationInboxFilters.test.ts src/__tests__/lib/register/registrationInboxPrimaryKind.test.ts src/__tests__/lib/register/formatRegistrationIntakeLabel.test.ts src/__tests__/components/dashboard/RegistrationListToolbar.test.tsx`

Expected: FAIL.

- [ ] **Step 3: Minimal implementation**

`registrationInboxFilter.ts` — add `"offer_pending"` to `REGISTRATION_INBOX_FILTERS`. Extend the equality branch:

```ts
if (
  filter === "receipt_pending" ||
  filter === "needs_section" ||
  filter === "section_full" ||
  filter === "offer_pending"
) {
  return `intake_state.eq.${filter}`;
}
```

Do **not** add `offer_pending` to the urgent `intake_state.in.(...)`.

`countRegistrationInboxFilters.ts` — add `offer_pending: number` to the type, empty object, and increment when `intakeState === "offer_pending"`.

`registrationInboxPrimaryKind.ts`:

```ts
if (
  intakeState === "needs_section" ||
  intakeState === "section_full" ||
  intakeState === "offer_pending"
) {
  return "assign";
}
```

`formatRegistrationIntakeLabel.ts` — add `proposedSectionName?: string` and `offerPending: string` on `labels`. **Check `offer_pending` first**:

```ts
if (input.intakeState === "offer_pending") {
  return input.labels.offerPending.replace(
    "{{section}}",
    input.proposedSectionName?.trim() || "",
  );
}
if (input.requestedSectionFull || input.intakeState === "section_full") {
  return input.labels.sectionFull;
}
```

`RegistrationListToolbar.tsx` — insert the chip **after** `section_full` and **before** `contacted`:

```ts
{ value: "offer_pending" as const, label: labels.intake.filterOfferPending, count: inboxCounts.offer_pending },
```

`AdminRegistrationRow.proposedSectionId?: string | null`.

`loadPaginatedRegistrations.ts` — add `proposed_section_id` to `REGISTRATION_COLUMNS` and map:

```ts
proposedSectionId:
  r.proposed_section_id != null ? String(r.proposed_section_id) : null,
```

`registrationIntakeActionSupport.ts` — add `proposed_section_id: string | null` to `IntakeLeadRow` and the select list.

`AdminRegistrationTableRow` / PWA card: pass `proposedSectionName` from `currentCohortSections` lookup of `r.proposedSectionId` when that list is in reach; otherwise omit (label still reads “propusimos ”). Prefer looking up in `AdminRegistrationsTableDesktop` / expanded parent if `TableRow` has no section map — add an optional `proposedSectionName?: string` argument to `formatRegistrationIntakeLabel` only (call site in TableRow can take optional `sectionNameById` later). For this task it is enough that the helper is correct; wire the name in Task 4 when the propose UI already has `sections`.

Add the four intake keys to en, es, pt.

- [ ] **Step 4: Run tests to verify they pass**

Same vitest command. Expected: PASS.

Also run: `npx vitest run src/__tests__/dictionaries/localeParity.test.ts` — if that file only checks homeInbox, skip. Manually confirm the three JSON files have the same new keys under `admin.registrations.intake`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/register/registrationInboxFilter.ts \
  src/__tests__/lib/register/registrationInboxFilter.test.ts \
  src/lib/register/countRegistrationInboxFilters.ts \
  src/__tests__/lib/register/countRegistrationInboxFilters.test.ts \
  src/lib/register/registrationInboxPrimaryKind.ts \
  src/__tests__/lib/register/registrationInboxPrimaryKind.test.ts \
  src/lib/register/formatRegistrationIntakeLabel.ts \
  src/__tests__/lib/register/formatRegistrationIntakeLabel.test.ts \
  src/components/molecules/RegistrationListToolbar.tsx \
  src/__tests__/components/dashboard/RegistrationListToolbar.test.tsx \
  src/types/adminRegistration.ts \
  src/lib/dashboard/loadPaginatedRegistrations.ts \
  src/lib/register/registrationIntakeActionSupport.ts \
  src/dictionaries/en.json src/dictionaries/es.json src/dictionaries/pt.json
git commit -m "$(cat <<'EOF'
feat: inbox filter for schedule-offer replies

EOF
)"
```

---

### Task 3: Propose core + family mail

**Files:**
- Create: `src/lib/register/canProposeRegistrationSchedule.ts`
- Create: `src/__tests__/lib/register/canProposeRegistrationSchedule.test.ts`
- Create: `src/lib/register/notifyRegistrationScheduleOffer.ts`
- Create: `src/__tests__/lib/register/notifyRegistrationScheduleOffer.test.ts`
- Create: `src/lib/register/proposeRegistrationScheduleCore.ts`
- Create: `src/__tests__/lib/register/proposeRegistrationScheduleCore.test.ts`
- Modify: `src/lib/email/templates/registryRegistration.ts`
- Modify: `src/__tests__/lib/email/registryRegistration.test.ts`

**Interfaces:**
- Consumes: `IntakeLeadRow` (now has `proposed_section_id`), `requestedSectionsHaveOpenSeats`, `buildRegistrationPayBlock`, `sendBrandedEmail`
- Produces:

```ts
export function canProposeRegistrationSchedule(row: {
  status: string;
  intakeState?: RegistrationIntakeState;
  requestedSectionFull?: boolean;
  preferredSectionId?: string | null;
  openAlternativeCount: number;
}): boolean;

export async function proposeRegistrationScheduleCore(input: {
  admin: SupabaseClient;
  locale: string;
  dict: Dictionary;
  registrationId: string;
  sectionId: string;
}): Promise<
  | { ok: true }
  | { ok: false; code: "not_found" | "not_actionable" | "section_full" | "same_section" | "save_failed" }
>;

export async function notifyRegistrationScheduleOffer(input: {
  locale: string;
  dict: Dictionary;
  lead: Pick<IntakeLeadRow, "first_name" | "last_name" | "email" | "tutor_email" | "birth_date" | "pay_token">;
  originalSectionName: string;
  proposedSectionName: string;
  proposedScheduleLabel: string;
}): Promise<void>;
```

Mail: add `registration.schedule_offer` to `REGISTRATION_EMAIL_KEYS` and `REGISTRATION_EMAIL_TEMPLATES`. Placeholders = existing `FAMILY_PLACEHOLDERS` plus `{ name: "proposedSectionName", ... }`. `sectionName` = original request. `scheduleLabel` = proposed schedule. CTA via `payBlock` with `dict.register.enrollmentPayCtaOffer` (add this key in Task 6 if you prefer all family copy together; add it **here** so the notifier compiles):

| Key | en | es | pt |
|-----|----|----|-----|
| `register.enrollmentPayCtaOffer` | View the offer | Ver la propuesta | Ver a proposta |

Defaults (es / en; pt via `withPtFallback`):

- subject es: `Te proponemos un horario para {{studentName}}`
- body es: original filled + `Te proponemos **{{proposedSectionName}}** ({{scheduleLabel}}).` + `{{payBlock}}`
- subject en: `We have a schedule for {{studentName}}`

Re-propose uses the same key.

Mail failure must **not** roll back the write (call notify after a successful update; do not throw).

- [ ] **Step 1: Write the failing tests**

`canProposeRegistrationSchedule.test.ts`:

```ts
it("is true only for an actionable full request with another open seat", () => {
  expect(
    canProposeRegistrationSchedule({
      status: "new",
      intakeState: "section_full",
      requestedSectionFull: true,
      preferredSectionId: "sec-full",
      openAlternativeCount: 1,
    }),
  ).toBe(true);
  expect(
    canProposeRegistrationSchedule({
      status: "new",
      intakeState: "offer_pending",
      requestedSectionFull: true,
      preferredSectionId: "sec-full",
      openAlternativeCount: 2,
    }),
  ).toBe(true);
});

it("is false when enrolled, no alternative, or the request is not full", () => {
  expect(
    canProposeRegistrationSchedule({
      status: "enrolled",
      intakeState: "section_full",
      openAlternativeCount: 1,
    }),
  ).toBe(false);
  expect(
    canProposeRegistrationSchedule({
      status: "new",
      intakeState: "awaiting_fee",
      requestedSectionFull: false,
      openAlternativeCount: 1,
    }),
  ).toBe(false);
  expect(
    canProposeRegistrationSchedule({
      status: "new",
      intakeState: "section_full",
      openAlternativeCount: 0,
    }),
  ).toBe(false);
});
```

`proposeRegistrationScheduleCore.test.ts` — mock `admin.from` / `rpc` like `switchRegistrationPaySectionCore.test.ts`:

1. Happy path: `intake_state: "section_full"`, open seat → update `{ proposed_section_id, intake_state: "offer_pending" }`, does **not** change `preferred_section_id`, notify called.
2. Reject `sectionId === preferred_section_id` → `{ ok: false, code: "same_section" }`, no update.
3. Reject `rpc` open-seat false → `{ ok: false, code: "section_full" }`, no update.
4. Re-propose: existing `offer_pending` + new open id → overwrites `proposed_section_id`.

`registryRegistration.test.ts`:

```ts
it("registers schedule_offer with proposedSectionName and payBlock", () => {
  expect(REGISTRATION_EMAIL_KEYS).toContain("registration.schedule_offer");
  const def = listEmailTemplateDefinitions().find((d) => d.key === "registration.schedule_offer");
  expect(def?.defaults.es.bodyHtml).toContain("{{proposedSectionName}}");
  expect(def?.defaults.es.bodyHtml).toContain("{{payBlock}}");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/lib/register/canProposeRegistrationSchedule.test.ts src/__tests__/lib/register/proposeRegistrationScheduleCore.test.ts src/__tests__/lib/email/registryRegistration.test.ts`

Expected: FAIL — modules missing.

- [ ] **Step 3: Minimal implementation**

`canProposeRegistrationSchedule.ts`:

```ts
export function canProposeRegistrationSchedule(row: {
  status: string;
  intakeState?: RegistrationIntakeState;
  requestedSectionFull?: boolean;
  openAlternativeCount: number;
}): boolean {
  if (!registrationIsActionable(row.status)) return false;
  if (row.openAlternativeCount < 1) return false;
  return (
    row.intakeState === "section_full" ||
    row.intakeState === "offer_pending" ||
    row.requestedSectionFull === true
  );
}
```

`proposeRegistrationScheduleCore.ts`:

1. `loadRegistrationIntakeLead`
2. If missing / not actionable → `not_found` / `not_actionable`
3. If `sectionId === lead.preferred_section_id` → `same_section`
4. `requestedSectionsHaveOpenSeats(admin, [sectionId])` — false → `section_full`
5. Update `{ proposed_section_id: sectionId, intake_state: "offer_pending" }` — do **not** write `preferred_section_id`
6. Resolve original + proposed names via existing `registration_public_section_label` RPC (or section `name` select). `scheduleLabel` can equal the proposed label (same as `notifyPublicRegistrationReceived` today).
7. `void notifyRegistrationScheduleOffer(...)` after a successful write
8. `recordSystemAudit({ action: "registration_schedule_offered", ... })`

`notifyRegistrationScheduleOffer.ts` — same family-email resolution as `emailRegistrationReceiptRejected` (minor + synthetic domain). `payUrl = absoluteUrl(/${locale}/matricula/${pay_token})`. CTA = `enrollmentPayCtaOffer`. If no family email or no token, return without throwing.

Registry template: follow `sectionFullTemplate` shape; add `proposedSectionName` to that template’s `placeholders` array (`[...FAMILY_PLACEHOLDERS, { name: "proposedSectionName", ... }]`).

- [ ] **Step 4: Run tests to verify they pass**

Same vitest command. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/register/canProposeRegistrationSchedule.ts \
  src/__tests__/lib/register/canProposeRegistrationSchedule.test.ts \
  src/lib/register/notifyRegistrationScheduleOffer.ts \
  src/__tests__/lib/register/notifyRegistrationScheduleOffer.test.ts \
  src/lib/register/proposeRegistrationScheduleCore.ts \
  src/__tests__/lib/register/proposeRegistrationScheduleCore.test.ts \
  src/lib/email/templates/registryRegistration.ts \
  src/__tests__/lib/email/registryRegistration.test.ts \
  src/dictionaries/en.json src/dictionaries/es.json src/dictionaries/pt.json
git commit -m "$(cat <<'EOF'
feat: propose an open schedule and email the family

EOF
)"
```

---

### Task 4: Admin action + Propose UI (Assign unchanged)

**Files:**
- Create: `src/app/[locale]/dashboard/admin/registrations/proposeRegistrationScheduleAction.ts`
- Create: `src/__tests__/app/proposeRegistrationScheduleAction.test.ts`
- Create: `src/components/dashboard/AdminRegistrationProposeSchedule.tsx`
- Modify: `src/components/dashboard/AdminRegistrationIntakeActions.tsx` — render propose extract; **do not** ask join disposition for Propose
- Modify: `src/app/[locale]/dashboard/admin/registrations/registrationIntakeActions.ts` — Assign update also sets `proposed_section_id: null`
- Modify: `src/__tests__/app/registrationIntakeActions.test.ts` — assign from `offer_pending` clears proposal
- Modify: `src/lib/register/finalizeAcceptedRegistrationLead.ts` — include `proposed_section_id: null` on the registrations update (`write` object)

**Interfaces:**
- Consumes: `proposeRegistrationScheduleCore`, `canProposeRegistrationSchedule`
- Produces: `proposeRegistrationScheduleAction({ locale, registrationId, sectionId })` → `IntakeActionResult`

Propose select options: `sections.filter(s => s.activeCount < s.maxStudents && s.id !== row.preferred_section_id)`.

Show Propose when `canProposeRegistrationSchedule({ ..., openAlternativeCount: options.length })`.

Assign button stays as today (still requires join disposition). Re-propose allowed on `offer_pending`.

- [ ] **Step 1: Write the failing tests**

`proposeRegistrationScheduleAction.test.ts` — same auth mocks as `registrationIntakeActions.test.ts`:

1. Forbidden when `assertAdmin` throws → `{ ok: false, code: "forbidden" }`
2. Delegates to core with the admin client and returns `{ ok: true }`
3. Surfaces `section_full` from core

`registrationIntakeActions.test.ts` — assign success path (mock `buildRegistrationEnrollmentFeeInsertFields` if the existing test does not already cover the update payload):

```ts
it("clears proposed_section_id when assigning during offer_pending", async () => {
  let updated: Record<string, unknown> | undefined;
  // lead intake_state offer_pending, fee_captured false, open seat
  // expect updated.proposed_section_id === null
  // expect updated.preferred_section_id === SEC_ID
});
```

If `buildRegistrationEnrollmentFeeInsertFields` is not mocked, mock it to return `{ fee_snapshot: { total: 10, currency: "CLP" }, intake_state: "awaiting_fee", pay_token: "tok" }` like other register tests.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/app/proposeRegistrationScheduleAction.test.ts src/__tests__/app/registrationIntakeActions.test.ts`

Expected: FAIL.

- [ ] **Step 3: Minimal implementation**

`proposeRegistrationScheduleAction.ts` — `requireRegistrationIntakeAdmin`, `createAdminClient`, `getDictionary`, `proposeRegistrationScheduleCore`, `revalidateRegistrationInbox`. Keep this file under ~80 lines.

`AdminRegistrationProposeSchedule.tsx` — local `useState` for the proposed id; calls `proposeRegistrationScheduleAction`; shows `labels.proposeSchedule` / `proposeScheduleCta` / `sectionFullError`.

`AdminRegistrationIntakeActions.tsx` — after the assign block, render:

```tsx
<AdminRegistrationProposeSchedule
  locale={locale}
  row={row}
  labels={labels}
  sections={sections}
  busy={busy}
  onBusy={onBusy}
  onDone={onDone}
/>
```

Do **not** put join-billing above Propose only. Leave `AdminRegistrationJoinBillingFields` where Assign/waive/receipt need it.

Assign update:

```ts
.update({
  preferred_section_id: input.sectionId,
  additional_section_ids: additional,
  fee_snapshot: quoted.fee_snapshot,
  intake_state: lead.fee_captured ? "needs_section" : quoted.intake_state,
  proposed_section_id: null,
})
```

`finalizeAcceptedRegistrationLead.ts` — spread `proposed_section_id: null` onto `write` before `.update(write)`.

Wire `proposedSectionName` into `formatRegistrationIntakeLabel` from `AdminRegistrationIntakeActions` / table if still missing: `sections.find(s => s.id === row.proposedSectionId)?.name`.

- [ ] **Step 4: Run tests to verify they pass**

Same vitest command. Expected: PASS.

Confirm `AdminRegistrationIntakeActions.tsx` and `registrationIntakeActions.ts` stay ≤ 250 lines (`wc -l`).

- [ ] **Step 5: Commit**

```bash
git add src/app/[locale]/dashboard/admin/registrations/proposeRegistrationScheduleAction.ts \
  src/__tests__/app/proposeRegistrationScheduleAction.test.ts \
  src/components/dashboard/AdminRegistrationProposeSchedule.tsx \
  src/components/dashboard/AdminRegistrationIntakeActions.tsx \
  src/app/[locale]/dashboard/admin/registrations/registrationIntakeActions.ts \
  src/__tests__/app/registrationIntakeActions.test.ts \
  src/lib/register/finalizeAcceptedRegistrationLead.ts
git commit -m "$(cat <<'EOF'
feat: admin propose-schedule action beside assign

EOF
)"
```

---

### Task 5: Switch-from-offer + stale offer + pay-page kind

**Files:**
- Modify: `src/lib/register/loadRegistrationPayLeadByToken.ts` — select + return `proposedSectionId`
- Modify: `src/lib/register/switchRegistrationPaySectionCore.ts`
- Modify: `src/__tests__/lib/register/switchRegistrationPaySectionCore.test.ts`
- Modify: `src/lib/register/registrationPayPageKind.ts`
- Modify: `src/__tests__/lib/register/registrationPayPageKind.test.ts`
- Modify: `src/lib/register/startRegistrationEnrollmentGatewayCore.ts` — reject `intakeState === "offer_pending"` as `section_full` (no charge until confirmed)
- Modify: `src/lib/register/uploadRegistrationEnrollmentReceiptCore.ts` — same reject if it currently allows pay on a full preferred section
- Modify: `src/lib/register/loadRegistrationMatriculaPayPage.ts` — persist stale offer; filter alternatives

**Interfaces:**
- Consumes: `proposedSectionId` on pay context / pay lead
- Produces: `RegistrationPayPageKind` includes `"offer"`; successful switch writes `proposed_section_id: null` and rebuilds join package via existing `buildRegistrationEnrollmentFeeInsertFields`; failed accept of the **proposal** persists `{ intake_state: "section_full", proposed_section_id: null }`

`registrationPayPageKind` order (critical):

1. `status === "enrolled"` → `enrolled`
2. `intakeState === "offer_pending"` and `proposedIsFull !== true` and `hasProposed` → `offer`
3. `intakeState === "offer_pending"` and (`proposedIsFull` or no proposed id) → `section_full`
4. existing `needs_section` / `sectionIsFull` / pay branches

`sectionIsFull` of the **original** request must **not** win over a live offer. Add optional `hasProposed?: boolean` and `proposedIsFull?: boolean` to the kind input.

- [ ] **Step 1: Write the failing tests**

`registrationPayPageKind.test.ts`:

```ts
it("returns offer while a proposal is live even if the original section is full", () => {
  expect(
    registrationPayPageKind({
      ...base,
      intakeState: "offer_pending",
      sectionIsFull: true,
      hasProposed: true,
      proposedIsFull: false,
    }),
  ).toBe("offer");
});

it("returns section_full when the proposal itself has no seat", () => {
  expect(
    registrationPayPageKind({
      ...base,
      intakeState: "offer_pending",
      sectionIsFull: true,
      hasProposed: true,
      proposedIsFull: true,
    }),
  ).toBe("section_full");
});
```

`switchRegistrationPaySectionCore.test.ts`:

```ts
it("clears proposed_section_id and rebuilds the join package", async () => {
  const admin = mockAdmin({
    row: lead({
      intake_state: "offer_pending",
      preferred_section_id: "sec-full",
      proposed_section_id: "sec-open",
    }),
  });
  // extend mockAdmin select to return proposed_section_id
  const result = await switchRegistrationPaySectionCore({
    admin, payToken: "tok", sectionId: NEW_SEC, nowIso: "2026-09-01T12:00:00.000Z",
  });
  expect(result.ok).toBe(true);
  expect(admin.updated.values).toMatchObject({
    preferred_section_id: NEW_SEC,
    proposed_section_id: null,
    intake_state: "awaiting_fee",
  });
});

it("persists section_full and clears the proposal when the offered section filled", async () => {
  const admin = mockAdmin({
    seatOpen: false,
    row: lead({
      intake_state: "offer_pending",
      preferred_section_id: "sec-full",
      proposed_section_id: NEW_SEC,
    }),
  });
  const result = await switchRegistrationPaySectionCore({
    admin, payToken: "tok", sectionId: NEW_SEC, nowIso: "2026-09-01T12:00:00.000Z",
  });
  expect(result).toEqual({ ok: false, code: "section_full" });
  expect(admin.updated.values).toEqual({
    intake_state: "section_full",
    proposed_section_id: null,
  });
});
```

Extend `loadRegistrationPayLeadByToken` mock rows in this test file: the select string must include `proposed_section_id` and the mapper must set `proposedSectionId`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/lib/register/registrationPayPageKind.test.ts src/__tests__/lib/register/switchRegistrationPaySectionCore.test.ts`

Expected: FAIL.

- [ ] **Step 3: Minimal implementation**

`loadRegistrationPayLeadByToken.ts` — add `proposed_section_id` to select; add `proposedSectionId: string | null` to `RegistrationPayLead`.

`switchRegistrationPaySectionCore.ts`:

```ts
if (!open) {
  if (
    lead.intakeState === "offer_pending" &&
    lead.proposedSectionId &&
    lead.proposedSectionId === sectionId
  ) {
    const { error } = await input.admin
      .from("registrations")
      .update({ intake_state: "section_full", proposed_section_id: null })
      .eq("id", lead.id);
    if (error) return { ok: false, code: "update_failed" };
  }
  return { ok: false, code: "section_full" };
}
```

On success, add `proposed_section_id: null` to the existing update (keep snapshot rebuild).

`registrationPayPageKind.ts` — insert the `offer` / dead-offer branches **before** `sectionIsFull`.

`loadRegistrationMatriculaPayPage.ts` after parsing context:

```ts
if (context.intakeState === "offer_pending" && context.proposedSectionId) {
  const proposedOpen = await requestedSectionsHaveOpenSeats(supabase, [
    context.proposedSectionId,
  ]);
  if (!proposedOpen) {
    await admin.from("registrations").update({
      intake_state: "section_full",
      proposed_section_id: null,
    }).eq("pay_token", token);
    context = { ...context, intakeState: "section_full", proposedSectionId: null };
  }
}
```

Load `proposedSectionLabel` via `registration_public_section_label` when `proposedSectionId` is set. Return it on the page data type.

Alternatives:

```ts
const hide = new Set(requested);
if (context.proposedSectionId) hide.add(context.proposedSectionId);
const alternatives = options.filter((row) => !hide.has(row.id));
```

When `intakeState === "offer_pending"` and the proposal is live, `sectionIsFull` for the **original** may stay `true` (requested seats). Kind uses `hasProposed` / `proposedIsFull`, not that flag.

`startRegistrationEnrollmentGatewayCore.ts` after load:

```ts
if (lead.intakeState === "offer_pending") return { ok: false, code: "section_full" };
```

Same for receipt upload if it would otherwise charge the original full section.

- [ ] **Step 4: Run tests to verify they pass**

Same vitest command. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/register/loadRegistrationPayLeadByToken.ts \
  src/lib/register/switchRegistrationPaySectionCore.ts \
  src/__tests__/lib/register/switchRegistrationPaySectionCore.test.ts \
  src/lib/register/registrationPayPageKind.ts \
  src/__tests__/lib/register/registrationPayPageKind.test.ts \
  src/lib/register/startRegistrationEnrollmentGatewayCore.ts \
  src/lib/register/uploadRegistrationEnrollmentReceiptCore.ts \
  src/lib/register/loadRegistrationMatriculaPayPage.ts
git commit -m "$(cat <<'EOF'
feat: confirm schedule offer by switching the pay section

EOF
)"
```

---

### Task 6: Family `/matricula` offer UI

**Files:**
- Modify: `src/components/register/RegistrationMatriculaPayScreen.tsx`
- Modify: `src/__tests__/components/register/RegistrationMatriculaPayScreen.test.tsx`
- Modify: `src/app/[locale]/matricula/[token]/page.tsx`
- Modify: `src/dictionaries/en.json`, `es.json`, `pt.json` (`register.*` keys)
- Modify: `src/components/register/RegistrationMatriculaPayActions.tsx` — optional `acceptOffer` button that calls `switchRegistrationPaySectionAction(locale, token, proposedSectionId)`

**Interfaces:**
- Consumes: kind `"offer"`; `context.proposedSectionId`; page `proposedSectionLabel`
- Produces: offer copy + **Aceptar este horario**; alternatives still `showSwitch`; `showPay === false` until kind is `pay`

Copy (`register`):

| Key | en | es | pt |
|-----|----|----|-----|
| `enrollmentPayOfferLead` | {{original}} filled up. We can offer **{{proposed}}** ({{schedule}}). Do you want it? | El horario de {{original}} se llenó. Te proponemos **{{proposed}}** ({{schedule}}). ¿Lo tomás? | O horário de {{original}} lotou. Propomos **{{proposed}}** ({{schedule}}). Topa? |
| `enrollmentPayOfferAccept` | Accept this schedule | Aceptar este horario | Aceitar este horário |
| `enrollmentPayOfferGone` | That offer filled too. Pick another open schedule. | Esa propuesta también se llenó, elegí otro. | Essa proposta também lotou. Escolhe outro. |

Use the existing `enrollmentPayFull` for generic full (no offer). When kind is `section_full` **after** a dead offer, `leadCopy` can be `enrollmentPayOfferGone` if `labels.offerGone` is passed; otherwise `enrollmentPayFull` is acceptable if the alternatives list is visible.

- [ ] **Step 1: Write the failing screen test**

Extend `RegistrationMatriculaPayLabels` in the test with `offerLead`, `offerAccept`, `offerGone`.

```tsx
it("shows the offer and hides pay methods until they accept", () => {
  render(
    <RegistrationMatriculaPayScreen
      locale="es"
      studentName="Ana Pérez"
      sectionLabel="A2 Mañana"
      proposedSectionLabel="B1 Tarde"
      context={{
        ...base,
        intakeState: "offer_pending",
        preferredSectionId: "sec-1",
        proposedSectionId: "sec-2",
      }}
      sectionIsFull={true}
      labels={{ ...labels, offerLead: "El horario de {{original}} se llenó. Te proponemos {{proposed}}.", offerAccept: "Aceptar este horario", offerGone: "esa propuesta también se llenó" }}
      payUi={{
        token: "tok",
        methods: ["flow"],
        transferInstructions: null,
        alternatives: [{ id: "sec-3", label: "C1 Noche" }],
        whatsappUrl: "",
        contactEmail: "",
        actionLabels: { flow: "Flow", mercadoPago: "MP", transfer: "T", transferHint: "", uploadButton: "Enviar", pickSection: "Elegí", error: "Error", receiptOk: "Ok", acceptOffer: "Aceptar este horario" },
      }}
    />,
  );
  expect(screen.getByText(/Te proponemos B1 Tarde/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Aceptar este horario" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Flow" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: /C1 Noche/ })).toBeInTheDocument();
});
```

Adjust the alternatives button matcher to whatever `RegistrationMatriculaPayActions` already renders (section label text).

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/__tests__/components/register/RegistrationMatriculaPayScreen.test.tsx`

Expected: FAIL.

- [ ] **Step 3: Minimal implementation**

`registrationPayPageKind` already returns `"offer"`. In the screen:

```ts
const showPay = kind === "pay";
const showSwitch =
  kind === "section_full" ||
  kind === "captured_full" ||
  kind === "no_fee" ||
  kind === "offer";
```

For `kind === "offer"`, `leadCopy` interpolates `labels.offerLead` with `original = sectionLabel`, `proposed = proposedSectionLabel`, `schedule = proposedSectionLabel` (same string is fine; we do not have a separate weekly schedule helper on this page).

Pass `proposedSectionId` + `acceptOffer` into `RegistrationMatriculaPayActions`. Add a primary button **above** the alternatives list:

```ts
onClick={() => run(() => switchRegistrationPaySectionAction(locale, token, proposedSectionId))}
```

That is the same core as picking another id (Task 5). Enrolled + `fee_captured` still goes through `needsAccept` in `matriculaPayActions.ts` — no change.

`page.tsx` — pass `proposedSectionLabel` and the new label strings from `dict.register`.

Already enrolled: existing `alreadyIn` branch, no offer UI (`kind === "enrolled"` first).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/components/register/RegistrationMatriculaPayScreen.test.tsx src/__tests__/lib/register/registrationPayPageKind.test.ts src/__tests__/lib/register/switchRegistrationPaySectionCore.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/register/RegistrationMatriculaPayScreen.tsx \
  src/__tests__/components/register/RegistrationMatriculaPayScreen.test.tsx \
  src/components/register/RegistrationMatriculaPayActions.tsx \
  src/app/[locale]/matricula/\[token\]/page.tsx \
  src/dictionaries/en.json src/dictionaries/es.json src/dictionaries/pt.json
git commit -m "$(cat <<'EOF'
feat: show schedule offer on public matricula page

EOF
)"
```

---

### Task 7: Spec + remaining wiring check

**Files:**
- `docs/superpowers/specs/2026-09-01-registration-schedule-offer-design.md` (already on disk; include if uncommitted)
- `docs/superpowers/plans/2026-09-01-registration-schedule-offer.md`

**Interfaces:** none new.

- [ ] **Step 1: Grep the spec Done-when list against the tree**

Confirm all six Done-when items from the spec have code + a test:

1. Admin can propose; mail key exists; `/matricula` offer + alternatives
2. Accept / pick another → join package (`switch` rebuilds snapshot; `needsAccept` still enrols)
3. Inbox filter **Esperando respuesta**; re-propose + assign
4. Dead offer → `section_full` + null proposal (switch + load page)
5. Assign still present (`primaryKind === "assign"`)
6. Isolated tests listed above
7. Playwright Task 8 green on the isolated stack

- [ ] **Step 2: Run the focused suite**

```bash
npx vitest run \
  src/__tests__/lib/register/registrationIntake.test.ts \
  src/__tests__/lib/register/parseRegistrationPayContext.test.ts \
  src/__tests__/lib/register/canStartRegistrationEnrollmentFeeFlow.test.ts \
  src/__tests__/db/registration_schedule_offer_migration.test.ts \
  src/__tests__/lib/register/registrationInboxFilter.test.ts \
  src/__tests__/lib/register/countRegistrationInboxFilters.test.ts \
  src/__tests__/lib/register/registrationInboxPrimaryKind.test.ts \
  src/__tests__/lib/register/formatRegistrationIntakeLabel.test.ts \
  src/__tests__/components/dashboard/RegistrationListToolbar.test.tsx \
  src/__tests__/lib/register/canProposeRegistrationSchedule.test.ts \
  src/__tests__/lib/register/proposeRegistrationScheduleCore.test.ts \
  src/__tests__/lib/email/registryRegistration.test.ts \
  src/__tests__/app/proposeRegistrationScheduleAction.test.ts \
  src/__tests__/app/registrationIntakeActions.test.ts \
  src/__tests__/lib/register/registrationPayPageKind.test.ts \
  src/__tests__/lib/register/switchRegistrationPaySectionCore.test.ts \
  src/__tests__/components/register/RegistrationMatriculaPayScreen.test.tsx
```

Expected: all PASS.

- [ ] **Step 3: Line-ceiling check**

`wc -l` on every file this plan created or substantially edited. Split if any file exceeds 250.

- [ ] **Step 4: Commit docs if they are not already in HEAD**

```bash
git add docs/superpowers/specs/2026-09-01-registration-schedule-offer-design.md \
  docs/superpowers/plans/2026-09-01-registration-schedule-offer.md
git commit -m "$(cat <<'EOF'
docs: registration schedule-offer spec and plan

EOF
)"
```

Skip if the pre-commit hook is the full lint/build/e2e suite and an unrelated file (e.g. `progress/page.tsx` null `profile`) would fail the hook. Do not “fix” that file in this commit.

---

### Task 8: Playwright — schedule offer journeys

**Files:**
- Modify: `supabase/seeds/e2e/seed-admin.sql` — add `E2E Section Tiny` (`max_students = 1`, `enrollment_fee_amount = 15000`); set `E2E Section B.enrollment_fee_amount = 15000` on insert/update. **Do not** change Section A fee or cupo.
- Create: `e2e/helpers/extractMatriculaUrl.ts`
- Create: `e2e/critical-registration-schedule-offer.spec.ts`
- Modify: `docs/runbooks/e2e-isolated-harness.md` — list Tiny + B fee in the seed table

**Interfaces:**
- Consumes: propose UI + `/matricula` offer from Tasks 3–6; `RecordingEmailProvider` + `/api/e2e/recorded-emails`
- Produces: four browser journeys on project `chromium-critical-registration` (glob `critical-registration.*` — no new Playwright project)

`extractMatriculaUrl.ts`:

```ts
import { decodeHtmlHref } from "./recordedEmails";

export function extractMatriculaUrlFromHtml(html: string): string | null {
  const decoded = decodeHtmlHref(html);
  const hrefs = [...decoded.matchAll(/href=["']([^"']+)["']/gi)].map((m) => m[1]!);
  return hrefs.find((h) => /\/matricula\/[a-z0-9]+/i.test(h)) ?? null;
}
```

Seed snippet (idempotent, same style as Section B):

```sql
-- After Section B upsert:
INSERT INTO public.academic_sections (
  cohort_id, name, teacher_id, schedule_slots,
  starts_on, ends_on, enrollment_fee_amount, monthly_fee_charge_mode,
  allow_advance_monthly_payment, max_students
)
SELECT
  v_cohort, 'E2E Section Tiny', v_teacher,
  '[{"dayOfWeek":3,"startTime":"10:00","endTime":"11:00"}]'::jsonb,
  make_date(v_year, 1, 1), make_date(v_year, 12, 31),
  15000, 'full_month_fee', true, 1
WHERE NOT EXISTS (
  SELECT 1 FROM public.academic_sections
  WHERE cohort_id = v_cohort AND name = 'E2E Section Tiny'
);

UPDATE public.academic_sections
SET max_students = 1, enrollment_fee_amount = 15000, archived_at = NULL
WHERE cohort_id = v_cohort AND name = 'E2E Section Tiny';

UPDATE public.academic_sections
SET enrollment_fee_amount = 15000
WHERE cohort_id = v_cohort AND name = 'E2E Section B';
```

Do **not** set a fee on Section A.

- [ ] **Step 1: Write the failing spec**

`e2e/critical-registration-schedule-offer.spec.ts` — same `beforeEach` isolation guards as `critical-registration.spec.ts`. `test.setTimeout(180_000)`.

Shared setup helper in the same file (keep the file under 250 lines; if it grows, move setup to `e2e/helpers/scheduleOffer.ts`):

1. `clearRecordedEmails(request)`
2. Anon `gotoIsolated(/${locale}/register)` → fill adult lead (same fields as `critical-registration`) → `chooseRegisterSectionByName(/E2E Section Tiny/i)` → submit → success dialog
3. Admin context: enroll `e2e-student-b` into Tiny (reuse the enroll UI path from `critical-section-enroll.spec.ts`, or academic section page “Inscribir”). Tiny now has 1/1.
4. Admin registrations: find row by DNI → expect Sección llena (or expand and see it)
5. Expand → select B in Proponer → click Proponer
6. `fetchRecordedEmails` → last mail to the family email contains `/matricula/`

Test **Propose → mail → accept:**

```ts
test("admin proposes an open schedule; family accepts on /matricula", async ({ browser, request }) => {
  // setup through propose
  const payUrl = extractMatriculaUrlFromHtml(offerMail.html);
  expect(payUrl).toBeTruthy();
  const family = await browser.newContext();
  const page = await family.newPage();
  await page.goto(new URL(payUrl!, isolation.baseURL).pathname);
  await expect(page.getByRole("button", { name: /Aceptar este horario|Accept this schedule/i })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: /Pagar con Flow|Pagar con Mercado Pago/i })).toHaveCount(0);
  await page.getByRole("button", { name: /Aceptar este horario|Accept this schedule/i }).click();
  await expect(page.getByText(/Pago de ingreso|Pay enrollment|CLP|15000/i)).toBeVisible({ timeout: 30_000 });
  await family.close();
});
```

Test **Assign still works:** after propose, admin Asignar B + `chooseJoinBillingCurrent` → family token shows already-in **or** pay without the offer heading (no “Aceptar este horario”).

Test **Dead offer:** after propose, enroll a second throwaway (or raise Tiny-style fill on B: set B `max_students = 1` only inside this test via admin section edit, enroll student-b onto B if not already on Tiny — **do not** leave B at max=1 in seed). Prefer: in this test only, admin edits Section B max to 1 and enrolls another fixture so B is full, then family clicks accept → copy `/esa propuesta también se llenó|That offer filled/i`. Restore is the next precommit reseed.

If editing max in UI is brittle, skip journey 4 in v1 only when the edit control is missing — **do not skip** journeys 1 and 3.

- [ ] **Step 2: Run the spec to verify it fails**

```bash
npm run test:e2e:precommit -- --project=setup --project=chromium-critical-registration
```

Expected: FAIL — Tiny missing and/or Proponer / offer UI not in the product yet (if running this task after Tasks 1–6, fail only on Tiny/mail until seed + spec land).

- [ ] **Step 3: Seed + helper + make journeys pass**

Apply the seed SQL. Implement `extractMatriculaUrlFromHtml`. Adjust selectors to dictionary strings (`es.admin.registrations.intake.proposeScheduleCta`, `es.register.enrollmentPayOfferAccept`). Document Tiny in the runbook seed list.

- [ ] **Step 4: Re-run**

Same Playwright command. Expected: the four (or three + documented skip) journeys PASS. Existing `critical-registration.spec.ts` still PASSes (Section A unchanged).

- [ ] **Step 5: Commit**

```bash
git add supabase/seeds/e2e/seed-admin.sql \
  e2e/helpers/extractMatriculaUrl.ts \
  e2e/critical-registration-schedule-offer.spec.ts \
  docs/runbooks/e2e-isolated-harness.md
git commit -m "$(cat <<'EOF'
test: e2e schedule offer from full section to matricula

EOF
)"
```

---

## Self-review

**Spec coverage**

| Spec | Task |
|------|------|
| Propose + Assign coexist; Propose only when requested full / re-propose | 3, 4 |
| Same `/matricula`; offer on top; hide pay | 5, 6 |
| Confirm rebuilds join package; `$0` / `fee_captured` via existing switch + accept | 5, 6 |
| `offer_pending` + filter; not urgent | 1, 2 |
| `proposed_section_id`; do not overwrite preferred until confirm/assign | 1, 3, 4, 5 |
| Re-propose overwrites + resends mail | 3 |
| Offer also full → `section_full`, clear proposal | 5 |
| Mail `registration.schedule_offer`; no admin mail | 3 |
| Assign clears proposal; accept write clears proposal | 4 |
| Errors: same/full reject; mail fail keeps write; unknown token unchanged | 3, 5 |
| Isolated tests | 1–6 |
| Playwright propose / accept / assign / dead offer | 8 |
| Home card | skipped (optional) |
| Trial | skipped |

**Placeholder scan:** none.

**Type consistency:** `offer_pending`, `proposedSectionId` / `proposed_section_id`, kind `"offer"`, action codes `same_section` | `section_full` | `not_actionable`.
