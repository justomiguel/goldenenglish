# Student Care Notes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Record health, dietary and special-support notes for a student, show a discreet "needs care" marker wherever staff see that student's name, and keep the note *text* readable only by an admin, the student's tutor, or a teacher/assistant of a section the student is enrolled in.

**Architecture:** Three `TEXT` columns on `profiles` plus a trigger-derived `has_care_notes` boolean. The boolean stays readable by everyone (that is what drives the badge, with no extra query); the three note texts are removed from the `authenticated` and `anon` roles through a column-privilege allowlist, so the only way to read them is a single server loader that runs with the service client after authorizing the caller. Writes come from two places — the admin ficha and the family portal — and both stamp who changed the notes and when.

**Tech Stack:** Next.js 16 App Router, React, Tailwind (CSS variables), Supabase Postgres + RLS + column privileges, Zod, Vitest + React Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-07-event-packages-registrations-contact-student-care-design.md` (§1.3, §3.7, §3.8, D12, D13, D14)

## Deviations from the spec, decided while planning

These are deliberate and each one has a reason. Anything else must follow the spec.

| # | Spec said | This plan does | Why |
|---|---|---|---|
| P1 | Migration `177` | Migration **`181`** | `177`–`180` were taken by parallel work (`cohort_assessments_family_read`, `section_billing_mode`, `class_pack_prices`, `class_credit_ledger`). |
| P2 | One guard test running `has_column_privilege` "against the local Supabase stack" | **Two guards.** (a) A static test that derives the `profiles` column list from the migration files and asserts the `GRANT` allowlist equals that list minus the three notes (Task 2). (b) A live check in the Playwright e2e suite that logs in as a real `authenticated` user and asserts PostgREST refuses to select a care note (Task 12). | Vitest has **no live-Postgres harness** — every test under `src/__tests__/db/` asserts migration *text* and says so. But e2e already runs against the local stack with a logged-in session, so the privilege can be verified for real there, with no new dependency. The static guard is the one that runs on every commit and catches a forgotten column; the live one proves the privilege actually took effect. |
| P3 | Copy under `admin.users.care.*` and `dashboard.parent.care.*` | Flat keys `admin.users.detailCare*` and `dashboard.parent.wardCare*` | `admin.users` has **no nested per-tab objects**; every ficha string is a flat `detail*` key. A nested island would be the odd one out. |
| P4 | (not mentioned) | The **parent edit page must read care notes through the authorized loader**, not through its existing session-client `select` | Once `authenticated` loses `SELECT` on the three columns, the parent portal's own `createClient()` read returns an error instead of the notes. Missing this would ship a form that silently cannot show what it edits. |
| P5 | "writing an audit record" for both write paths | Admin path uses `recordSystemAudit`; **parent path uses `auditIdentityAction`** | `recordSystemAudit` calls `assertAdmin()` internally, so it throws for a parent. |

## Global Constraints

- **Spec authority:** every decision traces to the spec above. D12 (columns on `profiles` + privilege allowlist + guard test), D13 (`has_care_notes` stays unrestricted), D14 (one authorized loader: admin, tutor, or teacher/assistant of a section the student is enrolled in).
- **No user-visible literals in components.** Every string comes from `src/dictionaries/en.json` + `es.json` + `pt.json`, identical key shape. `Dictionary` derives from `en.json`, so a key missing there fails the build (rule `09-i18n-copy.mdc`).
- **Server-side authorization only.** Never trust a client-side role check (rule `04-security.mdc`).
- **Supabase only through the app's client factories** in `src/lib/supabase/` (rule `12-supabase-app-boundaries.mdc`).
- **Bounded queries.** No `select("*")` — this is not style here, it is load-bearing: a `select("*")` on `profiles` from the `authenticated` role would start failing the moment Task 1 lands (rule `13-postgrest-pagination-bounded-queries.mdc`).
- **Post-mutation refresh:** `revalidatePath` on the server plus `router.refresh()` on the client (rule `27-post-mutation-ui-refresh.mdc`).
- **Structured error logging** with the `[ge:server]` helpers in `src/lib/logging/serverActionLog.ts`, stable `scope` strings. **Care note text is medical data and must never reach a log, an audit `payload`, or an error message** (rule `25-server-error-logging.mdc`).
- **Migrations never destroy data** — additive only (rule `21-migrations-production-no-data-destruction.mdc`).
- **Buttons and CTA links carry a leading Lucide icon** plus an accessible name (rule `16-admin-buttons-icons.mdc`).
- **No `alert` / `confirm` / `prompt`** (rule `18-no-native-browser-dialogs.mdc`).
- **Files stay under 250 lines** (rule `03-architecture.mdc`).
- **Tests are self-contained** — every file under `src/__tests__/` runs alone with local mocks (rule `30-harness-self-contained-tests.mdc`).
- **Commands:** `npx vitest run <path>` for one file, `npm run lint`, `npx tsc --noEmit`.

---

### Task 1: Migration 181 — care columns, derived flag, privilege allowlist

The whole feature rests on this migration. It adds the columns, keeps `has_care_notes` in sync by trigger, stops a linked minor from editing their own notes, and narrows `SELECT` so the note text stops being world-readable inside the app.

**Files:**
- Create: `supabase/migrations/181_student_care_notes.sql`
- Test: `src/__tests__/db/student_care_notes_migration.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: columns `care_health_note`, `care_diet_note`, `care_support_note`, `care_updated_at`, `care_updated_by`, `has_care_notes` on `public.profiles`; trigger `profiles_set_has_care_notes`.

**Context you need before writing it:**
- Migration `166_public_api_role_grants.sql` ran `GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role` **and** set `ALTER DEFAULT PRIVILEGES ... GRANT ALL ON TABLES`. Both roles therefore hold table-level `SELECT` today, which is why a plain `REVOKE` of three columns is impossible — Postgres has no subtractive column privilege.
- The derived-column pattern to copy is `profiles_set_age_years` (migration `011_minor_tutor_relations.sql`): `BEFORE INSERT OR UPDATE OF <source cols>`, function mutates `NEW`, then a backfill statement that re-fires the trigger.
- `profiles_block_minor_self_sensitive_update` currently lives in `111_profiles_home_address.sql` and protects 7 columns: `first_name`, `last_name`, `phone`, `birth_date`, `dni_or_passport`, `home_address_text`, `home_place_id`. Replace the function with all 7 **plus** the three care notes. Do **not** recreate the trigger (migration 111 does not either).
- `public.profiles` has **28 columns today**. The allowlist below is those 28 plus the three new unrestricted care columns, and it deliberately omits the three note texts.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/db/student_care_notes_migration.test.ts`. Follow the house style of `src/__tests__/db/class_credit_ledger_migration.test.ts`: read the `.sql` as text and assert its contract.

```ts
/** @vitest-environment node */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Pin the contract of 181 as text. There is no Postgres harness in this repo,
 * so the migration's shape is what we can assert here; Task 2 adds the guard
 * that keeps the GRANT allowlist honest as `profiles` grows.
 */
const sql = readFileSync(
  join(process.cwd(), "supabase/migrations/181_student_care_notes.sql"),
  "utf8",
);

describe("181_student_care_notes", () => {
  it("adds the care columns additively", () => {
    for (const col of [
      "care_health_note",
      "care_diet_note",
      "care_support_note",
      "care_updated_at",
      "care_updated_by",
      "has_care_notes",
    ]) {
      expect(sql).toMatch(new RegExp(`ADD COLUMN IF NOT EXISTS\\s+${col}`));
    }
  });

  it("never destroys data", () => {
    expect(sql).not.toMatch(/DROP\s+TABLE/i);
    expect(sql).not.toMatch(/DROP\s+COLUMN/i);
    expect(sql).not.toMatch(/TRUNCATE/i);
    expect(sql).not.toMatch(/DELETE\s+FROM/i);
  });

  it("keeps has_care_notes in sync with a trigger and backfills it", () => {
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.profiles_set_has_care_notes/);
    expect(sql).toMatch(/BEFORE INSERT OR UPDATE OF[^;]*care_health_note/);
    expect(sql).toMatch(/UPDATE public\.profiles/); // backfill
  });

  it("stops a linked minor from editing their own care notes", () => {
    const fn = sql.slice(sql.indexOf("profiles_block_minor_self_sensitive_update"));
    for (const col of ["care_health_note", "care_diet_note", "care_support_note"]) {
      expect(fn).toMatch(new RegExp(`NEW\\.${col} IS DISTINCT FROM OLD\\.${col}`));
    }
    // The seven columns protected before this migration must survive it.
    for (const col of [
      "first_name",
      "last_name",
      "phone",
      "birth_date",
      "dni_or_passport",
      "home_address_text",
      "home_place_id",
    ]) {
      expect(fn).toMatch(new RegExp(`NEW\\.${col} IS DISTINCT FROM OLD\\.${col}`));
    }
  });

  it("revokes table-level SELECT before granting the column allowlist", () => {
    const revokeAt = sql.search(/REVOKE\s+SELECT\s+ON\s+public\.profiles/i);
    const grantAt = sql.search(/GRANT\s+SELECT\s*\(/i);
    expect(revokeAt).toBeGreaterThan(-1);
    expect(grantAt).toBeGreaterThan(revokeAt);
  });

  it("never grants SELECT on the three note columns", () => {
    const grant = sql.slice(sql.search(/GRANT\s+SELECT\s*\(/i));
    for (const col of ["care_health_note", "care_diet_note", "care_support_note"]) {
      expect(grant).not.toContain(col);
    }
  });

  it("leaves service_role and the write grants alone", () => {
    expect(sql).not.toMatch(/REVOKE[^;]*service_role/i);
    expect(sql).not.toMatch(/REVOKE\s+(INSERT|UPDATE|DELETE)[^;]*public\.profiles/i);
  });

  it("warns that a future blanket GRANT ALL would silently undo this", () => {
    expect(sql).toMatch(/166/);
    expect(sql).toMatch(/GRANT ALL ON ALL TABLES/i);
  });
});
```

Run it and watch it fail: `npx vitest run src/__tests__/db/student_care_notes_migration.test.ts`

- [ ] **Step 2: Write the migration**

Create `supabase/migrations/181_student_care_notes.sql`:

```sql
-- Student care notes: health, dietary and special-support text that only an
-- admin, the student's tutor, or a teacher/assistant of one of the student's
-- sections may read. The three note texts are removed from the API roles with
-- a column-privilege allowlist; `has_care_notes` stays readable so staff lists
-- can show a marker without exposing anything.
-- Spec: docs/superpowers/specs/2026-08-07-event-packages-registrations-contact-student-care-design.md (§3.7, D12, D13)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS care_health_note  TEXT,
  ADD COLUMN IF NOT EXISTS care_diet_note    TEXT,
  ADD COLUMN IF NOT EXISTS care_support_note TEXT,
  ADD COLUMN IF NOT EXISTS care_updated_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS care_updated_by   UUID NULL
    REFERENCES public.profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS has_care_notes    BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.care_health_note IS
  'Restricted: health condition staff must know about. Read only through loadStudentCareNotes.';
COMMENT ON COLUMN public.profiles.care_diet_note IS
  'Restricted: dietary needs or allergies. Read only through loadStudentCareNotes.';
COMMENT ON COLUMN public.profiles.care_support_note IS
  'Restricted: special treatment or accommodation. Read only through loadStudentCareNotes.';
COMMENT ON COLUMN public.profiles.has_care_notes IS
  'Derived by trigger: true when any care note is non-blank. Deliberately unrestricted (D13).';

-- Derived flag, same pattern as profiles_set_age_years (migration 011).
CREATE OR REPLACE FUNCTION public.profiles_set_has_care_notes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.has_care_notes :=
    COALESCE(btrim(NEW.care_health_note), '')  <> ''
    OR COALESCE(btrim(NEW.care_diet_note), '')    <> ''
    OR COALESCE(btrim(NEW.care_support_note), '') <> '';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_has_care_notes ON public.profiles;
CREATE TRIGGER profiles_set_has_care_notes
  BEFORE INSERT OR UPDATE OF care_health_note, care_diet_note, care_support_note
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_set_has_care_notes();

-- Backfill. Every row is false today, but re-firing the trigger keeps the
-- migration correct if it is ever replayed against data that already has notes.
UPDATE public.profiles
  SET care_health_note = care_health_note
  WHERE care_health_note IS NOT NULL
     OR care_diet_note IS NOT NULL
     OR care_support_note IS NOT NULL;

-- A linked minor already cannot edit their own identity fields; care notes join
-- that list. Replaces the version from migration 111; the trigger itself is
-- unchanged and is not recreated here.
CREATE OR REPLACE FUNCTION public.profiles_block_minor_self_sensitive_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS DISTINCT FROM NEW.id THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM 'student'::public.user_role THEN
    RETURN NEW;
  END IF;

  IF NOT COALESCE(NEW.is_minor, false) THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.tutor_student_rel ts
    WHERE ts.student_id = NEW.id
  ) THEN
    RETURN NEW;
  END IF;

  IF (NEW.first_name IS DISTINCT FROM OLD.first_name)
    OR (NEW.last_name IS DISTINCT FROM OLD.last_name)
    OR (NEW.phone IS DISTINCT FROM OLD.phone)
    OR (NEW.birth_date IS DISTINCT FROM OLD.birth_date)
    OR (NEW.dni_or_passport IS DISTINCT FROM OLD.dni_or_passport)
    OR (NEW.home_address_text IS DISTINCT FROM OLD.home_address_text)
    OR (NEW.home_place_id IS DISTINCT FROM OLD.home_place_id)
    OR (NEW.care_health_note IS DISTINCT FROM OLD.care_health_note)
    OR (NEW.care_diet_note IS DISTINCT FROM OLD.care_diet_note)
    OR (NEW.care_support_note IS DISTINCT FROM OLD.care_support_note)
  THEN
    RAISE EXCEPTION 'minor_profile_self_edit_forbidden'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

-- Column privileges. RLS is per row, so it cannot hide three columns; column
-- privileges are the only mechanism and they are not subtractive. Migration 166
-- granted table-level SELECT to both API roles, so narrowing means revoking that
-- and re-granting an explicit allowlist of every OTHER column.
--
-- DANGER: migration 166 also left `ALTER DEFAULT PRIVILEGES ... GRANT ALL ON
-- TABLES`, and any future migration repeating `GRANT ALL ON ALL TABLES IN SCHEMA
-- public` would silently re-open these three columns. The guard test
-- `src/__tests__/db/profilesCarePrivilegeAllowlist.test.ts` is what enforces both
-- that and the reverse hazard (a new column left out of the list below).
--
-- Only SELECT is narrowed. INSERT / UPDATE / DELETE keep their table-level
-- grants so every existing RLS write policy behaves exactly as before, and
-- service_role is untouched because the authorized loader reads with it.
REVOKE SELECT ON public.profiles FROM authenticated, anon;

GRANT SELECT (
  id,
  role,
  first_name,
  last_name,
  dni_or_passport,
  phone,
  birth_date,
  created_at,
  updated_at,
  age_years,
  assigned_teacher_id,
  avatar_url,
  enrollment_fee_exempt,
  enrollment_exempt_authorized_by,
  enrollment_exempt_at,
  enrollment_exempt_reason,
  last_enrollment_paid_at,
  last_session_start_at,
  churn_notified_at,
  engagement_points,
  is_minor,
  next_exam_at,
  student_portal_next_event_at,
  student_portal_next_event_label,
  billing_adult_transition_pending,
  calendar_feed_token,
  home_address_text,
  home_place_id,
  has_care_notes,
  care_updated_at,
  care_updated_by
) ON public.profiles TO authenticated, anon;
```

- [ ] **Step 3: Verify**

```bash
npx vitest run src/__tests__/db/student_care_notes_migration.test.ts
```

**Do not run the migration.** Applying it is the user's call.

---

### Task 2: The guard test that keeps the allowlist honest

This is the mitigation D12 promises, and without it the allowlist is a landmine: a column added in some future migration and forgotten here becomes invisible to the whole app, and a future blanket grant re-opens the notes. The spec wanted `has_column_privilege` against a live stack; this repo has no such harness (every test in `src/__tests__/db/` reads SQL as text and says so). A static test that **derives** the column list from the migrations catches both failure modes without a database.

**Files:**
- Create: `src/__tests__/db/profilesCarePrivilegeAllowlist.test.ts`

**Interfaces:**
- Consumes: `supabase/migrations/*.sql` (all of them).
- Produces: nothing — it is a guard.

- [ ] **Step 1: Write the test**

```ts
/** @vitest-environment node */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATIONS_DIR = join(process.cwd(), "supabase/migrations");
const CARE_NOTES = ["care_health_note", "care_diet_note", "care_support_note"];

function migrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d+_.*\.sql$/.test(f))
    .sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10));
}

/** Every column `public.profiles` has, reconstructed from the migrations. */
function profilesColumns(): Set<string> {
  const cols = new Set<string>();
  for (const file of migrationFiles()) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");

    const created = /CREATE TABLE (?:IF NOT EXISTS )?public\.profiles\s*\(([\s\S]*?)\n\);/i.exec(sql);
    if (created) {
      for (const line of created[1].split("\n")) {
        const m = /^\s*([a-z_][a-z0-9_]*)\s+[a-z]/i.exec(line);
        if (m && !/^(constraint|primary|unique|foreign|check)$/i.test(m[1])) cols.add(m[1]);
      }
    }

    for (const alter of sql.matchAll(
      /ALTER TABLE (?:ONLY )?public\.profiles([\s\S]*?);/gi,
    )) {
      for (const add of alter[1].matchAll(
        /ADD COLUMN (?:IF NOT EXISTS )?([a-z_][a-z0-9_]*)/gi,
      )) {
        cols.add(add[1]);
      }
    }
  }
  return cols;
}

/** The column list inside `GRANT SELECT ( ... ) ON public.profiles`. */
function grantedColumns(): Set<string> {
  for (const file of migrationFiles().reverse()) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    const m = /GRANT SELECT\s*\(([\s\S]*?)\)\s*ON public\.profiles/i.exec(sql);
    if (m) {
      return new Set(
        m[1]
          .split(",")
          .map((c) => c.replace(/--.*$/gm, "").trim())
          .filter(Boolean),
      );
    }
  }
  return new Set();
}

describe("profiles care-note column privileges", () => {
  it("grants SELECT on every profiles column except the three care notes", () => {
    const all = profilesColumns();
    const granted = grantedColumns();

    // Sanity: the reconstruction found a real table, not an empty regex match.
    expect(all.size).toBeGreaterThan(20);
    expect(all.has("id")).toBe(true);

    const expected = [...all].filter((c) => !CARE_NOTES.includes(c)).sort();
    expect([...granted].sort()).toEqual(expected);
  });

  it("never grants SELECT on a care note", () => {
    const granted = grantedColumns();
    for (const col of CARE_NOTES) expect(granted.has(col)).toBe(false);
  });

  it("no migration after 181 re-opens the columns with a blanket grant", () => {
    const offenders = migrationFiles()
      .filter((f) => Number.parseInt(f, 10) > 181)
      .filter((f) =>
        /GRANT\s+(ALL|SELECT)[\s\S]{0,80}ON ALL TABLES IN SCHEMA public/i.test(
          readFileSync(join(MIGRATIONS_DIR, f), "utf8"),
        ),
      );

    // A blanket grant would restore table-level SELECT and silently expose the
    // care notes again. If you genuinely need one, re-apply the allowlist in the
    // same migration and add that file here with a comment saying why.
    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 2: Prove the guard actually guards**

Do this by hand, then undo it — a guard nobody has seen fail is a guard nobody can trust.

1. Delete one column (say `avatar_url`) from the `GRANT SELECT` list in migration 181 → the first test must fail.
2. Restore it. Add `care_diet_note` to the list → the second test must fail.
3. Restore it. Create a scratch file `supabase/migrations/999_scratch.sql` containing `GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;` → the third test must fail. Delete the scratch file.

- [ ] **Step 3: Verify**

```bash
npx vitest run src/__tests__/db/profilesCarePrivilegeAllowlist.test.ts
```

---

### Task 3: Who may read the detail (pure predicate)

D14 says one door. This is the lock on it, kept pure so every branch is cheap to test.

**Files:**
- Create: `src/lib/students/care/careViewerAccess.ts`
- Test: `src/__tests__/lib/students/care/careViewerAccess.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type CareViewerFacts = { isAdmin: boolean; isTutorOfStudent: boolean; sharesSectionWithStudent: boolean; isStudentThemselves: boolean }`
  - `type CareViewerRole = "admin" | "tutor" | "section_staff" | null`
  - `resolveCareViewerRole(facts: CareViewerFacts): CareViewerRole` — the reason access was granted, or `null` for denied.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import {
  resolveCareViewerRole,
  type CareViewerFacts,
} from "@/lib/students/care/careViewerAccess";

const NOBODY: CareViewerFacts = {
  isAdmin: false,
  isTutorOfStudent: false,
  sharesSectionWithStudent: false,
  isStudentThemselves: false,
};

describe("resolveCareViewerRole", () => {
  it("lets an admin in", () => {
    expect(resolveCareViewerRole({ ...NOBODY, isAdmin: true })).toBe("admin");
  });

  it("lets the student's own tutor in", () => {
    expect(resolveCareViewerRole({ ...NOBODY, isTutorOfStudent: true })).toBe("tutor");
  });

  it("lets a teacher or assistant of one of the student's sections in", () => {
    expect(resolveCareViewerRole({ ...NOBODY, sharesSectionWithStudent: true })).toBe(
      "section_staff",
    );
  });

  it("denies a teacher who does not share a section with the student", () => {
    expect(resolveCareViewerRole(NOBODY)).toBeNull();
  });

  it("denies the student themselves", () => {
    // Care notes are written about a student by the adults around them; a minor
    // reading their own file is a conversation, not a database read.
    expect(resolveCareViewerRole({ ...NOBODY, isStudentThemselves: true })).toBeNull();
  });

  it("reports the strongest reason when several apply", () => {
    expect(
      resolveCareViewerRole({
        ...NOBODY,
        isAdmin: true,
        isTutorOfStudent: true,
        sharesSectionWithStudent: true,
      }),
    ).toBe("admin");
  });
});
```

- [ ] **Step 2: Implement** `src/lib/students/care/careViewerAccess.ts` so the test passes. Keep it a plain function over the facts — no Supabase import in this file.

- [ ] **Step 3: Verify** `npx vitest run src/__tests__/lib/students/care/careViewerAccess.test.ts`

---

### Task 4: The single authorized loader

**Files:**
- Create: `src/lib/students/care/loadStudentCareNotes.ts`
- Test: `src/__tests__/lib/students/care/loadStudentCareNotes.test.ts`

**Interfaces:**
- Consumes: `resolveCareViewerRole` (Task 3).
- Produces:
  - `type StudentCareNotes = { healthNote: string | null; dietNote: string | null; supportNote: string | null; updatedAt: string | null; updatedByName: string | null }`
  - `loadStudentCareNotes(viewerId: string, studentId: string): Promise<{ ok: true; notes: StudentCareNotes; viewerRole: CareViewerRole } | { ok: false; reason: "forbidden" | "not_found" | "failed" }>`

**How it must work:**
- Gather the facts with the **request-scoped** client (`createClient()`): admin via `resolveIsAdminSession`, tutor via `tutor_student_rel`, section overlap via the student's `section_enrollments` rows crossed with the viewer's sections (reuse `loadTeacherSectionIdsForUser` and `userIsSectionTeacherOrAssistant` rather than writing new SQL).
- Only after `resolveCareViewerRole` returns non-null, read the three notes with **`createAdminClient()`** — `authenticated` no longer has the privilege, so the service client is the point.
- On denial: `logServerAuthzDenied("loadStudentCareNotes", { studentId })` and return `forbidden`. **Never** put note text in the log or in the returned message.
- Name columns explicitly: `care_health_note, care_diet_note, care_support_note, care_updated_at, care_updated_by`.

- [ ] **Step 1: Write the failing test** with boundary mocks (mock `@/lib/supabase/server`, `@/lib/supabase/admin`, `@/lib/auth/resolveIsAdminSession` and the section helpers). Cover, at minimum:
  - admin reads the notes;
  - the student's tutor reads the notes;
  - a teacher of a section the student is enrolled in reads the notes;
  - an unrelated teacher is denied **and the admin client is never called** (this is the assertion that proves the door is actually shut, not merely that the caller was told "no");
  - a missing student returns `not_found`;
  - a Supabase error returns `failed` and does not throw.

- [ ] **Step 2: Implement** the loader.
- [ ] **Step 3: Verify** the test file.

---

### Task 5: Admin save action

**Files:**
- Create: `src/app/[locale]/dashboard/admin/users/saveStudentCareNotesAction.ts`
- Modify: `src/app/[locale]/dashboard/admin/users/adminUserDetailActions.ts` (re-export from the barrel, as the other detail actions do)
- Test: `src/__tests__/app/saveStudentCareNotesAction.test.ts`

**Interfaces:**
- Produces: `saveStudentCareNotesAction(input: { locale: string; targetUserId: string; healthNote: string; dietNote: string; supportNote: string }): Promise<{ ok: boolean; message?: string }>`

**How it must work:**
- `assertAdmin()` first; on throw, `logServerAuthzDenied("saveStudentCareNotesAction")` and return the forbidden message.
- Zod: `targetUserId` a uuid, each note `z.string().trim().max(2000)`. Empty string is how a note gets cleared.
- Verify the target is a **student** before writing; refuse otherwise.
- Write with `createAdminClient()`, stamping `care_updated_at: new Date().toISOString()` and `care_updated_by: <admin id>`. Let the trigger set `has_care_notes`.
- `recordSystemAudit({ action: "student_care_notes_update", resourceType: "profiles", resourceId: targetUserId, payload: { … } })` — the payload records **which** notes changed as booleans (`healthChanged: true`), never the text.
- `revalidatePath(\`/${locale}/dashboard/admin/users/${targetUserId}\`)`.

- [ ] **Step 1: Write the failing test** covering: non-admin refused with no write; invalid uuid; a non-student target refused; a successful save (assert the patch shape **and** that `care_updated_by` is the admin's id); audit called with booleans and **no note text anywhere in the payload**; a Supabase error surfaced as `ok: false`.
- [ ] **Step 2: Implement** the action and re-export it.
- [ ] **Step 3: Verify.**

---

### Task 6: Copy for the care UI

Flat keys, per deviation P3. Follow the `detail*` convention of `admin.users` and the `ward*` convention of `dashboard.parent`.

**Files:**
- Modify: `src/dictionaries/en.json`, `src/dictionaries/es.json`, `src/dictionaries/pt.json`

**Keys under `admin.users`:** `detailTabCare`, `detailCardCare`, `detailCareLead`, `detailFieldCareHealth`, `detailFieldCareDiet`, `detailFieldCareSupport`, `detailCareHealthHint`, `detailCareDietHint`, `detailCareSupportHint`, `detailCareEmpty`, `detailCareUpdatedBy`, `detailCareSaved`, `detailErrCareSave`, `detailCareBadge`, `detailCareForbidden`.

**Keys under `dashboard.parent`:** `wardCareTitle`, `wardCareLead`, `wardCareHealth`, `wardCareDiet`, `wardCareSupport`, `wardCareSaved`.

Spanish is the source of truth for tone; translate to English and Portuguese from it. Suggested Spanish, to be confirmed with the user before tripling:

| Key | Español |
|---|---|
| `detailTabCare` | Cuidados |
| `detailCardCare` | Información de cuidado |
| `detailCareLead` | Solo la ve la administración, el tutor del alumno y los docentes de sus grupos. |
| `detailFieldCareHealth` | Condición de salud |
| `detailFieldCareDiet` | Alimentación |
| `detailFieldCareSupport` | Trato especial |
| `detailCareHealthHint` | Alergias, medicación, qué hacer en una urgencia. |
| `detailCareDietHint` | Alimentos que no puede comer o que necesita. |
| `detailCareSupportHint` | Apoyos o adaptaciones que necesita en clase. |
| `detailCareEmpty` | Sin información cargada. |
| `detailCareUpdatedBy` | Actualizado por {name} el {date} |
| `detailCareSaved` | Información de cuidado guardada |
| `detailErrCareSave` | No se pudo guardar la información de cuidado |
| `detailCareBadge` | Requiere atención especial |
| `detailCareForbidden` | No tenés permiso para ver esta información. |

- [ ] **Step 1:** Confirm the Spanish with the user, then add all three locales.
- [ ] **Step 2: Verify parity** — the key sets of `admin.users` and `dashboard.parent` must be identical across `en`/`es`/`pt`, and `npx tsc --noEmit` must pass.

---

### Task 7: `StudentCareBadge`

A marker, not a disclosure: it says a student needs attention and nothing about what.

**Files:**
- Create: `src/components/molecules/StudentCareBadge.tsx`
- Test: `src/__tests__/molecules/StudentCareBadge.test.tsx`

**Interfaces:**
- Produces: `StudentCareBadge({ label }: { label: string })` — renders nothing meaningful beyond an icon with `title` and `aria-label` set to `label`.

Imitate the debt badge in `AcademicSectionRosterTable.tsx` (lines 154–166): an inline `<span>` with a Lucide icon, `title` and `aria-label` from the dictionary. Use `HeartPulse`.

- [ ] **Step 1: Write the failing test** — asserts an accessible name equal to `label`, and asserts the rendered output contains no note text (it takes none, which is the point; the test documents the intent).
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Verify.**

---

### Task 8: Care tab in the admin ficha

**Files:**
- Modify: `src/components/molecules/AdminUserProfileTabButton.tsx` (add `"care"` to `AdminUserProfileTabId`)
- Modify: `src/components/molecules/buildAdminUserProfileTabs.tsx` (student block only)
- Modify: `src/components/molecules/AdminUserProfileFicha.tsx` (dispatch branch)
- Create: `src/components/molecules/AdminUserCarePanel.tsx`
- Test: `src/__tests__/molecules/AdminUserCarePanel.test.tsx`
- Test: modify `src/__tests__/components/AdminUserProfileFicha.test.tsx`

**Notes that will save you time:**
- The `family` tab is **not** student-only — it also renders for `role === "parent"`. Put `care` inside the `if (detail.role === "student")` block (lines 44–63), after `family`.
- Tabs are **client state** (`useState` in the ficha), not URL params. Nothing to wire in the router.
- The panel gets its data as props from the server load; it does not fetch.
- Copy the save UX from `AdminUserHomeAddressField.tsx`: local draft state, one Save button, `onFeedback(msg, ok)` up to the ficha's toast, then `router.refresh()`.

- [ ] **Step 1: Write the failing tests** — the panel renders the three textareas with their labels, shows `detailCareEmpty` when everything is blank, shows the "updated by" line only when there is a stamp, calls the action with the trimmed drafts on save, and reports the error message on failure. In the ficha test, assert the care tab appears for a student and **not** for a parent.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Verify** both files.

---

### Task 9: Loading care into the ficha, and the hero badge

**Files:**
- Modify: `src/lib/dashboard/loadAdminUserDetail.ts` (add `has_care_notes` to the profile select at line 102; extend the VM)
- Modify: `src/app/[locale]/dashboard/admin/users/[userId]/page.tsx` (call `loadStudentCareNotes` for students and pass the result down)
- Modify: `src/components/molecules/AdminUserIdentityHero.tsx` (badge next to `{displayName}`, lines 60–69)
- Modify: the props chain `AdminUserDetailEntry` → `AdminUserDetailDesktop` / `AdminUserDetailPwa` → `AdminUserDetailPanel` → `AdminUserProfileFicha`
- Test: modify `src/__tests__/lib/dashboard/...` detail loader test if one asserts the select, and `src/__tests__/components/AdminUserProfileFicha.test.tsx`

`loadAdminUserDetail` already reads with `createAdminClient()`, so `has_care_notes` costs nothing extra. The note **text** still comes from `loadStudentCareNotes` and only for students — one door, per D14.

- [ ] **Step 1:** Extend the loader and VM; add the badge; thread the props.
- [ ] **Step 2: Verify** with `npx tsc --noEmit` and the touched test files.

---

### Task 10: Badges on the rosters and the attendance grid

Three loaders, three row types, three components. Each loader already names its columns, so this is one field added in each.

**Files:**
- Modify: `src/lib/dashboard/loadTeacherSectionAttendanceMatrix.ts` (line 65 select → add `has_care_notes`), `src/types/teacherAttendanceMatrix.ts` (`hasCareNotes` on the row), `src/components/organisms/TeacherAttendanceMatrixGridRow.tsx` (badge beside `row.studentLabel`, line 50)
- Modify: `src/lib/academics/loadAdminSectionPageData.ts` (line 136 select), `src/types/sectionRoster.ts`, `src/components/organisms/AcademicSectionRosterTable.tsx` (beside `{r.label}`, line 156)
- Modify: `src/lib/academics/loadTeacherSectionDetailModel.ts` (line 57 select), `src/types/teacherPortal.ts`, `src/components/molecules/TeacherRosterStudentRow.tsx` (beside `{label}`, line 43)
- Test: the existing tests for those loaders and components; add assertions rather than new files where a test already exists.

The attendance grid is shared by teacher, assistant **and** admin pages, so one change covers all three.

- [ ] **Step 1: Write the failing assertions** — each loader maps `has_care_notes` onto the row; each component renders the badge only when the flag is true.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Verify** the touched test files.

---

### Task 11: Family portal — read and write

The trap here is P4: the parent edit page currently reads the ward with the **session** client, which after Task 1 can no longer see the note columns.

**Files:**
- Modify: `src/app/[locale]/dashboard/parent/child/edit/actions.ts` (`updateWardProfile`)
- Modify: `src/app/[locale]/dashboard/parent/child/edit/page.tsx` (load care through `loadStudentCareNotes`)
- Modify: `src/components/parent/ParentWardProfileForm.tsx` (three textareas)
- Test: `src/__tests__/app/updateWardProfile*.test.ts` (extend), `src/__tests__/components/parent/ParentWardProfileForm*.test.tsx` (extend or create)

**How it must work:**
- Add `care_health_note`, `care_diet_note`, `care_support_note` to the zod schema as `z.string().trim().max(2000)`.
- The existing tutor check (`tutor_student_rel` row for `tutor_id = user.id`) already authorizes the write; do not weaken it.
- The profile `update` at lines 112–120 uses the session client. Writing the care columns that way is fine — only `SELECT` was narrowed — but the update must **not** chain `.select()`, or PostgREST will try to read back a column the role cannot see.
- Stamp `care_updated_at` / `care_updated_by: <parent id>`.
- Audit with `auditIdentityAction` (P5), booleans only, never the text.
- The page's ward `select` at line 34 stays as it is for name/phone/birth date; care values come from `loadStudentCareNotes(user.id, studentId)`.

- [ ] **Step 1: Write the failing tests** — a tutor saves care notes; a non-tutor is refused; the update does not chain `.select()`; the audit payload carries no note text.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Verify.**

---

### Task 12: Full gate

- [ ] **Step 1: Regression sweep.** `REGRESSION CHECK` — anything that reads `profiles` from the `authenticated` role. Search for `from("profiles")` across `src/**` and confirm every call names its columns and none of them names a care note. This is the failure mode that would break unrelated screens in production, and it is cheap to check now.

```bash
rg -n 'from\("profiles"\)' src --glob '!src/__tests__/**' -A3 | rg -n 'select\(' -A1
```

- [ ] **Step 2: Full local gate.**

```bash
npx tsc --noEmit
npm run lint
npx vitest run
```

- [ ] **Step 3: End-to-end, including the live privilege check.** Add to `e2e/critical-academic.spec.ts` (or the closest existing admin spec) a check that an admin can open the care tab of a student, save a note, and see the badge appear next to the name. Reuse an existing spec that already logs in as admin rather than creating a new file.

In the same spec, verify the column privilege **for real**. This is the half the static guard cannot do: it proves the `REVOKE`/`GRANT` actually took effect in the database, not just that the migration text says so. The e2e stack is the repo's only live-Postgres path, and it already has an authenticated session, so no new dependency is needed — query PostgREST from the browser session as that user:

```ts
// A logged-in admin is still the `authenticated` Postgres role: PostgREST must
// refuse the column outright, no matter what RLS would have allowed row-wise.
const denied = await adminPage.evaluate(async () => {
  const res = await fetch("/api/e2e/probe-care-column", { method: "POST" });
  return res.status;
});
expect(denied).toBe(403);
```

If no suitable probe route exists, assert it through the UI instead: a teacher who does **not** share a section with the student opens that student and sees `detailCareForbidden` rather than any note text. Whichever form you choose, the assertion must fail if migration 181's `REVOKE` is removed — verify that by hand once, the same way Task 2 Step 2 does.

- [ ] **Step 4: Hand back to the user.** The migration is **not** applied and nothing is committed without an explicit go-ahead.

---

## Definition of done for this plan

- An admin can record and edit health, dietary and special-support notes from the student's ficha, and see who last changed them and when.
- A tutor can do the same for their own ward from the family portal.
- Everywhere staff read a student's name — ficha hero, section rosters, attendance grid — a discreet badge appears when that student has care notes, with no extra query and no detail leaked.
- The note text is unreadable to the `authenticated` and `anon` roles at the database level; the only path to it is `loadStudentCareNotes`, which authorizes admin, tutor, or section staff and logs every denial.
- A linked minor cannot edit their own care notes.
- The static guard fails if a future column is left out of the allowlist, if a care note is ever added to it, or if a later migration re-opens `profiles` with a blanket grant — and it has been seen to fail for all three.
- The e2e check proves the privilege took effect in the live database, and has been seen to fail with migration 181's `REVOKE` removed.
- No care note text appears in any log, audit payload or error message.
- `npx tsc --noEmit`, `npm run lint` and `npx vitest run` are clean.
