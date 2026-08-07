# Registrations Contact + Lead Follow-up Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the student's and tutor's phone readable straight from the admin registrations table, with WhatsApp and copy actions, and turn the dead `contacted` status into a working lead follow-up flow.

**Architecture:** A new pure phone normalizer (`libphonenumber-js`, default country parsed from the institute's already-configured `contact.phone`) feeds a contact cell used by both the desktop table and the PWA list. The desktop table trades the email and birth-date columns for two phone columns, a status chip and an expandable detail row. A new server action sets `contacted`/`new` with an audit stamp, and a Postgres RPC supplies per-status counts for the toolbar filter.

**Tech Stack:** Next.js 16 App Router, React, Tailwind (CSS variables), Supabase Postgres + RLS, Zod, Vitest + React Testing Library, Playwright, `libphonenumber-js`.

**Spec:** `docs/superpowers/specs/2026-08-07-event-packages-registrations-contact-student-care-design.md` (§1.2, §3.5, §3.6, D8–D11)

## Global Constraints

- **Spec authority:** every decision here traces to the spec above. D8 (two phone columns, email + birth date to the expandable panel, minor marker), D9 (`libphonenumber-js`, country from `brand.contactPhone`, fail closed), D9b (retention adopts the same normalizer), D10 (`contacted_at` / `contacted_by`), D11 (edit and accept gates widen to `new` **or** `contacted`).
- **No user-visible literals in components.** Every string comes from `src/dictionaries/en.json` + `es.json` + `pt.json`, identical key shape. `Dictionary` derives from `en.json`, so a key missing there fails the build (rule `09-i18n-copy.mdc`).
- **Server-side authorization only.** Server actions call `assertAdmin()` before any mutation and never trust client checks (rule `04-security.mdc`).
- **Supabase only through the app's client factories** in `src/lib/supabase/` — `createAdminClient()` for admin mutations, `createClient()` for request-scoped reads (rule `12-supabase-app-boundaries.mdc`).
- **Bounded queries.** No `select("*")`; named columns and server-side pagination via `range` + `count` on the same filter (rule `13-postgrest-pagination-bounded-queries.mdc`).
- **List filter counts come from an RPC**, not from client-side counting (rule `24-dashboard-list-filter-aggregates-rpc.mdc`).
- **Post-mutation refresh:** `revalidatePath` on the server plus `router.refresh()` on the client (rule `27-post-mutation-ui-refresh.mdc`).
- **Structured error logging** with the `[ge:server]` helpers in `src/lib/logging/serverActionLog.ts`, stable `scope` strings, no PII or secrets in `meta` (rules `25-server-error-logging.mdc`, and phone numbers count as PII).
- **Migrations never destroy data** — additive only (rule `21-migrations-production-no-data-destruction.mdc`).
- **Buttons and CTA links carry a leading Lucide icon** plus an accessible name (rule `16-admin-buttons-icons.mdc`).
- **No `alert` / `confirm` / `prompt`** — use the repo's `Modal`, toasts and banners (rule `18-no-native-browser-dialogs.mdc`).
- **Files stay under 250 lines** (rule `03-architecture.mdc`); split by responsibility when a file grows.
- **Tests are self-contained** — every file under `src/__tests__/` runs alone with local mocks and no shared mutable state (rule `30-harness-self-contained-tests.mdc`).
- **Commands:** `npx vitest run <path>` for one file, `npm run lint`, `npx tsc --noEmit`.

---

### Task 1: Phone normalizer for WhatsApp

Replaces the repo's `digitsOnly` heuristic with a correct E.164 resolver. `buildAdminRetentionRows.ts` currently strips non-digits and requires ≥8 characters, which sends malformed Argentine numbers to `wa.me` (D9b).

**Files:**
- Modify: `package.json` (add `libphonenumber-js`)
- Create: `src/lib/whatsapp/resolveWhatsAppDigits.ts`
- Test: `src/__tests__/lib/whatsapp/resolveWhatsAppDigits.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `resolveWhatsAppCountry(institutePhone: string | null | undefined): CountryCode | null`
  - `resolveWhatsAppDigits(phone: string | null | undefined, country: CountryCode | null): string | null` — returns E.164 digits **without** the leading `+`, or `null` when the number cannot be resolved to a valid one.

- [ ] **Step 1: Install the dependency**

```bash
npm install libphonenumber-js
```

- [ ] **Step 2: Write the failing test**

Create `src/__tests__/lib/whatsapp/resolveWhatsAppDigits.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  resolveWhatsAppCountry,
  resolveWhatsAppDigits,
} from "@/lib/whatsapp/resolveWhatsAppDigits";

describe("resolveWhatsAppCountry", () => {
  it("reads the country from the institute phone in international form", () => {
    expect(resolveWhatsAppCountry("+54 9 362 470-8145")).toBe("AR");
    expect(resolveWhatsAppCountry("+56 2 2222 2222")).toBe("CL");
  });

  it("returns null when the institute phone has no country", () => {
    expect(resolveWhatsAppCountry("362 470-8145")).toBeNull();
    expect(resolveWhatsAppCountry("")).toBeNull();
    expect(resolveWhatsAppCountry(null)).toBeNull();
  });
});

describe("resolveWhatsAppDigits", () => {
  it("keeps an already-international number regardless of the default country", () => {
    expect(resolveWhatsAppDigits("+54 9 362 470-8145", "CL")).toBe("5493624708145");
  });

  it("normalizes a local Argentine number to the same digits as its international form", () => {
    const local = resolveWhatsAppDigits("0362 15 470-8145", "AR");
    const international = resolveWhatsAppDigits("+54 9 362 470-8145", "AR");
    expect(local).toBe(international);
  });

  it("returns null when there is no default country and the number is local", () => {
    expect(resolveWhatsAppDigits("362 470-8145", null)).toBeNull();
  });

  it("returns null for blank, junk or impossible numbers", () => {
    expect(resolveWhatsAppDigits("", "AR")).toBeNull();
    expect(resolveWhatsAppDigits(null, "AR")).toBeNull();
    expect(resolveWhatsAppDigits("no es un telefono", "AR")).toBeNull();
    expect(resolveWhatsAppDigits("123", "AR")).toBeNull();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/__tests__/lib/whatsapp/resolveWhatsAppDigits.test.ts`
Expected: FAIL — cannot resolve `@/lib/whatsapp/resolveWhatsAppDigits`.

- [ ] **Step 4: Write the implementation**

Create `src/lib/whatsapp/resolveWhatsAppDigits.ts`:

```ts
import parsePhoneNumberFromString, { type CountryCode } from "libphonenumber-js";

/**
 * Country used as the default when a family types a local number.
 * Read from the institute's own `contact.phone` (`brand.contactPhone`), which the
 * site-setup wizard already requires, so no extra setting is needed.
 */
export function resolveWhatsAppCountry(
  institutePhone: string | null | undefined,
): CountryCode | null {
  const raw = (institutePhone ?? "").trim();
  if (!raw.startsWith("+")) return null;
  const parsed = parsePhoneNumberFromString(raw);
  return parsed?.country ?? null;
}

/**
 * E.164 digits without the leading `+`, ready for `https://wa.me/<digits>`.
 * Returns null when the number cannot be resolved, so callers hide the action
 * instead of opening a chat with a wrong number.
 */
export function resolveWhatsAppDigits(
  phone: string | null | undefined,
  country: CountryCode | null,
): string | null {
  const raw = (phone ?? "").trim();
  if (!raw) return null;
  const parsed = raw.startsWith("+")
    ? parsePhoneNumberFromString(raw)
    : country
      ? parsePhoneNumberFromString(raw, country)
      : null;
  if (!parsed || !parsed.isValid()) return null;
  return parsed.number.replace(/^\+/, "");
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/__tests__/lib/whatsapp/resolveWhatsAppDigits.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/lib/whatsapp/resolveWhatsAppDigits.ts src/__tests__/lib/whatsapp/resolveWhatsAppDigits.test.ts
git commit -m "feat(whatsapp): resolve phone numbers to E.164 before building wa.me links"
```

---

### Task 2: Retention table adopts the normalizer

D9b. The retention table is the existing WhatsApp caller; it must stop sending raw digits.

**Files:**
- Modify: `src/lib/academics/buildAdminRetentionRows.ts:6-10` (replace the local `digitsOnly`)
- Modify: `src/lib/academics/loadAdminRetentionCandidates.ts` (pass the institute country through)
- Test: `src/__tests__/lib/academics/buildAdminRetentionRows.test.ts` (existing file if present, otherwise create)

**Interfaces:**
- Consumes: `resolveWhatsAppCountry`, `resolveWhatsAppDigits` from Task 1.
- Produces: no new exported names. `AdminRetentionCandidate.guardianPhoneDigits` keeps its type (`string | null`) but now always holds E.164 digits.

- [ ] **Step 1: Read the current callers**

Run: `rg -n "digitsOnly|guardianPhoneDigits|phoneDigits" src/lib/academics`
Note every construction site of `guardianPhoneDigits` — the tutor branch and the adult-self branch both build it.

- [ ] **Step 2: Write the failing test**

Add to `src/__tests__/lib/academics/buildAdminRetentionRows.test.ts` (create the file with this content if it does not exist; if it exists, append the `describe` block and keep the existing imports):

```ts
import { describe, expect, it } from "vitest";
import { buildAdminRetentionRows } from "@/lib/academics/buildAdminRetentionRows";

describe("buildAdminRetentionRows phone normalization", () => {
  it("stores E.164 digits for a local number using the institute country", () => {
    const rows = buildAdminRetentionRows({
      // Minimal fixture: one adult self-contact student with a local phone.
      // Mirror the argument shape of the real function as read in Step 1.
      instituteCountry: "AR",
      // ...remaining fixture fields copied from the existing test in this file
    } as never);

    expect(rows[0]?.guardianPhoneDigits).toBe("5493624708145");
  });
});
```

Note: the fixture fields must be copied from the existing test in this file so the call compiles. Do not invent a new argument shape — only the `instituteCountry` field is new.

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/__tests__/lib/academics/buildAdminRetentionRows.test.ts`
Expected: FAIL — either an unknown `instituteCountry` option, or the raw digits `03621547081 45`-style value instead of `5493624708145`.

- [ ] **Step 4: Replace `digitsOnly`**

In `src/lib/academics/buildAdminRetentionRows.ts`, delete lines 6-10 and add the import plus a country-aware helper. Accept `instituteCountry: CountryCode | null` on the function's existing params object and thread it into both branches:

```ts
import { resolveWhatsAppDigits } from "@/lib/whatsapp/resolveWhatsAppDigits";
import type { CountryCode } from "libphonenumber-js";

function digitsOnly(
  phone: string | null | undefined,
  country: CountryCode | null,
): string | null {
  return resolveWhatsAppDigits(phone, country);
}
```

Then update the two call sites found in Step 1 to pass `instituteCountry`.

- [ ] **Step 5: Pass the country from the loader**

In `src/lib/academics/loadAdminRetentionCandidates.ts`, read the brand and derive the country, then forward it to `buildAdminRetentionRows`:

```ts
import { resolveWhatsAppCountry } from "@/lib/whatsapp/resolveWhatsAppDigits";
import { getBrandForRequest } from "@/lib/brand/server";

// inside the loader, before building rows:
const brand = await getBrandForRequest();
const instituteCountry = resolveWhatsAppCountry(brand.contactPhone);
```

Confirm the exact brand accessor name with `rg -n "export async function get.*Brand" src/lib/brand/server.ts` and use what is actually exported.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run src/__tests__/lib/academics src/__tests__/app/recordRetentionWhatsappContactAction.test.ts`
Expected: PASS. If an existing retention test asserted raw digits, update that expectation to the normalized value and note it as a `REGRESSION CHECK` in the test file comment.

- [ ] **Step 7: Commit**

```bash
git add src/lib/academics src/__tests__/lib/academics
git commit -m "fix(retention): normalize phones before building WhatsApp links"
```

---

### Task 3: Migration 176 — contact tracking columns and status counts

**Files:**
- Create: `supabase/migrations/176_registrations_contact_tracking.sql`
- Test: `src/__tests__/supabase/registrationsContactTrackingMigration.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `registrations.contacted_at TIMESTAMPTZ`, `registrations.contacted_by UUID`, and the RPC `registrations_admin_list_aggregates(p_query TEXT)` returning one row with `total BIGINT`, `new_count BIGINT`, `contacted_count BIGINT`.

- [ ] **Step 1: Read an existing migration test for the assertion style**

Run: `cat src/__tests__/supabase/sectionContentPlanningMigration.test.ts`
These tests read the SQL file as text and assert on its contents. Follow that pattern exactly — do not connect to a database here.

- [ ] **Step 2: Write the failing test**

Create `src/__tests__/supabase/registrationsContactTrackingMigration.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(process.cwd(), "supabase/migrations/176_registrations_contact_tracking.sql"),
  "utf8",
);

describe("migration 176 registrations contact tracking", () => {
  it("adds the follow-up columns idempotently", () => {
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMPTZ/);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS contacted_by UUID/);
    expect(sql).toMatch(/REFERENCES public\.profiles \(id\) ON DELETE SET NULL/);
  });

  it("creates the status aggregates RPC granted to authenticated", () => {
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.registrations_admin_list_aggregates/);
    expect(sql).toMatch(/SECURITY DEFINER/);
    expect(sql).toMatch(/GRANT EXECUTE ON FUNCTION public\.registrations_admin_list_aggregates/);
  });

  it("excludes enrolled rows from the counts, matching the list loader", () => {
    expect(sql).toMatch(/status <> 'enrolled'/);
  });

  it("destroys no data", () => {
    expect(sql).not.toMatch(/\b(DROP TABLE|TRUNCATE|DELETE FROM)\b/i);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/__tests__/supabase/registrationsContactTrackingMigration.test.ts`
Expected: FAIL — `ENOENT` because the migration file does not exist.

- [ ] **Step 4: Write the migration**

Create `supabase/migrations/176_registrations_contact_tracking.sql`:

```sql
-- Lead follow-up on public registrations: who contacted the lead and when,
-- plus per-status counts for the admin list filter.
-- Spec: docs/superpowers/specs/2026-08-07-event-packages-registrations-contact-student-care-design.md

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contacted_by UUID NULL
    REFERENCES public.profiles (id) ON DELETE SET NULL;

COMMENT ON COLUMN public.registrations.contacted_at IS 'When the lead was last marked contacted; null while status is new.';
COMMENT ON COLUMN public.registrations.contacted_by IS 'Admin who marked the lead contacted; null while status is new.';

-- Status counts under the active search, so the admin filter chips show real
-- totals instead of counting the current page in the browser.
CREATE OR REPLACE FUNCTION public.registrations_admin_list_aggregates(
  p_query TEXT DEFAULT NULL
)
RETURNS TABLE (
  total BIGINT,
  new_count BIGINT,
  contacted_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH scoped AS (
    SELECT r.status
    FROM public.registrations r
    WHERE r.status <> 'enrolled'
      AND (
        p_query IS NULL
        OR btrim(p_query) = ''
        OR r.first_name ILIKE '%' || p_query || '%'
        OR r.last_name  ILIKE '%' || p_query || '%'
        OR r.dni        ILIKE '%' || p_query || '%'
        OR r.email      ILIKE '%' || p_query || '%'
        OR r.phone      ILIKE '%' || p_query || '%'
      )
  )
  SELECT
    count(*)::BIGINT AS total,
    count(*) FILTER (WHERE status = 'new')::BIGINT AS new_count,
    count(*) FILTER (WHERE status = 'contacted')::BIGINT AS contacted_count
  FROM scoped;
$$;

REVOKE ALL ON FUNCTION public.registrations_admin_list_aggregates(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registrations_admin_list_aggregates(TEXT) TO authenticated;
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/__tests__/supabase/registrationsContactTrackingMigration.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 6: Apply the migration locally and confirm it runs**

Run: `npx supabase db reset`
Expected: completes without error and lists `176_registrations_contact_tracking.sql` among applied migrations.

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations/176_registrations_contact_tracking.sql src/__tests__/supabase/registrationsContactTrackingMigration.test.ts
git commit -m "feat(registrations): add contact tracking columns and status aggregates RPC"
```

---

### Task 4: Contact resolver for a registration row

Turns a row into the two phones the table shows, resolving the minor case where `phone` is null and the real contact is the tutor.

**Files:**
- Create: `src/lib/register/resolveRegistrationContact.ts`
- Test: `src/__tests__/lib/register/resolveRegistrationContact.test.ts`

**Interfaces:**
- Consumes: `resolveWhatsAppDigits` from Task 1; `AdminRegistrationRow` from `@/types/adminRegistration`.
- Produces:

```ts
export interface RegistrationContactEntry {
  label: string | null;      // tutor name for the tutor entry, null for the student entry
  phoneDisplay: string;      // trimmed, as the family typed it
  whatsAppDigits: string | null; // null → hide the WhatsApp action
}
export interface RegistrationContactView {
  isMinor: boolean;
  student: RegistrationContactEntry | null;
  tutor: RegistrationContactEntry | null;
}
export function resolveRegistrationContact(
  row: AdminRegistrationRow,
  opts: { legalAgeMajority: number; country: CountryCode | null; today?: Date },
): RegistrationContactView;
```

- [ ] **Step 1: Check how the repo already computes minor status from a birth date**

Run: `rg -n "legalAgeMajority" src/components src/lib | head -20`
Reuse the existing age helper rather than writing new date math. If a shared helper exists (for example in `src/lib/brand/legalAge.ts` or a profile age module), import it; the test below assumes an age derived from `birth_date` compared against `legalAgeMajority`.

- [ ] **Step 2: Write the failing test**

Create `src/__tests__/lib/register/resolveRegistrationContact.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { resolveRegistrationContact } from "@/lib/register/resolveRegistrationContact";
import type { AdminRegistrationRow } from "@/types/adminRegistration";

const base: AdminRegistrationRow = {
  id: "11111111-1111-1111-1111-111111111111",
  first_name: "Ana",
  last_name: "Perez",
  dni: "40111222",
  email: "ana@example.com",
  phone: null,
  birth_date: null,
  level_interest: null,
  status: "new",
  created_at: "2026-08-01T10:00:00.000Z",
  tutor_name: null,
  tutor_dni: null,
  tutor_email: null,
  tutor_phone: null,
  tutor_relationship: null,
};

const opts = {
  legalAgeMajority: 18,
  country: "AR" as const,
  today: new Date("2026-08-07T12:00:00.000Z"),
};

describe("resolveRegistrationContact", () => {
  it("exposes the student phone for an adult", () => {
    const view = resolveRegistrationContact(
      { ...base, birth_date: "2000-01-01", phone: "+54 9 362 470-8145" },
      opts,
    );
    expect(view.isMinor).toBe(false);
    expect(view.student?.phoneDisplay).toBe("+54 9 362 470-8145");
    expect(view.student?.whatsAppDigits).toBe("5493624708145");
    expect(view.tutor).toBeNull();
  });

  it("exposes the tutor phone for a minor whose own phone is empty", () => {
    const view = resolveRegistrationContact(
      {
        ...base,
        birth_date: "2015-01-01",
        phone: null,
        tutor_name: "Marta Perez",
        tutor_phone: "+54 9 362 470-8145",
      },
      opts,
    );
    expect(view.isMinor).toBe(true);
    expect(view.student).toBeNull();
    expect(view.tutor?.label).toBe("Marta Perez");
    expect(view.tutor?.whatsAppDigits).toBe("5493624708145");
  });

  it("exposes both phones when the minor also has one", () => {
    const view = resolveRegistrationContact(
      {
        ...base,
        birth_date: "2015-01-01",
        phone: "+54 9 362 111-1111",
        tutor_phone: "+54 9 362 470-8145",
      },
      opts,
    );
    expect(view.student?.whatsAppDigits).toBe("5493621111111");
    expect(view.tutor?.whatsAppDigits).toBe("5493624708145");
  });

  it("keeps the display text but drops the WhatsApp action for an unusable number", () => {
    const view = resolveRegistrationContact(
      { ...base, birth_date: "2000-01-01", phone: "123" },
      opts,
    );
    expect(view.student?.phoneDisplay).toBe("123");
    expect(view.student?.whatsAppDigits).toBeNull();
  });

  it("returns no entries when nobody left a phone", () => {
    const view = resolveRegistrationContact({ ...base, birth_date: "2000-01-01" }, opts);
    expect(view.student).toBeNull();
    expect(view.tutor).toBeNull();
  });

  it("treats a missing birth date as adult so the student phone is not hidden", () => {
    const view = resolveRegistrationContact(
      { ...base, birth_date: null, phone: "+54 9 362 470-8145" },
      opts,
    );
    expect(view.isMinor).toBe(false);
    expect(view.student?.whatsAppDigits).toBe("5493624708145");
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/__tests__/lib/register/resolveRegistrationContact.test.ts`
Expected: FAIL — cannot resolve `@/lib/register/resolveRegistrationContact`.

- [ ] **Step 4: Write the implementation**

Create `src/lib/register/resolveRegistrationContact.ts`:

```ts
import type { CountryCode } from "libphonenumber-js";
import { resolveWhatsAppDigits } from "@/lib/whatsapp/resolveWhatsAppDigits";
import type { AdminRegistrationRow } from "@/types/adminRegistration";

export interface RegistrationContactEntry {
  label: string | null;
  phoneDisplay: string;
  whatsAppDigits: string | null;
}

export interface RegistrationContactView {
  isMinor: boolean;
  student: RegistrationContactEntry | null;
  tutor: RegistrationContactEntry | null;
}

export interface ResolveRegistrationContactOptions {
  legalAgeMajority: number;
  country: CountryCode | null;
  today?: Date;
}

function ageOn(birthDate: string, today: Date): number {
  const [y, m, d] = birthDate.split("-").map((p) => parseInt(p, 10));
  let age = today.getUTCFullYear() - y;
  const beforeBirthday =
    today.getUTCMonth() + 1 < m ||
    (today.getUTCMonth() + 1 === m && today.getUTCDate() < d);
  if (beforeBirthday) age -= 1;
  return age;
}

function toEntry(
  label: string | null,
  phone: string | null,
  country: CountryCode | null,
): RegistrationContactEntry | null {
  const display = (phone ?? "").trim();
  if (!display) return null;
  return {
    label,
    phoneDisplay: display,
    whatsAppDigits: resolveWhatsAppDigits(display, country),
  };
}

/**
 * Which phones the admin list shows for a registration. Minors arrive with an
 * empty `phone` and a tutor phone (the public form writes null for them), so the
 * tutor entry is the real contact; the synthetic email is not shown at all.
 */
export function resolveRegistrationContact(
  row: AdminRegistrationRow,
  opts: ResolveRegistrationContactOptions,
): RegistrationContactView {
  const today = opts.today ?? new Date();
  const isMinor =
    row.birth_date != null && ageOn(row.birth_date, today) < opts.legalAgeMajority;

  return {
    isMinor,
    student: toEntry(null, row.phone, opts.country),
    tutor: toEntry(row.tutor_name, row.tutor_phone, opts.country),
  };
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/__tests__/lib/register/resolveRegistrationContact.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 6: Commit**

```bash
git add src/lib/register/resolveRegistrationContact.ts src/__tests__/lib/register/resolveRegistrationContact.test.ts
git commit -m "feat(registrations): resolve student and tutor contact phones for the admin list"
```

---

### Task 5: Widen the edit and accept gates

D11, done before the status action exists so marking a lead contacted can never strand it. Today `AdminRegistrationTableRow.tsx:33` sets `canAccept = r.status === "new"` and `registrationDraftAction.ts:100` rejects anything but `'new'`.

**Files:**
- Create: `src/lib/register/registrationIsActionable.ts`
- Modify: `src/components/dashboard/AdminRegistrationTableRow.tsx:33`
- Modify: `src/app/[locale]/dashboard/admin/registrations/registrationDraftAction.ts:100-106`
- Test: `src/__tests__/lib/register/registrationIsActionable.test.ts`
- Test: `src/__tests__/app/registrationDraftAction.test.ts` (existing if present)

**Interfaces:**
- Consumes: nothing.
- Produces: `registrationIsActionable(status: string): boolean` — true for `'new'` and `'contacted'`.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/lib/register/registrationIsActionable.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { registrationIsActionable } from "@/lib/register/registrationIsActionable";

describe("registrationIsActionable", () => {
  it("allows new and contacted leads to be edited and accepted", () => {
    expect(registrationIsActionable("new")).toBe(true);
    expect(registrationIsActionable("contacted")).toBe(true);
  });

  it("blocks leads that are already enrolled or unknown", () => {
    expect(registrationIsActionable("enrolled")).toBe(false);
    expect(registrationIsActionable("")).toBe(false);
    expect(registrationIsActionable("something-else")).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/__tests__/lib/register/registrationIsActionable.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the helper**

Create `src/lib/register/registrationIsActionable.ts`:

```ts
/**
 * A lead stays editable and acceptable while it is still a lead. Marking it
 * contacted must not strand it, so both pending statuses qualify.
 */
export function registrationIsActionable(status: string): boolean {
  return status === "new" || status === "contacted";
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/__tests__/lib/register/registrationIsActionable.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Use it in the row**

In `src/components/dashboard/AdminRegistrationTableRow.tsx`, replace line 33 and add the import:

```tsx
import { registrationIsActionable } from "@/lib/register/registrationIsActionable";

// ...
  const canAccept = registrationIsActionable(r.status);
```

- [ ] **Step 6: Use it in the server action**

In `src/app/[locale]/dashboard/admin/registrations/registrationDraftAction.ts`, add the import and replace the status guard and the update filter (lines 100-106):

```ts
import { registrationIsActionable } from "@/lib/register/registrationIsActionable";

// ...
  if (!registrationIsActionable(row.status ?? "")) {
    return { ok: false, message: regUi.alreadyProcessed };
  }

  const { error } = await admin
    .from("registrations")
    .update(patch)
    .eq("id", registration_id)
    .in("status", ["new", "contacted"]);
```

- [ ] **Step 7: Add the regression test for a contacted lead**

Append to `src/__tests__/app/registrationDraftAction.test.ts` (create the file following the mocking style of a neighbouring action test such as `src/__tests__/app/adminPromotionsActions.test.ts` if it does not exist):

```ts
it("REGRESSION CHECK: still saves a lead that was already marked contacted", async () => {
  // Arrange the mocked select to return { id, status: "contacted" }.
  const res = await updateRegistrationDraft("es", validPayload);
  expect(res.ok).toBe(true);
});
```

- [ ] **Step 8: Run the tests**

Run: `npx vitest run src/__tests__/lib/register src/__tests__/app/registrationDraftAction.test.ts src/__tests__/dashboard/dashboardFormsCoverage.test.tsx`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/lib/register/registrationIsActionable.ts src/components/dashboard/AdminRegistrationTableRow.tsx src/app/[locale]/dashboard/admin/registrations/registrationDraftAction.ts src/__tests__
git commit -m "fix(registrations): keep contacted leads editable and acceptable"
```

---

### Task 6: Status action — mark contacted and revert

**Files:**
- Create: `src/app/[locale]/dashboard/admin/registrations/registrationStatusAction.ts`
- Modify: `src/app/[locale]/dashboard/admin/registrations/actions.ts` (re-export)
- Test: `src/__tests__/app/registrationStatusAction.test.ts`

**Interfaces:**
- Consumes: `registrationIsActionable` from Task 5.
- Produces:
  - `markRegistrationContacted(locale: string, registrationId: string): Promise<{ ok: boolean; message?: string }>`
  - `revertRegistrationToNew(locale: string, registrationId: string): Promise<{ ok: boolean; message?: string }>`

- [ ] **Step 1: Read the action conventions**

Run: `cat src/app/[locale]/dashboard/admin/registrations/deleteRegistrationAction.ts`
Copy its shape: `"use server"`, `assertAdmin()`, `createAdminClient()`, `logSupabaseClientError`, `recordSystemAudit`, `revalidatePath`, dictionary-sourced messages.

- [ ] **Step 2: Write the failing test**

Create `src/__tests__/app/registrationStatusAction.test.ts`, mirroring the mock setup of `deleteRegistrationAction`'s test:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const assertAdmin = vi.fn();
const update = vi.fn();
const eq = vi.fn();
const inFilter = vi.fn();
const recordSystemAudit = vi.fn();

vi.mock("@/lib/dashboard/assertAdmin", () => ({ assertAdmin }));
vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({ recordSystemAudit }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({ update, select: () => ({ eq: () => ({ maybeSingle: () => ({ data: { id: "r1", status: "new" }, error: null }) }) }) }),
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  assertAdmin.mockResolvedValue(undefined);
  inFilter.mockResolvedValue({ error: null });
  eq.mockReturnValue({ in: inFilter });
  update.mockReturnValue({ eq });
});

describe("markRegistrationContacted", () => {
  it("refuses when the caller is not an admin", async () => {
    assertAdmin.mockRejectedValue(new Error("nope"));
    const { markRegistrationContacted } = await import(
      "@/app/[locale]/dashboard/admin/registrations/registrationStatusAction"
    );
    const res = await markRegistrationContacted("es", "11111111-1111-1111-1111-111111111111");
    expect(res.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects a malformed id before touching the database", async () => {
    const { markRegistrationContacted } = await import(
      "@/app/[locale]/dashboard/admin/registrations/registrationStatusAction"
    );
    const res = await markRegistrationContacted("es", "not-a-uuid");
    expect(res.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("stamps the status, the timestamp and the author, and audits it", async () => {
    const { markRegistrationContacted } = await import(
      "@/app/[locale]/dashboard/admin/registrations/registrationStatusAction"
    );
    const res = await markRegistrationContacted("es", "11111111-1111-1111-1111-111111111111");
    expect(res.ok).toBe(true);
    const patch = update.mock.calls[0]?.[0];
    expect(patch.status).toBe("contacted");
    expect(patch.contacted_at).toBeTruthy();
    expect(recordSystemAudit).toHaveBeenCalled();
  });
});

describe("revertRegistrationToNew", () => {
  it("clears the follow-up stamps", async () => {
    const { revertRegistrationToNew } = await import(
      "@/app/[locale]/dashboard/admin/registrations/registrationStatusAction"
    );
    const res = await revertRegistrationToNew("es", "11111111-1111-1111-1111-111111111111");
    expect(res.ok).toBe(true);
    const patch = update.mock.calls[0]?.[0];
    expect(patch).toEqual({ status: "new", contacted_at: null, contacted_by: null });
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/__tests__/app/registrationStatusAction.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Write the action**

Create `src/app/[locale]/dashboard/admin/registrations/registrationStatusAction.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { logServerAuthzDenied, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { registrationIsActionable } from "@/lib/register/registrationIsActionable";

const idZ = z.string().uuid();

const PENDING_STATUSES = ["new", "contacted"] as const;

type StatusPatch =
  | { status: "contacted"; contacted_at: string; contacted_by: string | null }
  | { status: "new"; contacted_at: null; contacted_by: null };

async function applyStatus(
  locale: string,
  registrationId: string,
  buildPatch: (actorId: string | null) => StatusPatch,
  auditAction: string,
): Promise<{ ok: boolean; message?: string }> {
  const dict = await getDictionary(locale);
  const reg = dict.actionErrors.registrationDraft;
  const regUi = dict.admin.registrations;

  let actorId: string | null = null;
  try {
    const session = await assertAdmin();
    actorId = (session as { user?: { id?: string } } | undefined)?.user?.id ?? null;
  } catch {
    logServerAuthzDenied(auditAction);
    return { ok: false, message: reg.forbidden };
  }

  const parsedId = idZ.safeParse(registrationId);
  if (!parsedId.success) return { ok: false, message: reg.invalidData };

  const admin = createAdminClient();

  const { data: row, error: fetchErr } = await admin
    .from("registrations")
    .select("id,status")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (fetchErr) {
    logSupabaseClientError(`${auditAction}:select`, fetchErr, { registrationId: parsedId.data });
    return { ok: false, message: reg.notFound };
  }
  if (!row) return { ok: false, message: reg.notFound };
  if (!registrationIsActionable(row.status ?? "")) {
    return { ok: false, message: regUi.alreadyProcessed };
  }

  const patch = buildPatch(actorId);
  const { error } = await admin
    .from("registrations")
    .update(patch)
    .eq("id", parsedId.data)
    .in("status", [...PENDING_STATUSES]);

  if (error) {
    logSupabaseClientError(`${auditAction}:update`, error, { registrationId: parsedId.data });
    return { ok: false, message: reg.saveFailed };
  }

  void recordSystemAudit({
    action: auditAction,
    resourceType: "registration",
    resourceId: parsedId.data,
    payload: { status: patch.status },
  });

  revalidatePath(`/${locale}/dashboard/admin/registrations`, "page");
  return { ok: true };
}

export async function markRegistrationContacted(locale: string, registrationId: string) {
  return applyStatus(
    locale,
    registrationId,
    (actorId) => ({
      status: "contacted",
      contacted_at: new Date().toISOString(),
      contacted_by: actorId,
    }),
    "registration_marked_contacted",
  );
}

export async function revertRegistrationToNew(locale: string, registrationId: string) {
  return applyStatus(
    locale,
    registrationId,
    () => ({ status: "new", contacted_at: null, contacted_by: null }),
    "registration_reverted_to_new",
  );
}
```

Confirm what `assertAdmin()` returns with `cat src/lib/dashboard/assertAdmin.ts` and adjust the `actorId` extraction to its real shape — do not keep the defensive cast if the function already returns a typed session.

- [ ] **Step 5: Re-export from the barrel**

Append to `src/app/[locale]/dashboard/admin/registrations/actions.ts`:

```ts
export {
  markRegistrationContacted,
  revertRegistrationToNew,
} from "./registrationStatusAction";
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run src/__tests__/app/registrationStatusAction.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 7: Commit**

```bash
git add src/app/[locale]/dashboard/admin/registrations src/__tests__/app/registrationStatusAction.test.ts
git commit -m "feat(registrations): mark leads contacted and revert them"
```

---

### Task 7: Copy for the new UI

Done before the components so no component ever ships a literal.

**Files:**
- Modify: `src/dictionaries/en.json`
- Modify: `src/dictionaries/es.json`
- Modify: `src/dictionaries/pt.json`
- Test: existing dictionary parity test (find it with `rg -l "dictionaries" src/__tests__ | head`)

**Interfaces:**
- Consumes: nothing.
- Produces: keys under `admin.registrations` used by Tasks 8-11:
  `phoneStudent`, `phoneTutor`, `contactVia`, `contactCopy`, `contactCopied`, `contactWhatsApp`,
  `contactWhatsAppUnavailable`, `whatsAppMessage`, `minorMarker`, `expandRow`, `collapseRow`,
  `detailsTitle`, `preferredSection`, `markContacted`, `markContactedTip`, `revertToNew`,
  `revertToNewTip`, `contactedOn`, `contactedBy`, `statusFilterAll`, `statusFilterNew`,
  `statusFilterContacted`, `statusChangeSuccess`, `statusChangeError`, `exportButton`, `exportTip`.

- [ ] **Step 1: Locate the block to extend**

Run: `rg -n '"registrations"' src/dictionaries/en.json`
Add the new keys inside that object, keeping the file's existing alphabetical or grouped ordering.

- [ ] **Step 2: Add the English keys**

```json
"phoneStudent": "Student phone",
"phoneTutor": "Guardian phone",
"contactVia": "Contact",
"contactCopy": "Copy number",
"contactCopied": "Number copied",
"contactWhatsApp": "Open WhatsApp",
"contactWhatsAppUnavailable": "This number cannot be opened in WhatsApp; copy it and dial manually",
"whatsAppMessage": "Hello {name}, we are writing from {institute} about your enrolment enquiry.",
"minorMarker": "Minor",
"expandRow": "Show details",
"collapseRow": "Hide details",
"detailsTitle": "Enquiry details",
"preferredSection": "Preferred group",
"markContacted": "Mark contacted",
"markContactedTip": "Record that you already reached this family",
"revertToNew": "Mark as pending",
"revertToNewTip": "Send this lead back to the pending queue",
"contactedOn": "Contacted on {date}",
"contactedBy": "Contacted by {name}",
"statusFilterAll": "All ({{count}})",
"statusFilterNew": "Pending ({{count}})",
"statusFilterContacted": "Contacted ({{count}})",
"statusChangeSuccess": "Follow-up status updated",
"statusChangeError": "Could not update the follow-up status",
"exportButton": "Export",
"exportTip": "Download the filtered list as a spreadsheet"
```

- [ ] **Step 3: Add the Spanish keys**

```json
"phoneStudent": "Teléfono del alumno",
"phoneTutor": "Teléfono del tutor",
"contactVia": "Contacto",
"contactCopy": "Copiar número",
"contactCopied": "Número copiado",
"contactWhatsApp": "Abrir WhatsApp",
"contactWhatsAppUnavailable": "Este número no se puede abrir en WhatsApp; copialo y llamá a mano",
"whatsAppMessage": "Hola {name}, te escribimos de {institute} por tu consulta de inscripción.",
"minorMarker": "Menor",
"expandRow": "Ver detalle",
"collapseRow": "Ocultar detalle",
"detailsTitle": "Detalle de la consulta",
"preferredSection": "Grupo preferido",
"markContacted": "Marcar contactado",
"markContactedTip": "Registrar que ya te comunicaste con esta familia",
"revertToNew": "Marcar pendiente",
"revertToNewTip": "Devolver esta inscripción a la cola de pendientes",
"contactedOn": "Contactado el {date}",
"contactedBy": "Contactado por {name}",
"statusFilterAll": "Todas ({{count}})",
"statusFilterNew": "Pendientes ({{count}})",
"statusFilterContacted": "Contactadas ({{count}})",
"statusChangeSuccess": "Estado de seguimiento actualizado",
"statusChangeError": "No se pudo actualizar el estado de seguimiento",
"exportButton": "Exportar",
"exportTip": "Descargar el listado filtrado como planilla"
```

- [ ] **Step 4: Add the Portuguese keys**

```json
"phoneStudent": "Telefone do aluno",
"phoneTutor": "Telefone do responsável",
"contactVia": "Contato",
"contactCopy": "Copiar número",
"contactCopied": "Número copiado",
"contactWhatsApp": "Abrir WhatsApp",
"contactWhatsAppUnavailable": "Este número não pode ser aberto no WhatsApp; copie e ligue manualmente",
"whatsAppMessage": "Olá {name}, somos do {institute} e escrevemos sobre sua consulta de matrícula.",
"minorMarker": "Menor",
"expandRow": "Ver detalhes",
"collapseRow": "Ocultar detalhes",
"detailsTitle": "Detalhes da consulta",
"preferredSection": "Turma preferida",
"markContacted": "Marcar contatado",
"markContactedTip": "Registrar que você já falou com esta família",
"revertToNew": "Marcar pendente",
"revertToNewTip": "Devolver esta inscrição à fila de pendentes",
"contactedOn": "Contatado em {date}",
"contactedBy": "Contatado por {name}",
"statusFilterAll": "Todas ({{count}})",
"statusFilterNew": "Pendentes ({{count}})",
"statusFilterContacted": "Contatadas ({{count}})",
"statusChangeSuccess": "Status de acompanhamento atualizado",
"statusChangeError": "Não foi possível atualizar o status de acompanhamento",
"exportButton": "Exportar",
"exportTip": "Baixar a lista filtrada como planilha"
```

- [ ] **Step 5: Verify the three dictionaries stay in sync**

Run: `npx tsc --noEmit && npx vitest run src/__tests__ -t dictionar`
Expected: PASS. A key present in `en.json` but missing elsewhere must fail here; if the repo has no parity test, `tsc` still catches consumers of a missing `en.json` key.

- [ ] **Step 6: Commit**

```bash
git add src/dictionaries
git commit -m "feat(i18n): copy for registrations contact actions and lead follow-up"
```

---

### Task 8: Contact cell component

**Files:**
- Create: `src/components/dashboard/RegistrationContactCell.tsx`
- Test: `src/__tests__/dashboard/RegistrationContactCell.test.tsx`

**Interfaces:**
- Consumes: `RegistrationContactEntry` from Task 4; copy keys from Task 7.
- Produces: `<RegistrationContactCell entry={...} contactName={...} instituteName={...} labels={...} />` rendering the number, a WhatsApp link when `whatsAppDigits` is set, and a copy button.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/dashboard/RegistrationContactCell.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RegistrationContactCell } from "@/components/dashboard/RegistrationContactCell";

const labels = {
  emptyValue: "—",
  contactCopy: "Copiar número",
  contactWhatsApp: "Abrir WhatsApp",
  contactWhatsAppUnavailable: "No se puede abrir",
  whatsAppMessage: "Hola {name}, te escribimos de {institute}.",
} as never;

describe("RegistrationContactCell", () => {
  it("links to WhatsApp with the prefilled greeting when the number resolves", () => {
    render(
      <RegistrationContactCell
        entry={{ label: null, phoneDisplay: "+54 9 362 470-8145", whatsAppDigits: "5493624708145" }}
        contactName="Ana"
        instituteName="Mi Mundo"
        labels={labels}
      />,
    );
    const link = screen.getByRole("link", { name: "Abrir WhatsApp" });
    expect(link).toHaveAttribute(
      "href",
      `https://wa.me/5493624708145?text=${encodeURIComponent("Hola Ana, te escribimos de Mi Mundo.")}`,
    );
  });

  it("shows the number without a WhatsApp link when it cannot be resolved", () => {
    render(
      <RegistrationContactCell
        entry={{ label: null, phoneDisplay: "123", whatsAppDigits: null }}
        contactName="Ana"
        instituteName="Mi Mundo"
        labels={labels}
      />,
    );
    expect(screen.getByText("123")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Abrir WhatsApp" })).not.toBeInTheDocument();
  });

  it("renders the empty marker when there is no phone", () => {
    render(
      <RegistrationContactCell
        entry={null}
        contactName="Ana"
        instituteName="Mi Mundo"
        labels={labels}
      />,
    );
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/__tests__/dashboard/RegistrationContactCell.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the component**

Create `src/components/dashboard/RegistrationContactCell.tsx`:

```tsx
"use client";

import { Copy, MessageCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/atoms/Button";
import type { RegistrationContactEntry } from "@/lib/register/resolveRegistrationContact";
import type { Dictionary } from "@/types/i18n";

type RegLabels = Dictionary["admin"]["registrations"];

export interface RegistrationContactCellProps {
  entry: RegistrationContactEntry | null;
  contactName: string;
  instituteName: string;
  labels: RegLabels;
}

export function RegistrationContactCell({
  entry,
  contactName,
  instituteName,
  labels,
}: RegistrationContactCellProps) {
  const [copied, setCopied] = useState(false);

  if (!entry) {
    return <span className="text-[var(--color-muted-foreground)]">{labels.emptyValue}</span>;
  }

  const text = labels.whatsAppMessage
    .replaceAll("{name}", contactName)
    .replaceAll("{institute}", instituteName);
  const href = entry.whatsAppDigits
    ? `https://wa.me/${entry.whatsAppDigits}?text=${encodeURIComponent(text)}`
    : null;

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(entry.phoneDisplay);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="break-words">{entry.phoneDisplay}</span>
      <div className="flex items-center gap-1">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={labels.contactWhatsApp}
            title={labels.contactWhatsApp}
            className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
          >
            <MessageCircle className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          </a>
        ) : (
          <span
            className="text-xs text-[var(--color-muted-foreground)]"
            title={labels.contactWhatsAppUnavailable}
          >
            {labels.contactWhatsAppUnavailable}
          </span>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={labels.contactCopy}
          title={copied ? labels.contactCopied : labels.contactCopy}
          className="h-8 w-8 shrink-0 border border-[var(--color-border)] p-0"
          onClick={onCopy}
        >
          <Copy className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/__tests__/dashboard/RegistrationContactCell.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/RegistrationContactCell.tsx src/__tests__/dashboard/RegistrationContactCell.test.tsx
git commit -m "feat(registrations): contact cell with WhatsApp and copy actions"
```

---

### Task 9: Expandable detail row

**Files:**
- Create: `src/components/dashboard/AdminRegistrationExpandedDetails.tsx`
- Test: `src/__tests__/dashboard/AdminRegistrationExpandedDetails.test.tsx`

**Interfaces:**
- Consumes: `AdminRegistrationRow`; copy keys from Task 7.
- Produces: `<AdminRegistrationExpandedDetails row={...} colSpan={...} locale={...} labels={...} sectionName={...} />` rendering a `<tr>` with one `<td colSpan>`, showing email, birth date, the full tutor block, the preferred group and the follow-up stamp.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/dashboard/AdminRegistrationExpandedDetails.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminRegistrationExpandedDetails } from "@/components/dashboard/AdminRegistrationExpandedDetails";
import type { AdminRegistrationRow } from "@/types/adminRegistration";

const row: AdminRegistrationRow = {
  id: "r1",
  first_name: "Ana",
  last_name: "Perez",
  dni: "40111222",
  email: "ana@example.com",
  phone: null,
  birth_date: "2015-03-04",
  level_interest: null,
  status: "contacted",
  created_at: "2026-08-01T10:00:00.000Z",
  tutor_name: "Marta Perez",
  tutor_dni: "20111222",
  tutor_email: "marta@example.com",
  tutor_phone: "+54 9 362 470-8145",
  tutor_relationship: "Madre",
};

const labels = {
  email: "Email",
  birthDate: "Nacimiento",
  detailsTitle: "Detalle de la consulta",
  preferredSection: "Grupo preferido",
  emptyValue: "—",
  tutorName: "Tutor",
  tutorDni: "DNI del tutor",
  tutorEmail: "Email del tutor",
  tutorPhone: "Teléfono del tutor",
  tutorRelationship: "Vínculo",
} as never;

function renderInTable(ui: React.ReactNode) {
  return render(<table><tbody>{ui}</tbody></table>);
}

describe("AdminRegistrationExpandedDetails", () => {
  it("shows the email that no longer has its own column", () => {
    renderInTable(
      <AdminRegistrationExpandedDetails row={row} colSpan={9} locale="es" labels={labels} sectionName={null} />,
    );
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
  });

  it("shows the full guardian block", () => {
    renderInTable(
      <AdminRegistrationExpandedDetails row={row} colSpan={9} locale="es" labels={labels} sectionName={null} />,
    );
    expect(screen.getByText("Marta Perez")).toBeInTheDocument();
    expect(screen.getByText("marta@example.com")).toBeInTheDocument();
    expect(screen.getByText("Madre")).toBeInTheDocument();
  });

  it("spans the whole table width", () => {
    const { container } = renderInTable(
      <AdminRegistrationExpandedDetails row={row} colSpan={9} locale="es" labels={labels} sectionName={null} />,
    );
    expect(container.querySelector("td")).toHaveAttribute("colspan", "9");
  });
});
```

Before writing the component, confirm the real tutor label keys with `rg -n "tutorRelationship|tutorPhone" src/dictionaries/en.json` and use those names in both the test and the component.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/__tests__/dashboard/AdminRegistrationExpandedDetails.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the component**

Create `src/components/dashboard/AdminRegistrationExpandedDetails.tsx`:

```tsx
"use client";

import { formatCivilIsoDateForDisplay } from "@/lib/calendar/civilGregorianDate";
import type { Dictionary } from "@/types/i18n";
import type { AdminRegistrationRow } from "@/types/adminRegistration";

type RegLabels = Dictionary["admin"]["registrations"];

export interface AdminRegistrationExpandedDetailsProps {
  row: AdminRegistrationRow;
  colSpan: number;
  locale: string;
  labels: RegLabels;
  sectionName: string | null;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs uppercase text-[var(--color-muted-foreground)]">{label}</dt>
      <dd className="break-words">{value}</dd>
    </div>
  );
}

export function AdminRegistrationExpandedDetails({
  row,
  colSpan,
  locale,
  labels,
  sectionName,
}: AdminRegistrationExpandedDetailsProps) {
  const empty = labels.emptyValue;
  const birth =
    formatCivilIsoDateForDisplay(locale, row.birth_date, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }) ?? empty;

  return (
    <tr className="border-t border-[var(--color-border)] bg-[var(--color-muted)]/30">
      <td colSpan={colSpan} className="px-3 py-3">
        <p className="mb-2 text-sm font-semibold text-[var(--color-secondary)]">
          {labels.detailsTitle}
        </p>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <Field label={labels.email} value={row.email || empty} />
          <Field label={labels.birthDate} value={birth} />
          <Field label={labels.preferredSection} value={sectionName ?? empty} />
          <Field label={labels.tutorName} value={row.tutor_name ?? empty} />
          <Field label={labels.tutorRelationship} value={row.tutor_relationship ?? empty} />
          <Field label={labels.tutorDni} value={row.tutor_dni ?? empty} />
          <Field label={labels.tutorPhone} value={row.tutor_phone ?? empty} />
          <Field label={labels.tutorEmail} value={row.tutor_email ?? empty} />
        </dl>
      </td>
    </tr>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/__tests__/dashboard/AdminRegistrationExpandedDetails.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/AdminRegistrationExpandedDetails.tsx src/__tests__/dashboard/AdminRegistrationExpandedDetails.test.tsx
git commit -m "feat(registrations): expandable detail row for enquiry and guardian data"
```

---

### Task 10: Loader, page and hook wiring

**Files:**
- Modify: `src/lib/dashboard/loadPaginatedRegistrations.ts:6-11,30-36,57-67,82-96,116-137`
- Modify: `src/types/adminRegistration.ts`
- Create: `src/lib/dashboard/loadRegistrationsStatusAggregates.ts`
- Modify: `src/app/[locale]/dashboard/admin/registrations/page.tsx:27-45,55-94`
- Modify: `src/hooks/useAdminRegistrationsList.ts`
- Test: `src/__tests__/lib/dashboard/loadPaginatedRegistrations.test.ts`
- Test: `src/__tests__/lib/dashboard/loadRegistrationsStatusAggregates.test.ts`

**Interfaces:**
- Consumes: the RPC from Task 3; the status action from Task 6.
- Produces:
  - `AdminRegistrationRow` gains `preferred_section_id: string | null`, `contacted_at: string | null`, `contacted_by: string | null`.
  - `PaginatedRegistrationsParams` gains `status?: "new" | "contacted"`.
  - `loadRegistrationsStatusAggregates(supabase, q?: string): Promise<{ total: number; newCount: number; contactedCount: number }>`
  - the hook gains `expandedId: string | null`, `toggleExpanded(id: string): void`, `onMarkContacted(row)`, `onRevertToNew(row)`, `statusFilter`, `setStatusFilter(next)`.

- [ ] **Step 1: Extend the row type**

In `src/types/adminRegistration.ts`, add the three fields to `AdminRegistrationRow`:

```ts
  preferred_section_id: string | null;
  contacted_at: string | null;
  contacted_by: string | null;
```

- [ ] **Step 2: Write the failing loader test**

Create or extend `src/__tests__/lib/dashboard/loadPaginatedRegistrations.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { loadPaginatedRegistrations } from "@/lib/dashboard/loadPaginatedRegistrations";

function makeSupabase() {
  const calls: { eq: unknown[][] } = { eq: [] };
  const chain = {
    select: vi.fn(() => chain),
    neq: vi.fn(() => chain),
    or: vi.fn(() => chain),
    eq: vi.fn((...args: unknown[]) => {
      calls.eq.push(args);
      return chain;
    }),
    order: vi.fn(() => chain),
    range: vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 })),
  };
  return { supabase: { from: vi.fn(() => chain) } as never, chain, calls };
}

describe("loadPaginatedRegistrations status filter", () => {
  it("filters by status when one is requested", async () => {
    const { supabase, calls } = makeSupabase();
    await loadPaginatedRegistrations(supabase, { status: "contacted" });
    expect(calls.eq).toContainEqual(["status", "contacted"]);
  });

  it("does not filter by status when none is requested", async () => {
    const { supabase, calls } = makeSupabase();
    await loadPaginatedRegistrations(supabase, {});
    expect(calls.eq).toHaveLength(0);
  });

  it("selects the follow-up and preferred section columns", async () => {
    const { supabase, chain } = makeSupabase();
    await loadPaginatedRegistrations(supabase, {});
    const selected = String(chain.select.mock.calls[0]?.[0] ?? "");
    expect(selected).toContain("contacted_at");
    expect(selected).toContain("contacted_by");
    expect(selected).toContain("preferred_section_id");
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/__tests__/lib/dashboard/loadPaginatedRegistrations.test.ts`
Expected: FAIL — the status filter is not applied and the new columns are absent.

- [ ] **Step 4: Update the loader**

In `src/lib/dashboard/loadPaginatedRegistrations.ts`:

Add the columns to `REGISTRATION_COLUMNS` (line 6-11): `"preferred_section_id", "contacted_at", "contacted_by"`.

Add to `RegistrationSelectRow`:

```ts
  preferred_section_id: string | null;
  contacted_at: string | null;
  contacted_by: string | null;
```

Add to `PaginatedRegistrationsParams`:

```ts
  status?: "new" | "contacted";
```

After the search filter block (line 96), apply the status filter to both queries:

```ts
  if (params.status) {
    dataQuery = dataQuery.eq("status", params.status);
    countQuery = countQuery.eq("status", params.status);
  }
```

Add the three fields to the row mapping (line 117-137):

```ts
    preferred_section_id:
      r.preferred_section_id != null ? String(r.preferred_section_id) : null,
    contacted_at: r.contacted_at != null ? String(r.contacted_at) : null,
    contacted_by: r.contacted_by != null ? String(r.contacted_by) : null,
```

- [ ] **Step 5: Run the loader test to verify it passes**

Run: `npx vitest run src/__tests__/lib/dashboard/loadPaginatedRegistrations.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 6: Write the failing aggregates test**

Create `src/__tests__/lib/dashboard/loadRegistrationsStatusAggregates.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { loadRegistrationsStatusAggregates } from "@/lib/dashboard/loadRegistrationsStatusAggregates";

describe("loadRegistrationsStatusAggregates", () => {
  it("maps the RPC row to counts", async () => {
    const rpc = vi.fn(() =>
      Promise.resolve({ data: [{ total: 7, new_count: 5, contacted_count: 2 }], error: null }),
    );
    const res = await loadRegistrationsStatusAggregates({ rpc } as never, "ana");
    expect(rpc).toHaveBeenCalledWith("registrations_admin_list_aggregates", { p_query: "ana" });
    expect(res).toEqual({ total: 7, newCount: 5, contactedCount: 2 });
  });

  it("returns zeros when the RPC errors so the list still renders", async () => {
    const rpc = vi.fn(() => Promise.resolve({ data: null, error: { message: "boom" } }));
    const res = await loadRegistrationsStatusAggregates({ rpc } as never, "");
    expect(res).toEqual({ total: 0, newCount: 0, contactedCount: 0 });
  });
});
```

- [ ] **Step 7: Run it to verify it fails**

Run: `npx vitest run src/__tests__/lib/dashboard/loadRegistrationsStatusAggregates.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 8: Write the aggregates loader**

Create `src/lib/dashboard/loadRegistrationsStatusAggregates.ts`:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export interface RegistrationsStatusAggregates {
  total: number;
  newCount: number;
  contactedCount: number;
}

const EMPTY: RegistrationsStatusAggregates = { total: 0, newCount: 0, contactedCount: 0 };

/** Per-status counts under the active search, from the RPC in migration 176 (rule 24). */
export async function loadRegistrationsStatusAggregates(
  supabase: SupabaseClient,
  q?: string,
): Promise<RegistrationsStatusAggregates> {
  const { data, error } = await supabase.rpc("registrations_admin_list_aggregates", {
    p_query: (q ?? "").trim(),
  });

  if (error) {
    logSupabaseClientError("loadRegistrationsStatusAggregates:rpc", error, {});
    return EMPTY;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return EMPTY;

  return {
    total: Number(row.total ?? 0),
    newCount: Number(row.new_count ?? 0),
    contactedCount: Number(row.contacted_count ?? 0),
  };
}
```

- [ ] **Step 9: Run it to verify it passes**

Run: `npx vitest run src/__tests__/lib/dashboard/loadRegistrationsStatusAggregates.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 10: Wire the page**

In `src/app/[locale]/dashboard/admin/registrations/page.tsx`:

Parse the status param inside `parseSearchParams` (after line 37):

```ts
  const status =
    raw.status === "new" || raw.status === "contacted" ? raw.status : undefined;
```

and add `status` to the returned object.

Load the aggregates, the institute country and the section names alongside the existing calls (line 55):

```ts
  const [result, legalAgeMajority, cohort, aggregates] = await Promise.all([
    loadPaginatedRegistrations(supabase, paginationParams),
    Promise.resolve(getLegalAgeMajorityFromSystem()),
    loadCurrentCohort(supabase),
    loadRegistrationsStatusAggregates(supabase, paginationParams.q),
  ]);
```

Resolve the brand for the WhatsApp country and institute name, using the accessor confirmed in Task 2 Step 5, and pass four new props to `AdminRegistrationsScreen`:

```tsx
        statusFilter={paginationParams.status}
        aggregates={aggregates}
        whatsAppCountry={resolveWhatsAppCountry(brand.contactPhone)}
        instituteName={brand.appName}
```

Confirm the brand's display-name field with `rg -n "appName|siteName" src/lib/brand/server.ts` and use the real one.

- [ ] **Step 11: Extend the hook**

In `src/hooks/useAdminRegistrationsList.ts`, add the expansion state, the status filter setter and the two status handlers, and return them:

```ts
import {
  markRegistrationContacted,
  revertRegistrationToNew,
} from "@/app/[locale]/dashboard/admin/registrations/actions";

// ...inside the hook, next to the other useState calls:
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const setStatusFilter = useCallback(
    (next: "new" | "contacted" | undefined) =>
      pushParams({ status: next, page: undefined }),
    [pushParams],
  );

  async function runStatusChange(
    row: AdminRegistrationRow,
    fn: (locale: string, id: string) => Promise<{ ok: boolean; message?: string }>,
  ) {
    setBusyId(row.id);
    setToast(null);
    const res = await fn(locale, row.id);
    setBusyId(null);
    if (res.ok) {
      setToast(labels.statusChangeSuccess);
      refreshList();
    } else {
      setToast(`${labels.statusChangeError}: ${res.message ?? ""}`);
    }
  }

  const onMarkContacted = (row: AdminRegistrationRow) =>
    runStatusChange(row, markRegistrationContacted);
  const onRevertToNew = (row: AdminRegistrationRow) =>
    runStatusChange(row, revertRegistrationToNew);
```

Add `expandedId`, `toggleExpanded`, `setStatusFilter`, `onMarkContacted`, `onRevertToNew` to the returned object, and accept `statusFilter` in the params so it can be returned for the toolbar.

- [ ] **Step 12: Run the hook and form tests**

Run: `npx vitest run src/__tests__/hooks/useAdminRegistrationsList.test.tsx src/__tests__/dashboard/dashboardFormsCoverage.test.tsx`
Expected: PASS. Update any assertion that enumerated the hook's returned keys.

- [ ] **Step 13: Commit**

```bash
git add src/types/adminRegistration.ts src/lib/dashboard src/app/[locale]/dashboard/admin/registrations/page.tsx src/hooks/useAdminRegistrationsList.ts src/__tests__
git commit -m "feat(registrations): load follow-up data, status filter and status counts"
```

---

### Task 11: Desktop table, PWA list and toolbar

The user-visible payoff: phones on screen without opening a modal, on both surfaces.

**Files:**
- Modify: `src/components/desktop/organisms/AdminRegistrationsTableDesktop.tsx:89-163`
- Modify: `src/components/dashboard/AdminRegistrationTableRow.tsx`
- Modify: `src/components/molecules/RegistrationListToolbar.tsx`
- Modify: `src/components/pwa/molecules/AdminRegistrationsPwaList.tsx`
- Modify: `src/components/organisms/AdminRegistrationsScreen.tsx` (new props through to both trees)
- Modify: `src/components/pwa/organisms/AdminRegistrationsScreenNarrow.tsx`
- Test: `src/__tests__/desktop/AdminRegistrationsTableDesktop.test.tsx`

**Interfaces:**
- Consumes: Tasks 4, 7, 8, 9, 10.
- Produces: no new exports; the desktop column set becomes expand toggle, name, DNI, student phone, tutor phone, level, status, received, actions.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/desktop/AdminRegistrationsTableDesktop.test.tsx` with a minimal render (copy the props fixture from `src/__tests__/dashboard/dashboardFormsCoverage.test.tsx`'s registrations case) asserting:

```tsx
it("shows both phone columns and no email column", () => {
  // render with one adult row (phone set) and one minor row (tutor_phone set)
  expect(screen.getByRole("columnheader", { name: /Teléfono del alumno/ })).toBeInTheDocument();
  expect(screen.getByRole("columnheader", { name: /Teléfono del tutor/ })).toBeInTheDocument();
  expect(screen.queryByRole("columnheader", { name: /^Email$/ })).not.toBeInTheDocument();
});

it("reveals the email in the expanded panel", async () => {
  // render, click the expand toggle of the first row
  await userEvent.click(screen.getByRole("button", { name: /Ver detalle/ }));
  expect(screen.getByText("ana@example.com")).toBeInTheDocument();
});

it("marks a minor row", () => {
  expect(screen.getByText("Menor")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/__tests__/desktop/AdminRegistrationsTableDesktop.test.tsx`
Expected: FAIL — the email column still exists and there is no expand toggle.

- [ ] **Step 3: Rewrite the desktop column set**

In `AdminRegistrationsTableDesktop.tsx`, replace the `columns` array (lines 89-100) and the `colgroup` (lines 139-149):

```tsx
        columns={[
          { id: "name", label: labels.name, thClassName: hdr },
          { id: "dni", label: labels.dni, thClassName: hdr },
          { id: "phoneStudent", label: labels.phoneStudent, thClassName: hdr, sortable: false },
          { id: "phoneTutor", label: labels.phoneTutor, thClassName: hdr, sortable: false },
          { id: "level", label: labels.level, thClassName: hdr },
          { id: "status", label: labels.status, thClassName: hdr },
          { id: "received", label: labels.received, thClassName: hdr },
        ]}
        leadingHeader={
          <th scope="col" className={`${hdr} w-[4%]`}>
            <span className="sr-only">{labels.expandRow}</span>
          </th>
        }
```

```tsx
        colgroup={
          <colgroup>
            <col style={{ width: "4%" }} />
            <col style={{ width: "17%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "11%" }} />
          </colgroup>
        }
```

Confirm `labels.status` exists with `rg -n '"status"' src/dictionaries/en.json`; if not, add `status` in Task 7's key list before continuing.

- [ ] **Step 4: Render the row plus its expanded panel**

Still in `AdminRegistrationsTableDesktop.tsx`, replace the children block (lines 151-163):

```tsx
        {u.pageRows.map((r) => (
          <Fragment key={r.id}>
            <AdminRegistrationTableRow
              locale={locale}
              r={r}
              busy={u.busyId === r.id}
              labels={labels}
              statusLabel={u.statusLabel}
              contact={resolveRegistrationContact(r, {
                legalAgeMajority,
                country: whatsAppCountry,
              })}
              instituteName={instituteName}
              expanded={u.expandedId === r.id}
              onToggleExpanded={u.toggleExpanded}
              onAccept={u.setAcceptRow}
              onEdit={u.setEditRow}
              onDelete={u.setDeleteRow}
              onMarkContacted={u.onMarkContacted}
              onRevertToNew={u.onRevertToNew}
            />
            {u.expandedId === r.id ? (
              <AdminRegistrationExpandedDetails
                row={r}
                colSpan={9}
                locale={locale}
                labels={labels}
                sectionName={
                  currentCohortSections?.find((s) => s.id === r.preferred_section_id)?.name ?? null
                }
              />
            ) : null}
          </Fragment>
        ))}
```

Import `Fragment` from `react`, `resolveRegistrationContact`, and `AdminRegistrationExpandedDetails`. Check the field name on `CurrentCohortSection` with `rg -n "interface CurrentCohortSection" -A 6 src/lib/academics/currentCohort.ts` and use its real id/name fields.

- [ ] **Step 5: Update the row component**

In `AdminRegistrationTableRow.tsx`: add the new props to the interface, drop the email `<td>` (line 40) and the birth-date `<td>` (lines 44-50), and add the leading toggle cell, the two contact cells, the minor marker beside the name, and the status chip with its action:

```tsx
      <td className="px-2 py-2 align-top">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-expanded={expanded}
          aria-label={expanded ? labels.collapseRow : labels.expandRow}
          title={expanded ? labels.collapseRow : labels.expandRow}
          className="h-8 w-8 shrink-0 p-0"
          onClick={() => onToggleExpanded(r.id)}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          )}
        </Button>
      </td>
      <td className="min-w-0 max-w-0 break-words px-3 py-2 align-top font-medium">
        {formatProfileNameSurnameFirst(r.first_name, r.last_name)}
        {contact.isMinor ? (
          <span className="ml-2 rounded-full border border-[var(--color-border)] px-2 py-0.5 text-xs text-[var(--color-muted-foreground)]">
            {labels.minorMarker}
          </span>
        ) : null}
      </td>
      <td className="min-w-0 max-w-0 break-words px-3 py-2 align-top">{r.dni}</td>
      <td className="min-w-0 max-w-0 px-3 py-2 align-top">
        <RegistrationContactCell
          entry={contact.student}
          contactName={r.first_name}
          instituteName={instituteName}
          labels={labels}
        />
      </td>
      <td className="min-w-0 max-w-0 px-3 py-2 align-top">
        <RegistrationContactCell
          entry={contact.tutor}
          contactName={r.tutor_name ?? r.first_name}
          instituteName={instituteName}
          labels={labels}
        />
      </td>
```

and, after the level cell, the status cell:

```tsx
      <td className="min-w-0 max-w-0 break-words px-3 py-2 align-top">
        <span className="block">{statusLabel(r.status)}</span>
        {r.status === "new" ? (
          <button
            type="button"
            className="mt-1 text-xs underline"
            title={labels.markContactedTip}
            disabled={busy}
            onClick={() => onMarkContacted(r)}
          >
            {labels.markContacted}
          </button>
        ) : (
          <button
            type="button"
            className="mt-1 text-xs underline"
            title={labels.revertToNewTip}
            disabled={busy}
            onClick={() => onRevertToNew(r)}
          >
            {labels.revertToNew}
          </button>
        )}
      </td>
```

- [ ] **Step 6: Add the status filter chips to the toolbar**

In `RegistrationListToolbar.tsx`, extend the props interface and replace the counts block (lines 55-58) with the chips. The existing `tpl` helper already substitutes `{{count}}`:

```tsx
export type RegistrationStatusFilter = "new" | "contacted" | undefined;

export interface RegistrationListToolbarProps {
  labels: RegLabels;
  query: string;
  onQueryChange: (v: string) => void;
  totalCount: number;
  filteredCount: number;
  aggregates: { total: number; newCount: number; contactedCount: number };
  statusFilter: RegistrationStatusFilter;
  onStatusFilterChange: (next: RegistrationStatusFilter) => void;
  exportTrigger?: ReactNode;
}
```

```tsx
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { value: undefined, label: tpl(labels.statusFilterAll, aggregates.total) },
            { value: "new" as const, label: tpl(labels.statusFilterNew, aggregates.newCount) },
            {
              value: "contacted" as const,
              label: tpl(labels.statusFilterContacted, aggregates.contactedCount),
            },
          ] satisfies { value: RegistrationStatusFilter; label: string }[]
        ).map((chip) => {
          const active = statusFilter === chip.value;
          return (
            <button
              key={chip.label}
              type="button"
              aria-pressed={active}
              onClick={() => onStatusFilterChange(chip.value)}
              className={`rounded-full border px-3 py-1 text-sm ${
                active
                  ? "border-[var(--color-secondary)] bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]"
                  : "border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
              }`}
            >
              {chip.label}
            </button>
          );
        })}
        {exportTrigger}
      </div>
```

Import `type ReactNode` from `react`. Both call sites (`AdminRegistrationsTableDesktop.tsx` and `AdminRegistrationsScreenNarrow.tsx`) must pass the three new props from the hook and the page.

- [ ] **Step 7: Mirror the phones on the PWA list**

In `AdminRegistrationsPwaList.tsx`, add the two contact blocks and the follow-up action to each card. Insert inside the card body, after the existing name/DNI block:

```tsx
        <div className="mt-2 grid grid-cols-1 gap-2">
          <div>
            <p className="text-xs uppercase text-[var(--color-muted-foreground)]">
              {labels.phoneStudent}
            </p>
            <RegistrationContactCell
              entry={contact.student}
              contactName={r.first_name}
              instituteName={instituteName}
              labels={labels}
            />
          </div>
          <div>
            <p className="text-xs uppercase text-[var(--color-muted-foreground)]">
              {labels.phoneTutor}
            </p>
            <RegistrationContactCell
              entry={contact.tutor}
              contactName={r.tutor_name ?? r.first_name}
              instituteName={instituteName}
              labels={labels}
            />
          </div>
          <button
            type="button"
            className="min-h-[44px] rounded-[var(--layout-border-radius)] border border-[var(--color-border)] px-3 text-sm"
            disabled={busyId === r.id}
            onClick={() =>
              r.status === "new" ? onMarkContacted(r) : onRevertToNew(r)
            }
          >
            {r.status === "new" ? labels.markContacted : labels.revertToNew}
          </button>
        </div>
```

Compute `contact` per card the same way the desktop table does, with `resolveRegistrationContact(r, { legalAgeMajority, country: whatsAppCountry })`. Keep the tap target at 44px minimum per the PWA rule. Thread `legalAgeMajority`, `whatsAppCountry`, `instituteName`, `onMarkContacted` and `onRevertToNew` through `AdminRegistrationsScreenNarrow.tsx` and `AdminRegistrationsScreen.tsx`.

- [ ] **Step 8: Run the tests**

Run: `npx vitest run src/__tests__/desktop/AdminRegistrationsTableDesktop.test.tsx src/__tests__/dashboard src/__tests__/hooks/useAdminRegistrationsList.test.tsx`
Expected: PASS.

- [ ] **Step 9: Check types and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 10: Commit**

```bash
git add src/components src/__tests__
git commit -m "feat(registrations): show student and guardian phones in the list with follow-up actions"
```

---

### Task 12: Spreadsheet export

**Files:**
- Create: `src/app/[locale]/dashboard/admin/registrations/exportRegistrationsAction.ts`
- Create: `src/components/dashboard/RegistrationsExportTrigger.tsx`
- Modify: `src/components/molecules/RegistrationListToolbar.tsx` (mount the trigger)
- Test: `src/__tests__/app/exportRegistrationsAction.test.ts`

**Interfaces:**
- Consumes: `loadPaginatedRegistrations` params from Task 10.
- Produces: `exportRegistrations(locale: string, params: { q?: string; status?: "new" | "contacted" }): Promise<{ ok: true; fileName: string; base64: string } | { ok: false; message: string }>`

- [ ] **Step 1: Read the existing export to copy the pattern**

Run: `cat src/app/[locale]/dashboard/admin/users/exportUsersAction.ts && ls src/lib/users | rg -i "xlsx|spreadsheet"`
Reuse the same workbook builder and the same return shape; do not introduce a second spreadsheet library.

- [ ] **Step 2: Write the failing test**

Create `src/__tests__/app/exportRegistrationsAction.test.ts` mirroring the users export test:

```ts
it("refuses when the caller is not an admin", async () => {
  assertAdmin.mockRejectedValue(new Error("nope"));
  const res = await exportRegistrations("es", {});
  expect(res.ok).toBe(false);
});

it("includes both phones and the guardian block in the sheet rows", async () => {
  const res = await exportRegistrations("es", {});
  expect(res.ok).toBe(true);
  const header = buildRowsSpy.mock.calls[0]?.[0];
  expect(header).toContain("phone");
  expect(header).toContain("tutor_phone");
});

it("honours the active status filter", async () => {
  await exportRegistrations("es", { status: "contacted" });
  expect(loadSpy).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ status: "contacted" }));
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run src/__tests__/app/exportRegistrationsAction.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement the action**

Create `src/app/[locale]/dashboard/admin/registrations/exportRegistrationsAction.ts`:

```ts
"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { logServerAuthzDenied } from "@/lib/logging/serverActionLog";
import { loadPaginatedRegistrations } from "@/lib/dashboard/loadPaginatedRegistrations";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";

const CHUNK = 500;
const MAX_ROWS = 10_000;

const paramsZ = z.object({
  q: z.string().trim().max(200).optional(),
  status: z.enum(["new", "contacted"]).optional(),
});

const COLUMNS = [
  "first_name", "last_name", "dni", "email", "phone", "birth_date",
  "level_interest", "status", "contacted_at",
  "tutor_name", "tutor_relationship", "tutor_dni", "tutor_phone", "tutor_email",
] as const;

export type ExportRegistrationsResult =
  | { ok: true; fileName: string; base64: string }
  | { ok: false; message: string };

export async function exportRegistrations(
  locale: string,
  rawParams: z.input<typeof paramsZ>,
): Promise<ExportRegistrationsResult> {
  const dict = await getDictionary(locale);
  const reg = dict.actionErrors.registrationDraft;

  try {
    await assertAdmin();
  } catch {
    logServerAuthzDenied("exportRegistrations");
    return { ok: false, message: reg.forbidden };
  }

  const parsed = paramsZ.safeParse(rawParams);
  if (!parsed.success) return { ok: false, message: reg.invalidData };

  const admin = createAdminClient();
  const rows: Record<string, unknown>[] = [];

  // Bounded chunks: never a single unbounded select (rule 13).
  for (let page = 1; rows.length < MAX_ROWS; page += 1) {
    const result = await loadPaginatedRegistrations(admin, {
      ...parsed.data,
      page,
      pageSize: CHUNK,
    });
    if (result.rows.length === 0) break;
    for (const r of result.rows) {
      rows.push(Object.fromEntries(COLUMNS.map((c) => [c, (r as Record<string, unknown>)[c] ?? ""])));
    }
    if (rows.length >= result.totalCount) break;
  }

  const base64 = buildRegistrationsWorkbookBase64(COLUMNS as unknown as string[], rows);

  void recordSystemAudit({
    action: "registrations_exported",
    resourceType: "registration",
    payload: { count: rows.length, status: parsed.data.status ?? "all" },
  });

  return {
    ok: true,
    fileName: `inscripciones-${new Date().toISOString().slice(0, 10)}.xlsx`,
    base64,
  };
}
```

`buildRegistrationsWorkbookBase64` must be the **existing** shared workbook helper found in Step 1 — import it under its real name instead of writing a second spreadsheet path. If the users export inlines its workbook code rather than exposing a helper, extract that code into `src/lib/export/buildWorkbookBase64.ts` first, have the users export use it, and run the users export test to confirm the extraction changed nothing (`REGRESSION CHECK`).

- [ ] **Step 5: Implement the trigger**

Create `src/components/dashboard/RegistrationsExportTrigger.tsx`:

```tsx
"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { exportRegistrations } from "@/app/[locale]/dashboard/admin/registrations/exportRegistrationsAction";
import type { Dictionary } from "@/types/i18n";

type RegLabels = Dictionary["admin"]["registrations"];

export interface RegistrationsExportTriggerProps {
  locale: string;
  query: string;
  statusFilter: "new" | "contacted" | undefined;
  labels: RegLabels;
  onError: (message: string) => void;
}

export function RegistrationsExportTrigger({
  locale,
  query,
  statusFilter,
  labels,
  onError,
}: RegistrationsExportTriggerProps) {
  const [busy, setBusy] = useState(false);

  async function onExport() {
    setBusy(true);
    const res = await exportRegistrations(locale, { q: query, status: statusFilter });
    setBusy(false);
    if (!res.ok) {
      onError(res.message);
      return;
    }
    const link = document.createElement("a");
    link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${res.base64}`;
    link.download = res.fileName;
    link.click();
  }

  return (
    <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={onExport} title={labels.exportTip}>
      <Download className="mr-2 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
      {labels.exportButton}
    </Button>
  );
}
```

Mount it in the toolbar via the `exportTrigger` prop added in Task 11 Step 6, passing `onError={(m) => setToast(m)}` from the hook's toast setter. If the users export trigger already implements this download dance in a shared helper, call that helper instead of duplicating it.

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run src/__tests__/app/exportRegistrationsAction.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 7: Commit**

```bash
git add src/app/[locale]/dashboard/admin/registrations/exportRegistrationsAction.ts src/components/dashboard/RegistrationsExportTrigger.tsx src/components/molecules/RegistrationListToolbar.tsx src/__tests__/app/exportRegistrationsAction.test.ts
git commit -m "feat(registrations): export the filtered list with contact details"
```

---

### Task 13: End-to-end check and full gate

Extends the existing `@critical-registration` spec rather than adding a new Playwright project, so no config change is needed and the new case reuses the public-registration setup already written there.

**Files:**
- Modify: `e2e/critical-registration.spec.ts` (add one `test` inside the existing `describe`)
- Test: the whole suite

**Interfaces:**
- Consumes: everything above.
- Produces: nothing importable.

- [ ] **Step 1: Add the test to the existing describe block**

Append inside `test.describe("@critical-registration", ...)` in `e2e/critical-registration.spec.ts`:

```ts
  test("admin reads the phone from the list and marks the lead contacted", async ({ browser }) => {
    test.setTimeout(180_000);
    const locale = isolation.ok ? isolation.locale : "es";
    const suffix = Date.now().toString(36);
    const email = `e2e-contact-${suffix}@example.test`;
    const dni = `E2EC${suffix}`.replace(/[^A-Za-z0-9]/g, "").slice(0, 12);
    const phone = "+5491112345678";

    // Public registration, so the lead exists with a known phone.
    const anon = await browser.newContext();
    const registerPage = await anon.newPage();
    await gotoIsolated(registerPage, `/${locale}/register`);
    await expect(registerPage.locator("#rg-fn")).toBeVisible({ timeout: 20_000 });
    await registerPage.locator("#rg-fn").fill("E2E");
    await registerPage.locator("#rg-ln").fill(`Contact${suffix}`);
    await pickAdultBirthDate(registerPage);
    await expect(registerPage.locator("#rg-em")).toBeVisible();
    await registerPage.locator("#rg-dni").fill(dni);
    await registerPage.locator("#rg-em").fill(email);
    await registerPage.locator("#rg-ph").fill(phone);
    await registerPage.locator("#rg-section").selectOption({ index: 1 });
    await registerPage.getByRole("button", { name: /enviar|submit|inscrib/i }).click();
    await expect(registerPage.getByRole("dialog")).toBeVisible({ timeout: 45_000 });
    await anon.close();

    const admin = await browser.newContext({ storageState: paths.storageState });
    const adminPage = await admin.newPage();
    await gotoIsolated(adminPage, `/${locale}/dashboard/admin/registrations`);

    // The whole point of this change: the phone is readable in the row itself.
    // Search by DNI, because the email column no longer exists in the table.
    await adminPage.locator("#registrations-filter").fill(dni);
    const row = adminPage.locator("tr").filter({ hasText: dni }).first();
    await expect(row).toBeVisible({ timeout: 30_000 });
    await expect(row.getByText(phone)).toBeVisible();

    // WhatsApp link built from normalized digits, no leading plus.
    await expect(row.getByRole("link", { name: /WhatsApp/i })).toHaveAttribute(
      "href",
      /^https:\/\/wa\.me\/5491112345678\?text=/,
    );

    // Email moved to the expandable panel.
    await expect(row.getByText(email)).toBeHidden();
    await row.getByRole("button", { name: /Ver detalle|Show details|Ver detalhes/i }).click();
    await expect(adminPage.getByText(email)).toBeVisible({ timeout: 15_000 });

    // Follow-up: mark contacted, then confirm the lead is still actionable (D11).
    await row.getByRole("button", { name: /Marcar contactado|Mark contacted|Marcar contatado/i }).click();
    await expect(
      adminPage.locator("tr").filter({ hasText: dni }).first()
        .getByRole("button", { name: /Marcar pendiente|Mark as pending|Marcar pendente/i }),
    ).toBeVisible({ timeout: 30_000 });
    const contactedRow = adminPage.locator("tr").filter({ hasText: dni }).first();
    await expect(
      contactedRow.getByRole("button", { name: /Dar de alta|enroll as|accept/i }),
    ).toBeEnabled();

    await admin.close();
  });
```

- [ ] **Step 2: Run the spec**

Run: `npx playwright test e2e/critical-registration.spec.ts`
Expected: PASS, both tests in the file.

- [ ] **Step 3: Run the whole gate**

Run: `npm run lint && npx tsc --noEmit && npm run test`
Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add e2e/critical-registration.spec.ts
git commit -m "test(e2e): read the lead phone from the list and mark it contacted"
```

---

## Definition of done for this plan

- [ ] The student's phone and the guardian's phone are both readable in the admin registrations list without opening a modal, on desktop and on the installed PWA.
- [ ] Each phone offers WhatsApp (with a prefilled greeting) and copy; numbers that cannot be resolved to a valid international form show the number but no WhatsApp action.
- [ ] Minor rows are marked as such, and their guardian phone is the one that carries the contact.
- [ ] Email, birth date, the full guardian block and the preferred group are one click away in an expandable row.
- [ ] A lead can be marked contacted and reverted, recording who and when, and a contacted lead stays editable and acceptable.
- [ ] The toolbar filters by follow-up status with counts that come from the database, not from the current page.
- [ ] The filtered list exports to a spreadsheet including both phones and the guardian block.
- [ ] The retention table's WhatsApp links go through the same normalizer.
- [ ] All new copy exists in `en`, `es` and `pt`.
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm run test` and the precommit e2e gate pass.
