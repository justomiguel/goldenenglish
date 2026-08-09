# Section Enrollment Link Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every academic section a revocable, unguessable link that a teacher shares with families so they enter their own data, arriving in the admin registrations inbox already bound to that section.

**Architecture:** Three columns on `academic_sections` hold the token and its state; one column on `registrations` records which link produced a lead. A `SECURITY DEFINER` RPC resolves a token to its section for anonymous visitors. The public page at `/[locale]/i/[token]` reuses the six existing tenant registration surfaces through an extracted dispatch, and `RegisterForm` gains one optional prop that swaps the section `<select>` for a read-only card and posts to a token-scoped server action. A shared panel on the teacher and admin section screens generates, copies, shares, deactivates and rotates the link.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS 4 (CSS variables), Supabase Postgres + RLS, Zod, Vitest + React Testing Library, Playwright, Lucide icons.

**Spec:** `docs/superpowers/specs/2026-08-08-section-enrollment-link-design.md`

## Global Constraints

- **Spec authority.** Every decision traces to the spec above. A link produces a `registrations` lead, never an auth user, profile or `section_enrollments` row.
- **Commits.** The repo owner commits only at the end of the whole feature. Each task therefore ends with a **verification gate** (tests + `npx tsc --noEmit`) instead of a commit. Do not run `git commit`.
- **`RegisterForm` must not be forked** per tenant, and no registration surface may fall back to the classic layout on a branded tenant (rule `28-tenant-register-surface.mdc`). The token page reuses the same surfaces as `/register`.
- **No user-visible literals in components.** Every string comes from `src/dictionaries/en.json` + `es.json` + `pt.json` with an identical key shape. `Dictionary` derives from `en.json`, so a key missing there fails the build (rule `09-i18n-copy.mdc`).
- **Server-side authorization only.** Server actions verify the caller before any mutation and never trust a client-supplied section id or token (rules `04-security.mdc`, `17-trust-boundary-handlers.mdc`).
- **Supabase only through `src/lib/supabase/`** — `createAdminClient()` for privileged writes, `createClient()` for request-scoped reads, `createAnonReadOnlyClient()` for cookieless public reads (rule `12-supabase-app-boundaries.mdc`, enforced by `scripts/check-supabase-boundaries.mjs`).
- **Bounded queries.** No `select("*")`; always named columns (rule `13-postgrest-pagination-bounded-queries.mdc`).
- **Migrations are additive only** — no `DROP COLUMN`, `DROP TABLE` or `TRUNCATE` (rule `21-migrations-production-no-data-destruction.mdc`).
- **Post-mutation refresh:** `revalidatePath` on the server plus `router.refresh()` on the client (rule `27-post-mutation-ui-refresh.mdc`).
- **Structured error logging** via `src/lib/logging/serverActionLog.ts` with stable `scope` strings and no PII in `meta` (rule `25-server-error-logging.mdc`). A family's name, document, email and phone are all PII; a section id and a boolean are not.
- **Buttons and CTA links carry a leading Lucide icon** plus an accessible name (rule `16-admin-buttons-icons.mdc`).
- **No `alert` / `confirm` / `prompt`** — use the repo's `Modal`, toasts and banners (rule `18-no-native-browser-dialogs.mdc`).
- **Touch targets ≥ 44 px** on public and portal surfaces (rule `05-pwa-mobile-native.mdc`).
- **Files stay under 250 lines** (rule `03-architecture.mdc`); split by responsibility when one grows.
- **Tests are self-contained** — every file under `src/__tests__/` runs alone with local mocks and no shared mutable state (rule `30-harness-self-contained-tests.mdc`).
- **Commands:** `npx vitest run <path>` for one file, `npx tsc --noEmit`, `npm run lint`.

---

### Task 1: Migration 182 — the token table, the RPCs and the anon revoke

Adds the storage and the four database functions the rest of the plan consumes. Nothing user-visible ships in this task.

**The token lives in its own table, not on `academic_sections`.** A first attempt put three token columns on the sections table, and a probe on the local database proved that unusable: migration 166 runs `GRANT ALL ON ALL TABLES IN SCHEMA public TO anon`, and row-level security filters rows, not columns. Any section row an anonymous visitor may read exposes every column of that row, so the token of any current-cohort section could be harvested in bulk with one anonymous query. A dedicated table with no grants and no policies is the fix.

**Files:**
- Create: `supabase/migrations/182_section_enrollment_links.sql`
- Test: `src/__tests__/db/section_enrollment_links_migration.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces, for later tasks:
  - Table `public.section_enrollment_links (section_id, token, is_active, created_by, created_at, updated_at)` — RLS on, zero policies, all privileges revoked from `anon` and `authenticated`.
  - Column `registrations.source_section_link_id UUID` referencing `academic_sections(id)`.
  - `resolve_section_enrollment_link(p_token uuid)` → rows of `(section_id uuid, section_name text, cohort_name text, schedule_slots jsonb, seats_remaining int)`; zero rows when the link is unusable. Granted to `anon`, `authenticated`.
  - `section_enrollment_link_is_open(p_section_id uuid, p_token uuid)` → `boolean`. Granted to `anon`, `authenticated`.
  - `section_enrollment_link_lead_count(p_section_id uuid)` → `bigint`. Granted to `authenticated` only.
  - `section_enrollment_link_state(p_section_id uuid)` → rows of `(token uuid, is_active boolean, lead_count bigint)`; zero rows unless the caller is an admin or staff of that section. Granted to `authenticated` only.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/db/section_enrollment_links_migration.test.ts`:

```ts
/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("182_section_enrollment_links.sql", () => {
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/migrations/182_section_enrollment_links.sql"),
    "utf-8",
  );

  it("creates the dedicated token table keyed by section", () => {
    expect(sql).toMatch(
      /CREATE TABLE IF NOT EXISTS public\.section_enrollment_links/,
    );
    expect(sql).toMatch(/section_id UUID PRIMARY KEY/);
    expect(sql).toMatch(/token UUID NOT NULL DEFAULT gen_random_uuid\(\)/);
    expect(sql).toMatch(/is_active BOOLEAN NOT NULL DEFAULT true/);
  });

  it("makes the token unique", () => {
    expect(sql).toMatch(
      /CREATE UNIQUE INDEX IF NOT EXISTS section_enrollment_links_token_key/,
    );
  });

  // The whole security model rests on this. Migration 166's ALTER DEFAULT PRIVILEGES
  // grants ALL on newly created tables to anon and authenticated automatically, so a
  // new table is exposed the moment it exists unless the migration revokes explicitly.
  it("keeps the token table unreachable from any browser session", () => {
    expect(sql).toMatch(
      /ALTER TABLE public\.section_enrollment_links ENABLE ROW LEVEL SECURITY/,
    );
    expect(sql).toMatch(
      /REVOKE ALL ON public\.section_enrollment_links FROM anon, authenticated/,
    );
    expect(sql).not.toMatch(/CREATE POLICY \w+ ON public\.section_enrollment_links/);
    expect(sql).not.toMatch(
      /GRANT \w+ ON public\.section_enrollment_links TO (anon|authenticated)/,
    );
  });

  // Pre-existing hole, fixed here by the repo owner's decision: table-wide grants plus
  // row-only RLS let anon read every column of every current-cohort section.
  it("revokes the anon read on academic_sections", () => {
    expect(sql).toMatch(/REVOKE SELECT ON public\.academic_sections FROM anon/);
  });

  it("adds the lead attribution column to registrations", () => {
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS source_section_link_id UUID/);
  });

  it("exposes the resolve function to anonymous visitors", () => {
    expect(sql).toMatch(
      /CREATE OR REPLACE FUNCTION public\.resolve_section_enrollment_link\(p_token uuid\)/,
    );
    expect(sql).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.resolve_section_enrollment_link\(uuid\) TO anon/,
    );
  });

  it("only resolves an active token on a live section and cohort", () => {
    expect(sql).toMatch(/l\.is_active = true/);
    expect(sql).toMatch(/s\.archived_at IS NULL/);
    expect(sql).toMatch(/c\.archived_at IS NULL/);
  });

  it("keeps the staff-only functions away from anonymous visitors", () => {
    for (const fn of [
      "section_enrollment_link_lead_count",
      "section_enrollment_link_state",
    ]) {
      expect(sql).toMatch(
        new RegExp(`REVOKE ALL ON FUNCTION public\\.${fn}\\(uuid\\) FROM PUBLIC`),
      );
      // Migration 166 grants EXECUTE to anon directly, so FROM PUBLIC is not enough.
      expect(sql).toMatch(
        new RegExp(`REVOKE ALL ON FUNCTION public\\.${fn}\\(uuid\\) FROM anon`),
      );
      expect(sql).toMatch(
        new RegExp(`GRANT EXECUTE ON FUNCTION public\\.${fn}\\(uuid\\) TO authenticated`),
      );
    }
  });

  it("gates the state function on admin or section staff", () => {
    expect(sql).toMatch(
      /CREATE OR REPLACE FUNCTION public\.section_enrollment_link_state\(p_section_id uuid\)/,
    );
    expect(sql).toMatch(/public\.is_admin\(auth\.uid\(\)\)/);
    expect(sql).toMatch(
      /public\.user_leads_or_assists_section\(auth\.uid\(\), p_section_id\)/,
    );
  });

  it("is additive: no destructive statement on existing data", () => {
    expect(sql).not.toMatch(/\bTRUNCATE\b/i);
    expect(sql).not.toMatch(/\bDROP TABLE\b/i);
    expect(sql).not.toMatch(/\bDROP COLUMN\b/i);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/__tests__/db/section_enrollment_links_migration.test.ts`
Expected: FAIL. If a previous attempt left a `182_section_enrollment_links.sql` on disk with the old column-based design, the failures are assertion failures rather than `ENOENT`; either way, do not proceed until they are red for the right reason.

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/182_section_enrollment_links.sql`, replacing any earlier attempt wholesale:

```sql
-- Shareable per-section enrollment link: a teacher sends it to families, the family
-- fills in its own data, and the lead lands in the admin inbox bound to that section.
-- Spec: docs/superpowers/specs/2026-08-08-section-enrollment-link-design.md
--
-- The token lives in its own table rather than on academic_sections. Migration 166 runs
-- GRANT ALL ON ALL TABLES TO anon, and RLS filters rows, not columns — so a token stored
-- on a section row would be readable by any anonymous visitor who may read that section,
-- which is every current-cohort section. Measured on a local database before this was
-- rewritten: one anonymous query returned the token.

CREATE TABLE IF NOT EXISTS public.section_enrollment_links (
  section_id UUID PRIMARY KEY
    REFERENCES public.academic_sections (id) ON DELETE CASCADE,
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NULL REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.section_enrollment_links IS
  'Public enrollment link per section. Unreachable over PostgREST by design: read through SECURITY DEFINER functions, written by the service role behind a server-side authorization gate.';
COMMENT ON COLUMN public.section_enrollment_links.is_active IS
  'False disables the link without discarding the row, so it can be turned back on.';

CREATE UNIQUE INDEX IF NOT EXISTS section_enrollment_links_token_key
  ON public.section_enrollment_links (token);

-- Default deny: RLS on, and deliberately no policies at all.
ALTER TABLE public.section_enrollment_links ENABLE ROW LEVEL SECURITY;

-- Not redundant with the absent policies. Migration 166's ALTER DEFAULT PRIVILEGES
-- grants ALL on newly created tables to anon and authenticated, so without this the
-- table would carry table-level privileges from the moment it is created.
REVOKE ALL ON public.section_enrollment_links FROM anon, authenticated;

-- Pre-existing exposure, fixed here by the repo owner's decision. Grants are table-wide
-- while RLS filters only rows, so anon could read every column of every current-cohort
-- section, not just the identity migrations 030 and 034 meant to expose. Verified on a
-- local database that nothing public needs this read: list_registration_section_options()
-- and resolve_section_enrollment_link() are SECURITY DEFINER and still work, and the
-- anonymous insert into registrations still passes its foreign key check, because
-- referential integrity checks bypass row security exactly as PostgreSQL documents
-- (migration 030's comment claiming otherwise is wrong). Every direct read of this table
-- in src/ is on an authenticated path.
REVOKE SELECT ON public.academic_sections FROM anon;

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS source_section_link_id UUID NULL
    REFERENCES public.academic_sections (id) ON DELETE SET NULL;

COMMENT ON COLUMN public.registrations.source_section_link_id IS
  'Section whose enrollment link produced this lead; null for the public /register form.';

CREATE INDEX IF NOT EXISTS registrations_source_section_link_idx
  ON public.registrations (source_section_link_id)
  WHERE source_section_link_id IS NOT NULL;

-- Public resolution of a token. SECURITY DEFINER so anonymous visitors never need a
-- grant or a policy on the link table, the sections table or the cohorts table.
-- Returns no rows when the link is unusable, which the app renders as one
-- "no longer available" state.
CREATE OR REPLACE FUNCTION public.resolve_section_enrollment_link(p_token uuid)
RETURNS TABLE (
  section_id UUID,
  section_name TEXT,
  cohort_name TEXT,
  schedule_slots JSONB,
  seats_remaining INT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id,
    s.name,
    c.name,
    s.schedule_slots,
    CASE
      WHEN s.max_students IS NULL THEN NULL
      ELSE GREATEST(
        s.max_students - (
          SELECT count(*)
          FROM public.section_enrollments se
          WHERE se.section_id = s.id
            AND se.status = 'active'
        ),
        0
      )::INT
    END
  FROM public.section_enrollment_links l
  INNER JOIN public.academic_sections s ON s.id = l.section_id
  INNER JOIN public.academic_cohorts c ON c.id = s.cohort_id
  WHERE l.token = p_token
    AND l.is_active = true
    AND s.archived_at IS NULL
    AND c.archived_at IS NULL
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.resolve_section_enrollment_link(uuid) IS
  'Section behind a public enrollment link token, or no rows when the link is inactive, archived or unknown.';

GRANT EXECUTE ON FUNCTION public.resolve_section_enrollment_link(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.resolve_section_enrollment_link(uuid) TO authenticated;

-- Server-side re-check used by the submit action: does this token still open this section?
CREATE OR REPLACE FUNCTION public.section_enrollment_link_is_open(
  p_section_id uuid,
  p_token uuid
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.section_enrollment_links l
    INNER JOIN public.academic_sections s ON s.id = l.section_id
    INNER JOIN public.academic_cohorts c ON c.id = s.cohort_id
    WHERE l.section_id = p_section_id
      AND l.token = p_token
      AND l.is_active = true
      AND s.archived_at IS NULL
      AND c.archived_at IS NULL
  );
$$;

COMMENT ON FUNCTION public.section_enrollment_link_is_open(uuid, uuid) IS
  'True when the token still opens that exact section for public submissions.';

GRANT EXECUTE ON FUNCTION public.section_enrollment_link_is_open(uuid, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.section_enrollment_link_is_open(uuid, uuid) TO authenticated;

-- Pending-lead count for the teacher panel. RLS on registrations is admin-only, so
-- without this the teacher has no way to see the number. Returns a count and nothing
-- else: no names, no documents, no contact details.
CREATE OR REPLACE FUNCTION public.section_enrollment_link_lead_count(p_section_id uuid)
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.is_admin(auth.uid())
      OR public.user_leads_or_assists_section(auth.uid(), p_section_id)
    THEN (
      SELECT count(*)
      FROM public.registrations r
      WHERE r.source_section_link_id = p_section_id
        AND r.status <> 'enrolled'
    )
    ELSE 0::BIGINT
  END;
$$;

COMMENT ON FUNCTION public.section_enrollment_link_lead_count(uuid) IS
  'Pending leads produced by a section enrollment link; zero unless the caller is an admin or section staff.';

REVOKE ALL ON FUNCTION public.section_enrollment_link_lead_count(uuid) FROM PUBLIC;
-- FROM PUBLIC is not enough: migration 166 grants EXECUTE to the anon role directly.
REVOKE ALL ON FUNCTION public.section_enrollment_link_lead_count(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.section_enrollment_link_lead_count(uuid) TO authenticated;

-- The teacher and admin panels manage a link they cannot read directly, because the
-- table has no grants. This is their only window onto it, and it is gated on the same
-- staff check as the count. Returns no rows for anyone else.
CREATE OR REPLACE FUNCTION public.section_enrollment_link_state(p_section_id uuid)
RETURNS TABLE (
  token UUID,
  is_active BOOLEAN,
  lead_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    l.token,
    l.is_active,
    (
      SELECT count(*)
      FROM public.registrations r
      WHERE r.source_section_link_id = p_section_id
        AND r.status <> 'enrolled'
    )
  FROM public.section_enrollment_links l
  WHERE l.section_id = p_section_id
    AND (
      public.is_admin(auth.uid())
      OR public.user_leads_or_assists_section(auth.uid(), p_section_id)
    )
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.section_enrollment_link_state(uuid) IS
  'Token, active flag and pending lead count for a section, for admins and that section''s staff only.';

REVOKE ALL ON FUNCTION public.section_enrollment_link_state(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.section_enrollment_link_state(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.section_enrollment_link_state(uuid) TO authenticated;
```

Note that `section_enrollment_link_state` returns no rows when the section has no link yet, which the loader in Task 7 maps to "not generated". A caller who is not staff also gets no rows, so the two cases are indistinguishable from outside — which is the intent.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/__tests__/db/section_enrollment_links_migration.test.ts`
Expected: PASS, 10 tests.

- [ ] **Step 5: Apply the migration to the local stack**

`section_enrollment_link_lead_count` and `section_enrollment_link_state` call two existing helpers, both verified in the tree: `public.is_admin(uid uuid)` from `001_initial_schema.sql` and `public.user_leads_or_assists_section(p_uid uuid, p_section_id uuid)` from `036_academic_section_assistants_and_staff.sql`. The argument order above matches them.

There is no npm script that applies a single migration locally. Apply it with the database container directly:

```bash
docker exec -i supabase_db_goldenenglish psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
  < supabase/migrations/182_section_enrollment_links.sql
```

Expected: no error, and re-running it is a no-op. Never run the `all-tenants` script — that touches production databases and is the repo owner's call.

If an earlier attempt already added `enrollment_link_token`, `enrollment_link_active` or `enrollment_link_created_by` to `academic_sections` on the local database, drop those three columns from the **local database only** as a one-off cleanup command. Do not put a `DROP COLUMN` in the migration: those columns never reached any tenant, so the migration must simply never mention them.

- [ ] **Step 6: Prove the token is unreachable from a browser session**

This is the assertion the whole feature rests on, and a text test cannot make it. Run it against the local database:

```sql
INSERT INTO public.section_enrollment_links (section_id)
SELECT s.id FROM public.academic_sections s
JOIN public.academic_cohorts c ON c.id = s.cohort_id
WHERE c.is_current = true AND s.archived_at IS NULL AND c.archived_at IS NULL
LIMIT 1
ON CONFLICT (section_id) DO NOTHING;

SET ROLE anon;
SELECT count(*) FROM public.section_enrollment_links;           -- expect: permission denied
SELECT count(*) FROM public.academic_sections;                  -- expect: permission denied
SELECT count(*) FROM public.list_registration_section_options();-- expect: rows, still works
RESET ROLE;

SET ROLE authenticated;
SELECT count(*) FROM public.section_enrollment_links;           -- expect: permission denied
RESET ROLE;
```

Expected: both roles are denied on the link table, `anon` is denied on `academic_sections`, and the registration options RPC still returns rows. Then confirm the public path still resolves a real token end to end:

```sql
SET ROLE anon;
SELECT section_id, section_name FROM public.resolve_section_enrollment_link(
  (SELECT token FROM public.section_enrollment_links LIMIT 1)
);
RESET ROLE;
```

The subselect runs before `SET ROLE` cannot read it, so fetch the token as `postgres` first and paste the literal. Expected: one row.

Finally, clean up the probe row:

```sql
DELETE FROM public.section_enrollment_links;
```

Record every observed result in your report. If any expectation above does not hold, stop and report rather than adjusting the expectation.

- [ ] **Step 7: Make the security claim a repeatable test, not a one-off probe**

Step 6 is a manual probe, and nothing repeats it. Every assertion in the vitest file is a regex over the migration's text, so all ten would still pass against a variant that granted `SELECT` to `anon` or dropped the staff gate — which is exactly how the first attempt's leak slipped through. The repo already solved this for migration 181's column privileges, in `e2e/critical-student-care.spec.ts`: an HTTP request through PostgREST that must come back `42501`. Copy that pattern.

Create `e2e/critical-section-enrollment-link-privileges.spec.ts`:

```ts
import { test, expect } from "@playwright/test";
import { e2eRequireFailureMessage, resolveE2eIsolation } from "./env";

const isolation = resolveE2eIsolation();

/**
 * The static guard in `section_enrollment_links_migration.test.ts` only reads the
 * migration text. This is the half it cannot do: it proves the revokes actually took
 * effect in the running database.
 *
 * The whole feature rests on the token being unguessable. If anon can read the token
 * column, every live link is harvestable — which is precisely what the first version of
 * this migration did, while passing every text assertion.
 *
 * Delete any REVOKE from migration 182 and this test must go red.
 */
test.describe("@critical-section-enrollment-link", () => {
  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) throw new Error(requireFailure);
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
  });

  test("the database refuses to hand out enrollment tokens", async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    test.skip(!url || !anon, "Supabase URL / anon key missing — re-run e2e:stack:up");

    const headers = { apikey: anon!, Authorization: `Bearer ${anon}` };

    // Control: the public registration path still works, so a failure below cannot be
    // blamed on a broken endpoint or a misconfigured key.
    const control = await fetch(`${url}/rest/v1/rpc/list_registration_section_options`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: "{}",
    });
    expect(control.ok).toBe(true);

    // Control: resolving a token is public by design. An unknown token yields an empty
    // list, not an error — that is the "link no longer available" path.
    const resolve = await fetch(
      `${url}/rest/v1/rpc/resolve_section_enrollment_link`,
      {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ p_token: "00000000-0000-0000-0000-000000000000" }),
      },
    );
    expect(resolve.ok).toBe(true);
    expect(await resolve.json()).toEqual([]);

    // The secret itself must be unreachable.
    const tokens = await fetch(
      `${url}/rest/v1/section_enrollment_links?select=token&limit=1`,
      { headers },
    );
    expect(tokens.ok).toBe(false);
    expect(await tokens.text()).toMatch(/42501|permission denied/i);

    // And so must the table that used to carry it.
    const sections = await fetch(`${url}/rest/v1/academic_sections?select=id&limit=1`, {
      headers,
    });
    expect(sections.ok).toBe(false);
    expect(await sections.text()).toMatch(/42501|permission denied/i);

    // Staff-only functions must not be callable without a session.
    for (const fn of [
      "section_enrollment_link_state",
      "section_enrollment_link_lead_count",
    ]) {
      const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          p_section_id: "00000000-0000-0000-0000-000000000000",
        }),
      });
      expect(res.ok, `${fn} must not be callable by anon`).toBe(false);
    }
  });
});
```

Read `e2e/env.ts` first and match whatever helpers it actually exports; the imports above follow `critical-student-care.spec.ts`, but adapt rather than assume.

- [ ] **Step 8: Prove the new test fails when the protection is removed**

A security test nobody has seen fail is not evidence. Temporarily delete the line `REVOKE ALL ON public.section_enrollment_links FROM anon, authenticated;` from the migration, re-apply it to a database where the table has been dropped first so the grants are rebuilt, and confirm the spec goes red. Then restore the line, re-apply, and confirm it goes green again. Record both outcomes in your report.

```bash
npx playwright test e2e/critical-section-enrollment-link-privileges.spec.ts
```

- [ ] **Step 9: Verification gate**

```bash
npx vitest run src/__tests__/db/section_enrollment_links_migration.test.ts
npx tsc --noEmit
```

Expected: tests pass, no type errors. Do not commit.

---

### Task 2: The link context type and its loader

A pure type plus a thin loader that validates the token shape before touching the database, mirroring `loadPublicStudentBadgeShareByToken`.

**Files:**
- Create: `src/lib/register/sectionEnrollmentLink.ts`
- Create: `src/lib/register/loadSectionEnrollmentLink.ts`
- Test: `src/__tests__/lib/register/sectionEnrollmentLink.test.ts`
- Test: `src/__tests__/lib/register/loadSectionEnrollmentLink.test.ts`
- Test: `src/__tests__/lib/academics/sectionScheduleSlots.test.ts` (extend for the cases the link path relies on)

**Interfaces:**
- Consumes: `resolve_section_enrollment_link(p_token uuid)` from Task 1; `parseSectionScheduleSlots` from `@/lib/academics/sectionScheduleSlots` and `SectionScheduleSlot` from `@/types/academics` — the canonical reader of `schedule_slots`, reused rather than duplicated.
- Produces:
  - `interface SectionEnrollmentLinkContext { token: string; sectionId: string; sectionName: string; cohortName: string; scheduleSlots: SectionScheduleSlot[]; seatsRemaining: number | null }`
  - `isSectionEnrollmentLinkToken(value: unknown): value is string`
  - `loadSectionEnrollmentLink(token: string): Promise<SectionEnrollmentLinkContext | null>`

- [ ] **Step 1: Write the failing test for the pure helpers**

Create `src/__tests__/lib/register/sectionEnrollmentLink.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { isSectionEnrollmentLinkToken } from "@/lib/register/sectionEnrollmentLink";

describe("isSectionEnrollmentLinkToken", () => {
  it("accepts a canonical uuid in either case", () => {
    expect(isSectionEnrollmentLinkToken("3f2504e0-4f89-11d3-9a0c-0305e82c3301")).toBe(true);
    expect(isSectionEnrollmentLinkToken("3F2504E0-4F89-11D3-9A0C-0305E82C3301")).toBe(true);
  });

  it("rejects anything that is not a uuid", () => {
    expect(isSectionEnrollmentLinkToken("")).toBe(false);
    expect(isSectionEnrollmentLinkToken("abc")).toBe(false);
    expect(isSectionEnrollmentLinkToken("3f2504e0-4f89-11d3-9a0c-0305e82c33")).toBe(false);
    expect(isSectionEnrollmentLinkToken("../../etc/passwd")).toBe(false);
    expect(isSectionEnrollmentLinkToken(null)).toBe(false);
    expect(isSectionEnrollmentLinkToken(42)).toBe(false);
  });
});

```

Then extend `src/__tests__/lib/academics/sectionScheduleSlots.test.ts` so the canonical parser pins what the link path needs from it — the `HH:MM:SS` trim and dropping a day of `9` are already covered there:

```ts
  it("parseSectionScheduleSlots drops rows with a missing day or a blank time and ignores non-arrays", () => {
    expect(parseSectionScheduleSlots(null)).toEqual([]);
    expect(parseSectionScheduleSlots("nope")).toEqual([]);
    expect(
      parseSectionScheduleSlots([
        { dayOfWeek: 2, startTime: "", endTime: "19:00" },
        { startTime: "18:00", endTime: "19:00" },
        { dayOfWeek: 2, startTime: "18:00", endTime: "19:00" },
      ]),
    ).toEqual([{ dayOfWeek: 2, startTime: "18:00", endTime: "19:00" }]);
  });

  it("parseSectionScheduleSlots sorts surviving rows by weekday then start time", () => {
    expect(
      parseSectionScheduleSlots([
        { dayOfWeek: 3, startTime: "09:00", endTime: "10:00" },
        { dayOfWeek: 1, startTime: "18:00", endTime: "19:00" },
        { dayOfWeek: 1, startTime: "08:00", endTime: "09:00" },
      ]).map((s) => `${s.dayOfWeek}@${s.startTime}`),
    ).toEqual(["1@08:00", "1@18:00", "3@09:00"]);
  });
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/__tests__/lib/register/sectionEnrollmentLink.test.ts`
Expected: FAIL — cannot resolve `@/lib/register/sectionEnrollmentLink`.

- [ ] **Step 3: Write the pure helpers**

Create `src/lib/register/sectionEnrollmentLink.ts`:

```ts
import type { SectionScheduleSlot } from "@/types/academics";

/** The section behind a public enrollment link, as the form and surfaces receive it. */
export interface SectionEnrollmentLinkContext {
  token: string;
  sectionId: string;
  sectionName: string;
  cohortName: string;
  scheduleSlots: SectionScheduleSlot[];
  seatsRemaining: number | null;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Cheap shape gate so a junk path never reaches the database. */
export function isSectionEnrollmentLinkToken(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/__tests__/lib/register/sectionEnrollmentLink.test.ts src/__tests__/lib/academics/sectionScheduleSlots.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing test for the loader**

Create `src/__tests__/lib/register/loadSectionEnrollmentLink.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
const createAnonReadOnlyClient = vi.fn();

vi.mock("@/lib/supabase/anon", () => ({
  createAnonReadOnlyClient: () => createAnonReadOnlyClient(),
}));

const VALID = "3f2504e0-4f89-11d3-9a0c-0305e82c3301";

async function load(token: string) {
  const { loadSectionEnrollmentLink } = await import(
    "@/lib/register/loadSectionEnrollmentLink"
  );
  return loadSectionEnrollmentLink(token);
}

describe("loadSectionEnrollmentLink", () => {
  beforeEach(() => {
    vi.resetModules();
    rpc.mockReset();
    createAnonReadOnlyClient.mockReset();
    createAnonReadOnlyClient.mockReturnValue({ rpc });
  });

  it("never queries when the token is not a uuid", async () => {
    await expect(load("not-a-token")).resolves.toBeNull();
    expect(createAnonReadOnlyClient).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("returns null when the public env is missing", async () => {
    createAnonReadOnlyClient.mockReturnValue(null);
    await expect(load(VALID)).resolves.toBeNull();
  });

  it("maps the resolved row into the link context", async () => {
    rpc.mockResolvedValue({
      data: [
        {
          section_id: "11111111-1111-1111-1111-111111111111",
          section_name: "Sección B",
          cohort_name: "Ciclo 2026",
          schedule_slots: [{ dayOfWeek: 1, startTime: "18:00:00", endTime: "19:30:00" }],
          seats_remaining: 4,
        },
      ],
      error: null,
    });

    await expect(load(VALID)).resolves.toEqual({
      token: VALID,
      sectionId: "11111111-1111-1111-1111-111111111111",
      sectionName: "Sección B",
      cohortName: "Ciclo 2026",
      scheduleSlots: [{ dayOfWeek: 1, startTime: "18:00", endTime: "19:30" }],
      seatsRemaining: 4,
    });
    expect(rpc).toHaveBeenCalledWith("resolve_section_enrollment_link", {
      p_token: VALID,
    });
  });

  it("treats an unlimited section as null seats rather than zero", async () => {
    rpc.mockResolvedValue({
      data: [
        {
          section_id: "11111111-1111-1111-1111-111111111111",
          section_name: "Sección B",
          cohort_name: "Ciclo 2026",
          schedule_slots: [],
          seats_remaining: null,
        },
      ],
      error: null,
    });
    const link = await load(VALID);
    expect(link?.seatsRemaining).toBeNull();
  });

  // A full section must stay 0: collapsing it to null would advertise a section
  // with no cap, so families would see open seats where there are none.
  it("keeps a full section at zero seats instead of unlimited", async () => {
    rpc.mockResolvedValue({
      data: [
        {
          section_id: "11111111-1111-1111-1111-111111111111",
          section_name: "Sección B",
          cohort_name: "Ciclo 2026",
          schedule_slots: [],
          seats_remaining: 0,
        },
      ],
      error: null,
    });
    const link = await load(VALID);
    expect(link?.seatsRemaining).toBe(0);
  });

  it("returns null on an rpc error", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    await expect(load(VALID)).resolves.toBeNull();
  });

  it("returns null on an empty result", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    await expect(load(VALID)).resolves.toBeNull();
  });

  it("returns null on a row without a section", async () => {
    rpc.mockResolvedValue({ data: [{ section_name: "Huérfana" }], error: null });
    await expect(load(VALID)).resolves.toBeNull();
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx vitest run src/__tests__/lib/register/loadSectionEnrollmentLink.test.ts`
Expected: FAIL — cannot resolve `@/lib/register/loadSectionEnrollmentLink`.

- [ ] **Step 7: Write the loader**

Create `src/lib/register/loadSectionEnrollmentLink.ts`:

```ts
import { parseSectionScheduleSlots } from "@/lib/academics/sectionScheduleSlots";
import { createAnonReadOnlyClient } from "@/lib/supabase/anon";
import {
  isSectionEnrollmentLinkToken,
  type SectionEnrollmentLinkContext,
} from "@/lib/register/sectionEnrollmentLink";

type ResolvedRow = {
  section_id?: string | null;
  section_name?: string | null;
  cohort_name?: string | null;
  schedule_slots?: unknown;
  seats_remaining?: number | null;
};

/**
 * Resolves a public enrollment link token (safe for unauthenticated visitors).
 * Returns null for every unusable case — malformed, unknown, rotated, deactivated
 * or archived — so the page renders one "no longer available" state.
 */
export async function loadSectionEnrollmentLink(
  token: string,
): Promise<SectionEnrollmentLinkContext | null> {
  if (!isSectionEnrollmentLinkToken(token)) return null;
  const supabase = createAnonReadOnlyClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc("resolve_section_enrollment_link", {
    p_token: token,
  });
  if (error) return null;

  const row = (Array.isArray(data) ? data[0] : data) as ResolvedRow | null | undefined;
  if (!row?.section_id || !row.section_name) return null;

  const seats = row.seats_remaining;
  return {
    token,
    sectionId: String(row.section_id),
    sectionName: String(row.section_name),
    cohortName: row.cohort_name ? String(row.cohort_name) : "",
    scheduleSlots: parseSectionScheduleSlots(row.schedule_slots),
    seatsRemaining: typeof seats === "number" ? seats : null,
  };
}
```

- [ ] **Step 8: Run it to verify it passes**

Run: `npx vitest run src/__tests__/lib/register/loadSectionEnrollmentLink.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 9: Verification gate**

```bash
npx vitest run src/__tests__/lib/register src/__tests__/lib/academics
npx tsc --noEmit
```

Expected: all pass, no type errors. Do not commit.

---

### Task 3: Dictionary copy and the read-only section card

The card that replaces the `<select>`, plus every string the token page needs, in all three locales.

**Files:**
- Modify: `src/dictionaries/en.json` (add `register.sectionLink`)
- Modify: `src/dictionaries/es.json` (same key shape)
- Modify: `src/dictionaries/pt.json` (same key shape)
- Create: `src/components/register/SectionEnrollmentLinkCard.tsx`
- Test: `src/__tests__/components/register/SectionEnrollmentLinkCard.test.tsx`
- Test: `src/__tests__/dictionaries/sectionLinkCopyParity.test.ts`

**Interfaces:**
- Consumes: `SectionEnrollmentLinkContext` from Task 2; `SectionScheduleSlot` from `@/types/academics`; `sectionScheduleWeekdayKey` from `@/lib/academics/sectionScheduleWeekdayKey`.
- Produces:
  - `dict.register.sectionLink` with keys `heading`, `scheduleLabel`, `scheduleEmpty`, `weekdays.{sun,mon,tue,wed,thu,fri,sat}`, `seatsRemainingOne`, `seatsRemainingMany`, `waitingListNotice`, `unavailableTitle`, `unavailableInvalid`, `unavailableClosed`, `backHome`.
  - `SectionEnrollmentLinkCard({ link, labels })` where `labels` is `Dictionary["register"]["sectionLink"]`.

- [ ] **Step 1: Write the failing copy-parity test**

Create `src/__tests__/dictionaries/sectionLinkCopyParity.test.ts`:

```ts
/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import pt from "@/dictionaries/pt.json";

const REQUIRED = [
  "heading",
  "scheduleLabel",
  "scheduleEmpty",
  "seatsRemainingOne",
  "seatsRemainingMany",
  "waitingListNotice",
  "unavailableTitle",
  "unavailableInvalid",
  "unavailableClosed",
  "backHome",
] as const;

const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

describe("register.sectionLink copy", () => {
  const dicts = { en, es, pt } as Record<string, typeof en>;

  for (const [locale, dict] of Object.entries(dicts)) {
    it(`${locale} defines every sectionLink key with a non-empty string`, () => {
      const group = dict.register.sectionLink as Record<string, unknown>;
      expect(group).toBeTruthy();
      for (const key of REQUIRED) {
        expect(typeof group[key], `${locale}.${key}`).toBe("string");
        expect(String(group[key]).trim().length, `${locale}.${key}`).toBeGreaterThan(0);
      }
      const weekdays = group.weekdays as Record<string, unknown>;
      for (const day of WEEKDAYS) {
        expect(typeof weekdays[day], `${locale}.weekdays.${day}`).toBe("string");
      }
    });
  }

  // Only the plural form interpolates: the singular names the one seat outright so the
  // sentence stays grammatical in every locale.
  it("keeps the plural seat copy parameterised on {count}", () => {
    for (const [locale, dict] of Object.entries(dicts)) {
      const group = dict.register.sectionLink as Record<string, string>;
      expect(group.seatsRemainingMany, `${locale}.seatsRemainingMany`).toContain("{count}");
    }
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/__tests__/dictionaries/sectionLinkCopyParity.test.ts`
Expected: FAIL — `register.sectionLink` is undefined in all three dictionaries.

- [ ] **Step 3: Add the copy to all three dictionaries**

In `src/dictionaries/en.json`, inside the `register` object (alongside `sectionUndecidedHint`), add:

```json
"sectionLink": {
  "heading": "You are signing up for",
  "scheduleLabel": "Schedule",
  "scheduleEmpty": "Schedule to be confirmed",
  "weekdays": {
    "sun": "Sun",
    "mon": "Mon",
    "tue": "Tue",
    "wed": "Wed",
    "thu": "Thu",
    "fri": "Fri",
    "sat": "Sat"
  },
  "seatsRemainingOne": "1 seat left",
  "seatsRemainingMany": "{count} seats left",
  "waitingListNotice": "This group is full. You can still send your details and we will contact you if a seat opens up.",
  "unavailableTitle": "This link is no longer available",
  "unavailableInvalid": "The link is not valid. Please ask the school for a new one.",
  "unavailableClosed": "Sign-ups through this link are closed. Please contact the school.",
  "backHome": "Go to the home page"
}
```

In `src/dictionaries/es.json`, the same shape:

```json
"sectionLink": {
  "heading": "Te estás inscribiendo en",
  "scheduleLabel": "Horario",
  "scheduleEmpty": "Horario a confirmar",
  "weekdays": {
    "sun": "Dom",
    "mon": "Lun",
    "tue": "Mar",
    "wed": "Mié",
    "thu": "Jue",
    "fri": "Vie",
    "sat": "Sáb"
  },
  "seatsRemainingOne": "Queda 1 cupo",
  "seatsRemainingMany": "Quedan {count} cupos",
  "waitingListNotice": "Este grupo está completo. Podés enviar tus datos igual y te contactamos si se libera un cupo.",
  "unavailableTitle": "Este enlace ya no está disponible",
  "unavailableInvalid": "El enlace no es válido. Pedile uno nuevo al instituto.",
  "unavailableClosed": "Las inscripciones por este enlace están cerradas. Contactá al instituto.",
  "backHome": "Ir al inicio"
}
```

In `src/dictionaries/pt.json`, the same shape:

```json
"sectionLink": {
  "heading": "Você está se inscrevendo em",
  "scheduleLabel": "Horário",
  "scheduleEmpty": "Horário a confirmar",
  "weekdays": {
    "sun": "Dom",
    "mon": "Seg",
    "tue": "Ter",
    "wed": "Qua",
    "thu": "Qui",
    "fri": "Sex",
    "sat": "Sáb"
  },
  "seatsRemainingOne": "Resta 1 vaga",
  "seatsRemainingMany": "Restam {count} vagas",
  "waitingListNotice": "Esta turma está cheia. Você pode enviar seus dados e entraremos em contato se uma vaga abrir.",
  "unavailableTitle": "Este link não está mais disponível",
  "unavailableInvalid": "O link não é válido. Peça um novo ao instituto.",
  "unavailableClosed": "As inscrições por este link estão encerradas. Entre em contato com o instituto.",
  "backHome": "Ir para a página inicial"
}
```

- [ ] **Step 4: Run the copy test to verify it passes**

Run: `npx vitest run src/__tests__/dictionaries/sectionLinkCopyParity.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Write the failing test for the card**

Create `src/__tests__/components/register/SectionEnrollmentLinkCard.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionEnrollmentLinkCard } from "@/components/register/SectionEnrollmentLinkCard";
import type { SectionEnrollmentLinkContext } from "@/lib/register/sectionEnrollmentLink";

const labels = {
  heading: "Te estás inscribiendo en",
  scheduleLabel: "Horario",
  scheduleEmpty: "Horario a confirmar",
  weekdays: {
    sun: "Dom",
    mon: "Lun",
    tue: "Mar",
    wed: "Mié",
    thu: "Jue",
    fri: "Vie",
    sat: "Sáb",
  },
  seatsRemainingOne: "Queda 1 cupo",
  seatsRemainingMany: "Quedan {count} cupos",
  waitingListNotice: "Este grupo está completo.",
  unavailableTitle: "no disponible",
  unavailableInvalid: "inválido",
  unavailableClosed: "cerrado",
  backHome: "Ir al inicio",
};

function makeLink(
  overrides: Partial<SectionEnrollmentLinkContext> = {},
): SectionEnrollmentLinkContext {
  return {
    token: "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
    sectionId: "11111111-1111-1111-1111-111111111111",
    sectionName: "Sección B",
    cohortName: "Ciclo 2026",
    scheduleSlots: [{ dayOfWeek: 1, startTime: "18:00", endTime: "19:30" }],
    seatsRemaining: 3,
    ...overrides,
  };
}

describe("SectionEnrollmentLinkCard", () => {
  it("names the cohort and the section", () => {
    render(<SectionEnrollmentLinkCard link={makeLink()} labels={labels} />);
    expect(screen.getByText("Sección B")).toBeInTheDocument();
    expect(screen.getByText("Ciclo 2026")).toBeInTheDocument();
    expect(screen.getByText(labels.heading)).toBeInTheDocument();
  });

  it("omits the cohort line when the section has no cohort", () => {
    const { container } = render(
      <SectionEnrollmentLinkCard link={makeLink({ cohortName: "" })} labels={labels} />,
    );
    expect(screen.queryByText("Ciclo 2026")).not.toBeInTheDocument();
    // loadSectionEnrollmentLink turns a null cohort into "", which would otherwise
    // reach the DOM as a blank paragraph under the section name.
    expect(container.querySelector("p:empty")).toBeNull();
  });

  it("renders each slot with its weekday label and time range", () => {
    render(
      <SectionEnrollmentLinkCard
        link={makeLink({
          scheduleSlots: [
            { dayOfWeek: 1, startTime: "18:00", endTime: "19:30" },
            { dayOfWeek: 3, startTime: "09:00", endTime: "10:00" },
          ],
        })}
        labels={labels}
      />,
    );
    expect(screen.getByText("Lun 18:00–19:30")).toBeInTheDocument();
    expect(screen.getByText("Mié 09:00–10:00")).toBeInTheDocument();
  });

  it("falls back to the empty-schedule label when there are no slots", () => {
    render(
      <SectionEnrollmentLinkCard
        link={makeLink({ scheduleSlots: [] })}
        labels={labels}
      />,
    );
    expect(screen.getByText(labels.scheduleEmpty)).toBeInTheDocument();
  });

  it("interpolates the remaining seats", () => {
    render(<SectionEnrollmentLinkCard link={makeLink({ seatsRemaining: 3 })} labels={labels} />);
    expect(screen.getByText("Quedan 3 cupos")).toBeInTheDocument();
  });

  it("uses the singular copy for the last seat", () => {
    render(<SectionEnrollmentLinkCard link={makeLink({ seatsRemaining: 1 })} labels={labels} />);
    expect(screen.getByText("Queda 1 cupo")).toBeInTheDocument();
  });

  it("says nothing about seats when the section has no limit", () => {
    render(
      <SectionEnrollmentLinkCard
        link={makeLink({ seatsRemaining: null })}
        labels={labels}
      />,
    );
    expect(screen.queryByText(/cupo/)).not.toBeInTheDocument();
    expect(screen.queryByText(labels.waitingListNotice)).not.toBeInTheDocument();
  });

  it("warns about the waiting list when the section is full", () => {
    render(
      <SectionEnrollmentLinkCard link={makeLink({ seatsRemaining: 0 })} labels={labels} />,
    );
    expect(screen.getByText(labels.waitingListNotice)).toBeInTheDocument();
    expect(screen.queryByText(/Quedan/)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx vitest run src/__tests__/components/register/SectionEnrollmentLinkCard.test.tsx`
Expected: FAIL — cannot resolve `@/components/register/SectionEnrollmentLinkCard`.

- [ ] **Step 7: Write the card**

Create `src/components/register/SectionEnrollmentLinkCard.tsx`:

```tsx
import { CalendarDays } from "lucide-react";
import { sectionScheduleWeekdayKey } from "@/lib/academics/sectionScheduleWeekdayKey";
import type { SectionEnrollmentLinkContext } from "@/lib/register/sectionEnrollmentLink";
import type { Dictionary } from "@/types/i18n";

interface SectionEnrollmentLinkCardProps {
  link: SectionEnrollmentLinkContext;
  labels: Dictionary["register"]["sectionLink"];
}

export function SectionEnrollmentLinkCard({
  link,
  labels,
}: SectionEnrollmentLinkCardProps) {
  const isFull = link.seatsRemaining === 0;
  const showSeats = link.seatsRemaining != null && link.seatsRemaining > 0;
  const seatsLabel =
    link.seatsRemaining === 1
      ? labels.seatsRemainingOne
      : labels.seatsRemainingMany.replace("{count}", String(link.seatsRemaining));

  return (
    <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
        {labels.heading}
      </p>
      <p className="mt-1 text-base font-semibold text-[var(--color-foreground)]">
        {link.sectionName}
      </p>
      {link.cohortName ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{link.cohortName}</p>
      ) : null}

      <div className="mt-3 flex items-start gap-2">
        <CalendarDays
          className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]"
          aria-hidden
        />
        <div>
          <p className="text-xs font-medium text-[var(--color-muted-foreground)]">
            {labels.scheduleLabel}
          </p>
          {link.scheduleSlots.length === 0 ? (
            <p className="text-sm text-[var(--color-foreground)]">{labels.scheduleEmpty}</p>
          ) : (
            <ul className="mt-0.5 space-y-0.5">
              {link.scheduleSlots.map((slot) => (
                <li
                  key={`${slot.dayOfWeek}-${slot.startTime}-${slot.endTime}`}
                  className="text-sm text-[var(--color-foreground)]"
                >
                  {`${labels.weekdays[sectionScheduleWeekdayKey(slot.dayOfWeek)]} ${slot.startTime}\u2013${slot.endTime}`}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {showSeats ? (
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
          {seatsLabel}
        </p>
      ) : null}
      {isFull ? (
        <p className="mt-3 text-sm text-[var(--color-foreground)]" role="note">
          {labels.waitingListNotice}
        </p>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 8: Run it to verify it passes**

Run: `npx vitest run src/__tests__/components/register/SectionEnrollmentLinkCard.test.tsx`
Expected: PASS, 8 tests.

The en-dash in the time range is written as the escape `\u2013` inside a template literal on purpose: it keeps the source ASCII-only while the test asserts the rendered character.

- [ ] **Step 9: Verification gate**

```bash
npx vitest run src/__tests__/components/register/SectionEnrollmentLinkCard.test.tsx src/__tests__/dictionaries/sectionLinkCopyParity.test.ts
npx tsc --noEmit
```

Expected: all pass, no type errors. Do not commit.

---

### Task 4: `RegisterForm` learns the link mode

One optional prop swaps the section `<select>` for the card and redirects the submit to the token action. The public path must behave exactly as before.

**Files:**
- Modify: `src/components/register/RegisterForm.tsx`
- Test: `src/__tests__/components/register/RegisterFormEnrollmentLink.test.tsx`

**Interfaces:**
- Consumes: `SectionEnrollmentLinkContext` (Task 2), `SectionEnrollmentLinkCard` (Task 3), and `submitSectionLinkRegistration` (Task 5).
- Produces: `RegisterFormProps.enrollmentLink?: SectionEnrollmentLinkContext`.

**Ordering note:** this task imports `submitSectionLinkRegistration`, which Task 5 creates. Implement Step 3 of Task 5 (the action file) before this task, or create the action file first with its final signature and fill in the body in Task 5. The signature is fixed: `submitSectionLinkRegistration(locale: string, token: string, raw: PublicRegistrationInput): Promise<RegisterActionState>`.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/components/register/RegisterFormEnrollmentLink.test.tsx`:

```tsx
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const submitPublicRegistration = vi.fn();
const submitSectionLinkRegistration = vi.fn();

vi.mock("@/app/[locale]/register/actions", () => ({
  submitPublicRegistration: (...args: unknown[]) => submitPublicRegistration(...args),
}));

vi.mock("@/app/[locale]/i/[token]/actions", () => ({
  submitSectionLinkRegistration: (...args: unknown[]) =>
    submitSectionLinkRegistration(...args),
}));

vi.mock("@/components/molecules/RegisterSuccessDialog", () => ({
  RegisterSuccessDialog: () => null,
}));

vi.mock("@/components/molecules/RegisterBirthDateDayPicker", () => ({
  RegisterBirthDateDayPicker: ({
    onChange,
  }: {
    onChange: (value: string) => void;
  }) => (
    <button type="button" onClick={() => onChange("1990-05-04")}>
      set-birth-date
    </button>
  ),
}));

const dict = {
  firstName: "Nombre",
  lastName: "Apellido",
  dni: "DNI",
  documentIdFormatHint: "hint",
  email: "Email",
  phone: "Teléfono",
  birthDateIncomplete: "incompleta",
  studentEmailNotCollectedMinorLead: "menor",
  tutorEmailSameAsStudent: "igual",
  tutorSectionTitle: "Tutor",
  tutorSectionLead: "lead",
  tutorName: "Nombre tutor",
  tutorDni: "DNI tutor",
  tutorEmail: "Email tutor",
  tutorPhone: "Tel tutor",
  tutorRelationship: "Relación",
  level: "Sección",
  sectionPlaceholder: "Elegí",
  sectionUndecidedOption: "No sé",
  sectionUndecidedHint: "pista",
  noSectionsAvailable: "sin secciones",
  submit: "Enviar",
  closed: "cerrado",
  error: "error",
  sectionLink: {
    heading: "Te estás inscribiendo en",
    scheduleLabel: "Horario",
    scheduleEmpty: "a confirmar",
    weekdays: {
      sun: "Dom",
      mon: "Lun",
      tue: "Mar",
      wed: "Mié",
      thu: "Jue",
      fri: "Vie",
      sat: "Sáb",
    },
    seatsRemainingOne: "Queda 1 cupo",
    seatsRemainingMany: "Quedan {count} cupos",
    waitingListNotice: "completo",
    unavailableTitle: "no disponible",
    unavailableInvalid: "inválido",
    unavailableClosed: "cerrado",
    backHome: "inicio",
  },
} as never;

const link = {
  token: "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
  sectionId: "11111111-1111-1111-1111-111111111111",
  sectionName: "Sección B",
  cohortName: "Ciclo 2026",
  scheduleSlots: [{ dayOfWeek: 1, startTime: "18:00", endTime: "19:30" }],
  seatsRemaining: 5,
};

async function renderForm(props: Record<string, unknown>) {
  const { RegisterForm } = await import("@/components/register/RegisterForm");
  return render(
    <RegisterForm locale="es" dict={dict} legalAgeMajority={18} {...props} />,
  );
}

describe("RegisterForm in enrollment-link mode", () => {
  beforeEach(() => {
    vi.resetModules();
    submitPublicRegistration.mockReset();
    submitSectionLinkRegistration.mockReset();
    submitPublicRegistration.mockResolvedValue({ ok: true });
    submitSectionLinkRegistration.mockResolvedValue({ ok: true });
  });

  it("keeps the section select when there is no link", async () => {
    await renderForm({ sectionOptions: [{ id: link.sectionId, label: "Ciclo — B" }] });
    expect(screen.getByLabelText(/Sección/)).toBeInTheDocument();
    expect(screen.queryByText("Te estás inscribiendo en")).not.toBeInTheDocument();
  });

  it("replaces the select with the fixed card when a link is given", async () => {
    await renderForm({ sectionOptions: [], enrollmentLink: link });
    expect(screen.getByText("Te estás inscribiendo en")).toBeInTheDocument();
    expect(screen.getByText("Sección B")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("submits through the token action, passing the token", async () => {
    const user = userEvent.setup();
    await renderForm({ sectionOptions: [], enrollmentLink: link });

    await user.type(screen.getByLabelText("Nombre"), "Ana");
    await user.type(screen.getByLabelText("Apellido"), "Pérez");
    await user.type(screen.getByLabelText("DNI"), "12345678");
    await user.type(screen.getByLabelText("Email"), "ana@example.com");
    await user.type(screen.getByLabelText("Teléfono"), "3624000000");
    await user.click(screen.getByText("set-birth-date"));
    await user.click(screen.getByRole("button", { name: "Enviar" }));

    expect(submitPublicRegistration).not.toHaveBeenCalled();
    expect(submitSectionLinkRegistration).toHaveBeenCalledTimes(1);
    const [locale, token, raw] = submitSectionLinkRegistration.mock.calls[0];
    expect(locale).toBe("es");
    expect(token).toBe(link.token);
    expect(raw).toMatchObject({
      first_name: "Ana",
      preferred_section_id: link.sectionId,
    });
  });

  it("still submits through the public action when there is no link", async () => {
    const user = userEvent.setup();
    await renderForm({
      sectionOptions: [{ id: link.sectionId, label: "Ciclo — B" }],
    });

    await user.type(screen.getByLabelText("Nombre"), "Ana");
    await user.type(screen.getByLabelText("Apellido"), "Pérez");
    await user.type(screen.getByLabelText("DNI"), "12345678");
    await user.type(screen.getByLabelText("Email"), "ana@example.com");
    await user.type(screen.getByLabelText("Teléfono"), "3624000000");
    await user.click(screen.getByText("set-birth-date"));
    await user.selectOptions(screen.getByRole("combobox"), link.sectionId);
    await user.click(screen.getByRole("button", { name: "Enviar" }));

    expect(submitSectionLinkRegistration).not.toHaveBeenCalled();
    expect(submitPublicRegistration).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/__tests__/components/register/RegisterFormEnrollmentLink.test.tsx`
Expected: FAIL — the card is not rendered and `submitSectionLinkRegistration` is never called, because `RegisterForm` has no `enrollmentLink` prop yet.

- [ ] **Step 3: Add the prop to `RegisterForm`**

In `src/components/register/RegisterForm.tsx`, add these imports next to the existing ones:

```tsx
import { submitSectionLinkRegistration } from "@/app/[locale]/i/[token]/actions";
import { SectionEnrollmentLinkCard } from "@/components/register/SectionEnrollmentLinkCard";
import type { SectionEnrollmentLinkContext } from "@/lib/register/sectionEnrollmentLink";
```

Extend the props interface and the destructuring:

```tsx
interface RegisterFormProps {
  locale: string;
  dict: Dictionary["register"];
  legalAgeMajority: number;
  sectionOptions: { id: string; label: string }[];
  /**
   * Present only on `/[locale]/i/[token]`. Fixes the section, hides the picker and
   * routes the submit through the token-scoped action. Absent on `/register`.
   */
  enrollmentLink?: SectionEnrollmentLinkContext;
}

export function RegisterForm({
  locale,
  dict,
  legalAgeMajority,
  sectionOptions,
  enrollmentLink,
}: RegisterFormProps) {
```

In `onSubmit`, replace the single call to `submitPublicRegistration` with the branch:

```tsx
      const res = enrollmentLink
        ? await submitSectionLinkRegistration(locale, enrollmentLink.token, raw)
        : await submitPublicRegistration(locale, raw);
```

Replace the whole section-picker block — the one currently starting at the `sectionOptions.length === 0` guard and ending after the `sectionUndecidedHint` paragraph — with:

```tsx
        {enrollmentLink ? (
          <>
            <input
              type="hidden"
              name="preferred_section_id"
              value={enrollmentLink.sectionId}
              readOnly
              aria-hidden
            />
            <SectionEnrollmentLinkCard
              link={enrollmentLink}
              labels={dict.sectionLink}
            />
          </>
        ) : (
          <>
            {sectionOptions.length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)]" role="status">
                {dict.noSectionsAvailable}
              </p>
            ) : null}
            <div>
              <Label htmlFor="rg-section" required>{dict.level}</Label>
              <select
                id="rg-section"
                name="preferred_section_id"
                required
                className={`mt-1 ${REGISTER_NATIVE_SELECT_CN}`}
                defaultValue=""
              >
                <option value="" disabled>
                  {dict.sectionPlaceholder}
                </option>
                <option value={REGISTRATION_UNDECIDED_FORM_VALUE}>
                  {dict.sectionUndecidedOption}
                </option>
                {sectionOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                {dict.sectionUndecidedHint}
              </p>
            </div>
          </>
        )}
```

The hidden input keeps `preferred_section_id` a valid UUID for `buildPublicRegistrationSchema`, which requires either a UUID or the "undecided" sentinel. The server ignores this value and re-derives the section from the token — it exists to satisfy client-side validation, not to carry trust.

- [ ] **Step 4: Give the card heading and group semantics**

Required, not optional. As built in Task 3 the card is a flat stack of `<p>` elements: the section name is styled like a heading without being one, the card has no accessible name for the group it describes, and the `scheduleLabel` paragraph is not tied to the `<ul>` it introduces. Nothing is hidden — the content reads in source order and `role="note"` on the waiting-list line is correct — but a family using a screen reader has no structure to navigate to, and this card is replacing a `<select>` that had a proper `<Label htmlFor>`.

Fix it here, where the card enters the form, following the pattern `RegisterForm` already uses for the tutor block in this same file: a `<fieldset>` whose `<legend>` names the group with `dict.sectionLink.heading`, the section name promoted to a real heading element, and the schedule label associated with its list (give the label an `id` and point the `<ul>` at it with `aria-labelledby`). Keep `role="note"` on the waiting-list paragraph.

Change `src/components/register/SectionEnrollmentLinkCard.tsx` for the semantics, and assert the new structure by role in `RegisterFormEnrollmentLink.test.tsx` — `getByRole("group", { name: ... })` and `getByRole("heading", { name: "Sección B" })` — rather than by text alone. `SectionEnrollmentLinkCard.test.tsx` from Task 3 must keep passing; update its queries if they depend on the old element types.

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/__tests__/components/register/RegisterFormEnrollmentLink.test.tsx`
Expected: PASS, 4 tests.

- [ ] **Step 6: Confirm the public form did not regress**

Run: `npx vitest run src/__tests__ -t "RegisterForm"`
Expected: every pre-existing `RegisterForm` test still passes. If a test asserted the exact child order of the form, update it to the new structure, but do not change what it asserts about behaviour.

- [ ] **Step 7: Check the file size ceiling**

```bash
wc -l src/components/register/RegisterForm.tsx
```

Expected: under 250 lines (rule `03-architecture.mdc`). If it exceeds, extract the tutor `fieldset` into `src/components/register/RegisterTutorFieldset.tsx`, passing `dict` and `showTutor`, and re-run Step 5.

- [ ] **Step 8: Verification gate**

```bash
npx vitest run src/__tests__/components/register
npx tsc --noEmit
```

Expected: all pass, no type errors. Do not commit.

---

### Task 5: The public token route and its server action

The page every family opens, and the only write path the link has.

**Files:**
- Create: `src/app/[locale]/i/[token]/page.tsx`
- Create: `src/app/[locale]/i/[token]/actions.ts`
- Create: `src/components/register/SectionEnrollmentLinkUnavailable.tsx`
- Test: `src/__tests__/app/submitSectionLinkRegistration.test.ts`

**Interfaces:**
- Consumes: `loadSectionEnrollmentLink` (Task 2), `section_enrollment_link_is_open` (Task 1), `RegisterSurfaceByTemplate` (Task 6), `dict.register.sectionLink` (Task 3).
- Produces: `submitSectionLinkRegistration(locale: string, token: string, raw: PublicRegistrationInput): Promise<RegisterActionState>`.

**Ordering note:** the page imports `RegisterSurfaceByTemplate`, created in Task 6. Build the action and the unavailable state here, and wire the page's happy path at the end of Task 6 where the dispatch exists. The action does not depend on Task 6 at all.

- [ ] **Step 1: Write the failing test for the action**

Create `src/__tests__/app/submitSectionLinkRegistration.test.ts`:

```ts
/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const insert = vi.fn();
const rpc = vi.fn();
const from = vi.fn(() => ({ insert }));
const revalidatePath = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ from, rpc }),
}));

vi.mock("@/lib/brand/legalAge", () => ({
  getLegalAgeMajorityFromSystem: () => 18,
}));

vi.mock("@/lib/register/registrationMailTenant", () => ({
  getRegistrationMailTenantDomain: () => "tenant.test",
}));

vi.mock("@/lib/i18n/dictionaries", () => ({
  getDictionary: async () => ({
    register: {
      closed: "cerrado",
      validationError: "validación",
      invalidSectionOption: "sección inválida",
      tutorEmailSameAsStudent: "igual",
      sectionLink: { unavailableClosed: "cerrado" },
    },
    actionErrors: {
      register: { insertFailed: "insert falló", mailTenantMissing: "sin tenant" },
    },
  }),
}));

const TOKEN = "3f2504e0-4f89-11d3-9a0c-0305e82c3301";
const SECTION = "11111111-1111-1111-1111-111111111111";

const adult = {
  first_name: "Ana",
  last_name: "Pérez",
  dni: "12345678",
  email: "ana@example.com",
  phone: "3624000000",
  birth_date: "1990-05-04",
  preferred_section_id: SECTION,
};

const minor = {
  first_name: "Luca",
  last_name: "Gómez",
  dni: "55667788",
  email: "",
  phone: "",
  birth_date: "2016-03-02",
  preferred_section_id: SECTION,
  tutor_name: "Marta Gómez",
  tutor_dni: "22334455",
  tutor_email: "marta@example.com",
  tutor_phone: "3624111111",
  tutor_relationship: "madre",
};

async function submit(token: string, raw: Record<string, unknown>) {
  const { submitSectionLinkRegistration } = await import(
    "@/app/[locale]/i/[token]/actions"
  );
  return submitSectionLinkRegistration("es", token, raw as never);
}

function resolvesTo(sectionId: string | null) {
  rpc.mockImplementation((fn: string) => {
    if (fn === "resolve_section_enrollment_link") {
      return Promise.resolve({
        data: sectionId
          ? [
              {
                section_id: sectionId,
                section_name: "Sección B",
                cohort_name: "Ciclo 2026",
                schedule_slots: [],
                seats_remaining: 3,
              },
            ]
          : [],
        error: null,
      });
    }
    return Promise.resolve({ data: null, error: null });
  });
}

describe("submitSectionLinkRegistration", () => {
  beforeEach(() => {
    vi.resetModules();
    insert.mockReset();
    rpc.mockReset();
    revalidatePath.mockReset();
    insert.mockResolvedValue({ error: null });
    resolvesTo(SECTION);
  });

  it("rejects a malformed token without touching the database", async () => {
    await expect(submit("not-a-token", adult)).resolves.toMatchObject({ ok: false });
    expect(insert).not.toHaveBeenCalled();
  });

  it("rejects a token that no longer resolves", async () => {
    resolvesTo(null);
    const res = await submit(TOKEN, adult);
    expect(res.ok).toBe(false);
    expect(insert).not.toHaveBeenCalled();
  });

  it("inserts the lead bound to the section the token resolves to", async () => {
    const res = await submit(TOKEN, adult);
    expect(res.ok).toBe(true);
    const row = insert.mock.calls[0][0];
    expect(row).toMatchObject({
      first_name: "Ana",
      email: "ana@example.com",
      phone: "3624000000",
      status: "new",
      preferred_section_id: SECTION,
      source_section_link_id: SECTION,
      level_interest: "Ciclo 2026 — Sección B",
    });
  });

  // The token is the authorization; a section id posted by the client is not.
  it("ignores a section id supplied by the client", async () => {
    const res = await submit(TOKEN, {
      ...adult,
      preferred_section_id: "99999999-9999-9999-9999-999999999999",
    });
    expect(res.ok).toBe(true);
    const row = insert.mock.calls[0][0];
    expect(row.preferred_section_id).toBe(SECTION);
    expect(row.source_section_link_id).toBe(SECTION);
  });

  it("stores a minor with tutor data, a synthetic email and no phone", async () => {
    const res = await submit(TOKEN, minor);
    expect(res.ok).toBe(true);
    const row = insert.mock.calls[0][0];
    expect(row.phone).toBeNull();
    expect(String(row.email)).toContain("@tenant.test");
    expect(row).toMatchObject({
      tutor_name: "Marta Gómez",
      tutor_dni: "22334455",
      tutor_email: "marta@example.com",
      tutor_phone: "3624111111",
      tutor_relationship: "madre",
    });
  });

  it("retries a minor insert on a duplicate email, then succeeds", async () => {
    insert
      .mockResolvedValueOnce({ error: { code: "23505", message: "duplicate" } })
      .mockResolvedValueOnce({ error: null });
    const res = await submit(TOKEN, minor);
    expect(res.ok).toBe(true);
    expect(insert).toHaveBeenCalledTimes(2);
    const firstEmail = insert.mock.calls[0][0].email;
    const secondEmail = insert.mock.calls[1][0].email;
    expect(firstEmail).not.toBe(secondEmail);
  });

  it("rejects invalid input before inserting", async () => {
    const res = await submit(TOKEN, { ...adult, first_name: "" });
    expect(res.ok).toBe(false);
    expect(insert).not.toHaveBeenCalled();
  });

  it("refreshes the admin inbox after a successful insert", async () => {
    await submit(TOKEN, adult);
    expect(revalidatePath).toHaveBeenCalledWith(
      "/es/dashboard/admin/registrations",
      "page",
    );
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/__tests__/app/submitSectionLinkRegistration.test.ts`
Expected: FAIL — cannot resolve `@/app/[locale]/i/[token]/actions`.

- [ ] **Step 3: Write the action**

Create `src/app/[locale]/i/[token]/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { getLegalAgeMajorityFromSystem } from "@/lib/brand/legalAge";
import { createClient } from "@/lib/supabase/server";
import {
  buildPublicRegistrationSchema,
  type PublicRegistrationInput,
} from "@/lib/register/publicRegistrationSchema";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { fullYearsFromIsoDate } from "@/lib/register/ageFromBirthDate";
import { composeSyntheticMinorStudentEmail } from "@/lib/register/composeSyntheticMinorStudentEmail";
import { getRegistrationMailTenantDomain } from "@/lib/register/registrationMailTenant";
import { randomLowercaseAlphaString } from "@/lib/server/randomLowercaseAlphaString";
import { isSectionEnrollmentLinkToken } from "@/lib/register/sectionEnrollmentLink";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import type { RegisterActionState } from "@/app/[locale]/register/actions";

type ResolvedRow = {
  section_id?: string | null;
  section_name?: string | null;
  cohort_name?: string | null;
};

/**
 * Public submission through a section enrollment link.
 *
 * Mirrors `submitPublicRegistration` but takes its authorization from the token
 * instead of the `inscriptions_enabled` setting, and derives the section from the
 * server-side resolution — never from the client payload.
 */
export async function submitSectionLinkRegistration(
  locale: string,
  token: string,
  raw: PublicRegistrationInput,
): Promise<RegisterActionState> {
  const dict = await getDictionary(locale);
  const reg = dict.register;

  if (!isSectionEnrollmentLinkToken(token)) {
    return { ok: false, message: reg.sectionLink.unavailableClosed };
  }

  const parsed = buildPublicRegistrationSchema(
    getLegalAgeMajorityFromSystem(),
  ).safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: reg.validationError };
  }

  const d = parsed.data;
  const legal = getLegalAgeMajorityFromSystem();
  const age = fullYearsFromIsoDate(d.birth_date);
  const tutorMail = (d.tutor_email ?? "").trim().toLowerCase();

  const tenantDomain = age < legal ? getRegistrationMailTenantDomain() : null;
  if (age < legal && !tenantDomain) {
    return { ok: false, message: dict.actionErrors.register.mailTenantMissing };
  }

  const supabase = await createClient();

  const { data: resolved, error: resolveErr } = await supabase.rpc(
    "resolve_section_enrollment_link",
    { p_token: token },
  );
  if (resolveErr) {
    logSupabaseClientError("submitSectionLinkRegistration:resolve", resolveErr);
    return { ok: false, message: reg.sectionLink.unavailableClosed };
  }

  const row = (Array.isArray(resolved) ? resolved[0] : resolved) as
    | ResolvedRow
    | null
    | undefined;
  if (!row?.section_id) {
    return { ok: false, message: reg.sectionLink.unavailableClosed };
  }

  const sectionId = String(row.section_id);
  const sectionLabel = [row.cohort_name, row.section_name]
    .filter((part) => String(part ?? "").trim() !== "")
    .join(" — ");

  const maxMinorEmailAttempts = 16;
  const maxAttempts = age < legal ? maxMinorEmailAttempts : 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let resolvedEmail: string;
    if (age < legal) {
      const coreSuffix =
        attempt === 0
          ? undefined
          : randomLowercaseAlphaString(Math.min(2 + attempt, 10));
      resolvedEmail = composeSyntheticMinorStudentEmail(
        d.first_name,
        d.last_name,
        d.dni,
        tenantDomain!,
        coreSuffix ? { coreSuffix } : undefined,
      ).toLowerCase();
    } else {
      resolvedEmail = d.email.trim().toLowerCase();
    }

    if (age < legal && tutorMail && tutorMail === resolvedEmail) {
      return { ok: false, message: reg.tutorEmailSameAsStudent };
    }

    const { error } = await supabase.from("registrations").insert({
      first_name: d.first_name,
      last_name: d.last_name,
      dni: d.dni,
      email: resolvedEmail,
      phone: age < legal ? null : d.phone.trim(),
      birth_date: d.birth_date,
      preferred_section_id: sectionId,
      source_section_link_id: sectionId,
      level_interest: sectionLabel || null,
      status: "new",
      tutor_name: d.tutor_name?.trim() || null,
      tutor_dni: d.tutor_dni?.trim() || null,
      tutor_phone: d.tutor_phone?.trim() || null,
      tutor_email: d.tutor_email?.trim() || null,
      tutor_relationship: d.tutor_relationship?.trim() || null,
    });

    if (!error) {
      revalidatePath(`/${locale}/dashboard/admin/registrations`, "page");
      return { ok: true };
    }

    const isUniqueViolation = error.code === "23505";
    if (age < legal && isUniqueViolation && attempt < maxAttempts - 1) {
      continue;
    }

    logSupabaseClientError("submitSectionLinkRegistration:insert", error, {
      section_id: sectionId,
    });
    return { ok: false, message: dict.actionErrors.register.insertFailed };
  }

  return { ok: false, message: dict.actionErrors.register.insertFailed };
}
```

`composeSyntheticMinorStudentEmail` is called with `undefined` options on the first attempt so the happy path produces exactly the same address the public form produces today.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/__tests__/app/submitSectionLinkRegistration.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Write the unavailable state**

Create `src/components/register/SectionEnrollmentLinkUnavailable.tsx`:

```tsx
import Link from "next/link";
import { Home, LinkIcon } from "lucide-react";
import type { Dictionary } from "@/types/i18n";

interface SectionEnrollmentLinkUnavailableProps {
  locale: string;
  labels: Dictionary["register"]["sectionLink"];
}

/**
 * Shown instead of a 404 whenever the token cannot be resolved: unknown, malformed,
 * rotated, deactivated or archived. The reasons are deliberately indistinguishable
 * so a visitor cannot probe which tokens exist.
 */
export function SectionEnrollmentLinkUnavailable({
  locale,
  labels,
}: SectionEnrollmentLinkUnavailableProps) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
      <LinkIcon
        className="h-10 w-10 text-[var(--color-muted-foreground)]"
        aria-hidden
      />
      <h1 className="mt-4 text-2xl font-semibold text-[var(--color-foreground)]">
        {labels.unavailableTitle}
      </h1>
      <p className="mt-3 text-[var(--color-muted-foreground)]">
        {labels.unavailableClosed}
      </p>
      <Link
        href={`/${locale}`}
        className="mt-8 inline-flex min-h-[44px] items-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-muted)]"
      >
        <Home className="h-4 w-4 shrink-0" aria-hidden />
        {labels.backHome}
      </Link>
    </main>
  );
}
```

- [ ] **Step 6: Verification gate**

```bash
npx vitest run src/__tests__/app/submitSectionLinkRegistration.test.ts
npx tsc --noEmit
```

Expected: tests pass. `tsc` may still flag the not-yet-created page; that is resolved in Task 6. Do not commit.

---

### Task 6: Extract the tenant surface dispatch and wire the token page

Rule 28 requires the token page to wear the tenant's brand. Extracting the dispatch means both routes share one list of surfaces, so a future tenant serves both for free.

**Files:**
- Create: `src/components/organisms/RegisterSurfaceByTemplate.tsx`
- Modify: `src/app/[locale]/register/page.tsx`
- Modify: `src/components/organisms/RegisterEspacioZenitSurface.tsx`
- Modify: `src/components/organisms/RegisterMozarthitosSurface.tsx`
- Modify: `src/components/organisms/RegisterNagoSurface.tsx`
- Modify: `src/components/organisms/RegisterMiMundoSurface.tsx`
- Modify: `src/components/organisms/RegisterLioraSurface.tsx`
- Create: `src/app/[locale]/i/[token]/page.tsx`
- Test: `src/__tests__/organisms/RegisterSurfaceByTemplate.test.tsx`

**Interfaces:**
- Consumes: `SectionEnrollmentLinkContext` (Task 2), `loadSectionEnrollmentLink` (Task 2), `RegisterForm.enrollmentLink` (Task 4), `SectionEnrollmentLinkUnavailable` (Task 5).
- Produces: `RegisterSurfaceByTemplate({ templateKind, mediaMap, ...shellProps, enrollmentLink? })`, where `shellProps` is `{ locale, dict, brand, legalAgeMajority, sectionOptions }`.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/organisms/RegisterSurfaceByTemplate.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/organisms/RegisterEspacioZenitSurface", () => ({
  RegisterEspacioZenitSurface: (p: { enrollmentLink?: { token: string } }) => (
    <div data-testid="espaciozenit">{p.enrollmentLink?.token ?? "no-link"}</div>
  ),
}));
vi.mock("@/components/organisms/RegisterMozarthitosSurface", () => ({
  RegisterMozarthitosSurface: (p: { enrollmentLink?: { token: string } }) => (
    <div data-testid="mozarthitos">{p.enrollmentLink?.token ?? "no-link"}</div>
  ),
}));
vi.mock("@/components/organisms/RegisterNagoSurface", () => ({
  RegisterNagoSurface: (p: { enrollmentLink?: { token: string } }) => (
    <div data-testid="nago">{p.enrollmentLink?.token ?? "no-link"}</div>
  ),
}));
vi.mock("@/components/organisms/RegisterMiMundoSurface", () => ({
  RegisterMiMundoSurface: (p: { enrollmentLink?: { token: string } }) => (
    <div data-testid="mimundo">{p.enrollmentLink?.token ?? "no-link"}</div>
  ),
}));
vi.mock("@/components/organisms/RegisterLioraSurface", () => ({
  RegisterLioraSurface: (p: { enrollmentLink?: { token: string } }) => (
    <div data-testid="liora">{p.enrollmentLink?.token ?? "no-link"}</div>
  ),
}));
vi.mock("@/components/organisms/RegisterClassicSurface", () => ({
  RegisterClassicSurface: (p: { enrollmentLink?: { token: string } }) => (
    <div data-testid="classic">{p.enrollmentLink?.token ?? "no-link"}</div>
  ),
}));

const shellProps = {
  locale: "es",
  dict: { register: {}, login: { title: "Entrar" }, landing: {}, common: {} },
  brand: { name: "X", logoPath: "/logo.png", logoAlt: "X" },
  legalAgeMajority: 18,
  sectionOptions: [],
} as never;

async function renderDispatch(props: Record<string, unknown>) {
  const { RegisterSurfaceByTemplate } = await import(
    "@/components/organisms/RegisterSurfaceByTemplate"
  );
  return render(<RegisterSurfaceByTemplate {...shellProps} {...props} />);
}

describe("RegisterSurfaceByTemplate", () => {
  for (const kind of [
    "espaciozenit",
    "mozarthitos",
    "nago",
    "mimundo",
    "liora",
    "classic",
  ]) {
    it(`renders the ${kind} surface`, async () => {
      await renderDispatch({ templateKind: kind });
      expect(screen.getByTestId(kind)).toBeInTheDocument();
    });
  }

  it("falls back to classic for an unknown template kind", async () => {
    await renderDispatch({ templateKind: "brand-new-tenant" });
    expect(screen.getByTestId("classic")).toBeInTheDocument();
  });

  it("forwards the enrollment link to every branded surface", async () => {
    for (const kind of [
      "espaciozenit",
      "mozarthitos",
      "nago",
      "mimundo",
      "liora",
      "classic",
    ]) {
      const { unmount } = await renderDispatch({
        templateKind: kind,
        enrollmentLink: { token: "tok-123" },
      });
      expect(screen.getByTestId(kind)).toHaveTextContent("tok-123");
      unmount();
    }
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/__tests__/organisms/RegisterSurfaceByTemplate.test.tsx`
Expected: FAIL — cannot resolve `@/components/organisms/RegisterSurfaceByTemplate` nor `@/components/organisms/RegisterClassicSurface`.

- [ ] **Step 3: Extract the classic layout into its own surface**

The classic branch is currently inline JSX at the end of `src/app/[locale]/register/page.tsx`. Move it verbatim into `src/components/organisms/RegisterClassicSurface.tsx`, adding the `enrollmentLink` pass-through:

```tsx
import Link from "next/link";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { RegisterForm } from "@/components/register/RegisterForm";
import { RegisterCollage } from "@/components/molecules/RegisterCollage";
import { RegisterSiteHeader } from "@/components/molecules/RegisterSiteHeader";
import { PublicContentLanguageFooter } from "@/components/molecules/PublicContentLanguageFooter";
import type { SectionEnrollmentLinkContext } from "@/lib/register/sectionEnrollmentLink";

export interface RegisterClassicSurfaceProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  legalAgeMajority: number;
  sectionOptions: { id: string; label: string }[];
  enrollmentLink?: SectionEnrollmentLinkContext;
}

export function RegisterClassicSurface({
  locale,
  dict,
  brand,
  legalAgeMajority,
  sectionOptions,
  enrollmentLink,
}: RegisterClassicSurfaceProps) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--color-muted)] px-4 py-10 md:py-14">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(55vh,520px)] -z-10 bg-[radial-gradient(ellipse_90%_80%_at_50%_-10%,color-mix(in_srgb,var(--color-accent)_16%,transparent)_0%,transparent_65%)] opacity-90"
        aria-hidden
      />
      <RegisterSiteHeader brand={brand} locale={locale} dict={dict} />

      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-start lg:gap-12 xl:gap-16">
        <header className="text-center lg:col-span-2">
          <h1 className="font-display text-3xl font-bold text-[var(--color-secondary)] md:text-4xl">
            {dict.register.title}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[var(--color-muted-foreground)] md:text-lg">
            {dict.register.lead}
          </p>
        </header>

        <RegisterCollage alts={dict.landing.collage.alts} />

        <div className="w-full max-w-lg justify-self-center lg:max-w-none lg:justify-self-stretch">
          <RegisterForm
            locale={locale}
            dict={dict.register}
            legalAgeMajority={legalAgeMajority}
            sectionOptions={sectionOptions}
            enrollmentLink={enrollmentLink}
          />
          <p className="mt-8 text-center text-sm lg:text-left">
            <Link
              href={`/${locale}/login`}
              className="text-[var(--color-primary)] underline decoration-[var(--color-primary)]/35 underline-offset-2 transition hover:decoration-[var(--color-primary)]"
            >
              {dict.login.title}
            </Link>
          </p>
        </div>
      </div>
      <PublicContentLanguageFooter locale={locale} labels={dict.common.locale} />
    </div>
  );
}
```

- [ ] **Step 4: Add the `enrollmentLink` prop to the five branded surfaces**

For each of `RegisterEspacioZenitSurface`, `RegisterMozarthitosSurface`, `RegisterNagoSurface`, `RegisterMiMundoSurface` and `RegisterLioraSurface`, make exactly three edits and change nothing else. Using `RegisterLioraSurface` as the worked example:

Add the import:

```tsx
import type { SectionEnrollmentLinkContext } from "@/lib/register/sectionEnrollmentLink";
```

Add the field to the props interface and the destructuring:

```tsx
export interface RegisterLioraSurfaceProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  legalAgeMajority: number;
  sectionOptions: { id: string; label: string }[];
  enrollmentLink?: SectionEnrollmentLinkContext;
}

export function RegisterLioraSurface({
  locale,
  dict,
  brand,
  legalAgeMajority,
  sectionOptions,
  enrollmentLink,
}: RegisterLioraSurfaceProps) {
```

Forward it to the form:

```tsx
            <RegisterForm
              locale={locale}
              dict={dict.register}
              legalAgeMajority={legalAgeMajority}
              sectionOptions={sectionOptions}
              enrollmentLink={enrollmentLink}
            />
```

`RegisterMiMundoSurface` passes `registerDict` rather than `dict.register` to the form; leave that as it is and only add `enrollmentLink`.

- [ ] **Step 5: Write the dispatch**

Create `src/components/organisms/RegisterSurfaceByTemplate.tsx`:

```tsx
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import type { SectionEnrollmentLinkContext } from "@/lib/register/sectionEnrollmentLink";
import { RegisterClassicSurface } from "@/components/organisms/RegisterClassicSurface";
import { RegisterEspacioZenitSurface } from "@/components/organisms/RegisterEspacioZenitSurface";
import { RegisterLioraSurface } from "@/components/organisms/RegisterLioraSurface";
import { RegisterMiMundoSurface } from "@/components/organisms/RegisterMiMundoSurface";
import { RegisterMozarthitosSurface } from "@/components/organisms/RegisterMozarthitosSurface";
import { RegisterNagoSurface } from "@/components/organisms/RegisterNagoSurface";

interface RegisterSurfaceByTemplateProps {
  templateKind: string;
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  legalAgeMajority: number;
  sectionOptions: { id: string; label: string }[];
  mediaMap?: LandingMediaMap;
  enrollmentLink?: SectionEnrollmentLinkContext;
}

/**
 * Single source of truth for which registration surface a tenant gets.
 * Shared by `/[locale]/register` and `/[locale]/i/[token]` so a new tenant
 * surface serves both routes at once (rule 28-tenant-register-surface).
 */
export function RegisterSurfaceByTemplate({
  templateKind,
  mediaMap,
  ...shellProps
}: RegisterSurfaceByTemplateProps) {
  if (templateKind === "espaciozenit") {
    return <RegisterEspacioZenitSurface {...shellProps} mediaMap={mediaMap} />;
  }
  if (templateKind === "mozarthitos") {
    return <RegisterMozarthitosSurface {...shellProps} mediaMap={mediaMap} />;
  }
  if (templateKind === "nago") {
    return <RegisterNagoSurface {...shellProps} />;
  }
  if (templateKind === "mimundo") {
    return <RegisterMiMundoSurface {...shellProps} />;
  }
  if (templateKind === "liora") {
    return <RegisterLioraSurface {...shellProps} />;
  }
  return <RegisterClassicSurface {...shellProps} />;
}
```

- [ ] **Step 6: Run the dispatch test to verify it passes**

Run: `npx vitest run src/__tests__/organisms/RegisterSurfaceByTemplate.test.tsx`
Expected: PASS, 8 tests.

- [ ] **Step 7: Make the register page delegate**

In `src/app/[locale]/register/page.tsx`, delete the five `if (templateKind === ...)` branches, the inline classic JSX, and the imports that are now only used by `RegisterClassicSurface` (`Link`, `RegisterForm`, `RegisterCollage`, `RegisterSiteHeader`, `PublicContentLanguageFooter`, and the five `Register*Surface` imports). Replace the return with:

```tsx
  return (
    <RegisterSurfaceByTemplate
      templateKind={templateKind}
      mediaMap={mediaMap}
      {...shellProps}
    />
  );
```

and add the one import:

```tsx
import { RegisterSurfaceByTemplate } from "@/components/organisms/RegisterSurfaceByTemplate";
```

Everything above the return — the `inscriptions_enabled` redirect, the parallel loads, the `list_registration_section_options` RPC, `applyLandingContentOverrides`, the media map and `shellProps` — stays exactly as it is.

- [ ] **Step 8: Write the token page**

Create `src/app/[locale]/i/[token]/page.tsx`:

```tsx
import type { Metadata } from "next";
import {
  getDictionary,
  type AppLocale,
} from "@/lib/i18n/dictionaries";
import { resolvePublicBrand } from "@/lib/brand/resolvePublicBrand";
import { getLegalAgeMajorityFromSystem } from "@/lib/brand/legalAge";
import { loadActiveTheme } from "@/lib/theme/loadActiveTheme";
import { applyLandingContentOverrides } from "@/lib/cms/applyLandingContentOverrides";
import { buildLandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { createLandingMediaPublicUrlBuilder } from "@/lib/cms/landingMediaPublicUrl";
import { loadSectionEnrollmentLink } from "@/lib/register/loadSectionEnrollmentLink";
import { RegisterSurfaceByTemplate } from "@/components/organisms/RegisterSurfaceByTemplate";
import { SectionEnrollmentLinkUnavailable } from "@/components/register/SectionEnrollmentLinkUnavailable";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string; token: string }>;
}

export default async function SectionEnrollmentLinkPage({ params }: PageProps) {
  const { locale, token } = await params;
  const loc = locale as AppLocale;

  const [baseDict, brand, snapshot, legalAgeMajority, link] = await Promise.all([
    getDictionary(locale),
    resolvePublicBrand(loc),
    loadActiveTheme(),
    getLegalAgeMajorityFromSystem(),
    loadSectionEnrollmentLink(token),
  ]);

  const dict = applyLandingContentOverrides(baseDict, snapshot?.theme.content, loc);

  if (!link) {
    return (
      <SectionEnrollmentLinkUnavailable
        locale={locale}
        labels={dict.register.sectionLink}
      />
    );
  }

  const mediaMap: LandingMediaMap | undefined = snapshot
    ? buildLandingMediaMap(snapshot.media, createLandingMediaPublicUrlBuilder())
    : undefined;

  return (
    <RegisterSurfaceByTemplate
      templateKind={snapshot?.theme.templateKind ?? "classic"}
      mediaMap={mediaMap}
      locale={locale}
      dict={dict}
      brand={brand}
      legalAgeMajority={legalAgeMajority}
      sectionOptions={[]}
      enrollmentLink={link}
    />
  );
}
```

`sectionOptions` is deliberately empty: in link mode `RegisterForm` never renders the picker, so fetching the options would be a wasted query.

Note there is no `getInscriptionsEnabled()` check. That is the decision from the spec — the token is its own authorization, so a teacher's link keeps working while public sign-ups are closed.

- [ ] **Step 9: Verify the whole register surface suite still passes**

```bash
npx vitest run src/__tests__/organisms
npx tsc --noEmit
npm run lint
```

Expected: all pass. `lint` must report no new warnings for unused imports in `src/app/[locale]/register/page.tsx` — if it does, you left an import behind in Step 7.

- [ ] **Step 10: Verify both routes render in the browser**

```bash
npm run dev:golden
```

Open `http://localhost:3000/es/register` and confirm it looks exactly as before. Then, using a token you set by hand on the local database, open `http://localhost:3000/es/i/<token>` and confirm the section card replaces the picker. Finally open `http://localhost:3000/es/i/00000000-0000-0000-0000-000000000000` and confirm the unavailable state, not a crash.

Repeat the token URL once with `SITE_BRAND_THEME_SLUG` pointing at a branded tenant (`npm run dev:liora`) to confirm rule 28: the page must wear the tenant's chrome, not the classic layout.

- [ ] **Step 11: Verification gate**

```bash
npx vitest run src/__tests__/organisms src/__tests__/components/register src/__tests__/app/submitSectionLinkRegistration.test.ts
npx tsc --noEmit
```

Expected: all pass, no type errors. Do not commit.

---

### Task 7: Server actions to generate, deactivate and rotate

The only writes to the token columns, authorised for the section's staff or an admin.

**Files:**
- Create: `src/lib/academics/sectionEnrollmentLinkAdmin.ts`
- Create: `src/app/[locale]/dashboard/teacher/sections/[sectionId]/enrollmentLinkActions.ts`
- Test: `src/__tests__/lib/academics/sectionEnrollmentLinkAdmin.test.ts`
- Test: `src/__tests__/app/enrollmentLinkActions.test.ts`

**The token table is unreachable over PostgREST**, by design (Task 1). So the loader below cannot `select` from it — it calls `section_enrollment_link_state(p_section_id)`, which is `SECURITY DEFINER` and gated on admin-or-section-staff. Writes go the other way: the actions authorize the caller themselves and then use the service-role client, which keeps its grant on the table.

**Interfaces:**
- Consumes: the `section_enrollment_links` table and `section_enrollment_link_state` from Task 1; `userIsSectionTeacherOrAssistant` from `@/lib/academics/userIsSectionTeacherOrAssistant`; `resolveIsAdminSession` from `@/lib/auth/resolveIsAdminSession`.
- Produces:
  - `loadSectionEnrollmentLinkState(supabase, sectionId): Promise<SectionEnrollmentLinkState>` where `SectionEnrollmentLinkState = { token: string | null; active: boolean; leadCount: number }`. A section with no link yet, and a caller who is not staff, both yield `{ token: null, active: false, leadCount: 0 }` — indistinguishable by design.
  - `type SectionEnrollmentLinkActionState = { ok: boolean; message?: string }`
  - `generateSectionEnrollmentLinkAction(locale, sectionId): Promise<SectionEnrollmentLinkActionState>`
  - `setSectionEnrollmentLinkActiveAction(locale, sectionId, active: boolean): Promise<SectionEnrollmentLinkActionState>`
  - `rotateSectionEnrollmentLinkAction(locale, sectionId): Promise<SectionEnrollmentLinkActionState>`

- [ ] **Step 1: Write the failing test for the state loader**

Create `src/__tests__/lib/academics/sectionEnrollmentLinkAdmin.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadSectionEnrollmentLinkState } from "@/lib/academics/sectionEnrollmentLinkAdmin";

const EMPTY = { token: null, active: false, leadCount: 0 };

function makeSupabase(result: { data: unknown; error: unknown }) {
  const rpc = vi.fn().mockResolvedValue(result);
  const from = vi.fn(() => {
    throw new Error("the link table is unreachable over PostgREST; use the rpc");
  });
  return { client: { from, rpc } as never, rpc, from };
}

describe("loadSectionEnrollmentLinkState", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reads the state through the security-definer rpc, never the table", async () => {
    const { client, rpc, from } = makeSupabase({
      data: [
        {
          token: "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
          is_active: true,
          lead_count: 7,
        },
      ],
      error: null,
    });
    await expect(loadSectionEnrollmentLinkState(client, "sec-1")).resolves.toEqual({
      token: "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
      active: true,
      leadCount: 7,
    });
    expect(rpc).toHaveBeenCalledWith("section_enrollment_link_state", {
      p_section_id: "sec-1",
    });
    expect(from).not.toHaveBeenCalled();
  });

  it("reports an empty state for a section that has no link yet", async () => {
    const { client } = makeSupabase({ data: [], error: null });
    await expect(loadSectionEnrollmentLinkState(client, "sec-1")).resolves.toEqual(
      EMPTY,
    );
  });

  it("reads a deactivated link without losing its token", async () => {
    const { client } = makeSupabase({
      data: [{ token: "tok-1", is_active: false, lead_count: 2 }],
      error: null,
    });
    await expect(loadSectionEnrollmentLinkState(client, "sec-1")).resolves.toEqual({
      token: "tok-1",
      active: false,
      leadCount: 2,
    });
  });

  it("coerces a bigint count serialised as a string", async () => {
    const { client } = makeSupabase({
      data: [{ token: "tok-1", is_active: true, lead_count: "4" }],
      error: null,
    });
    const state = await loadSectionEnrollmentLinkState(client, "sec-1");
    expect(state.leadCount).toBe(4);
  });

  // A caller who is not section staff also gets no rows. The two cases are
  // deliberately indistinguishable, so the loader must not try to tell them apart.
  it("reports an empty state when the rpc errors", async () => {
    const { client } = makeSupabase({ data: null, error: { message: "denied" } });
    const state = await loadSectionEnrollmentLinkState(client, "sec-1");
    expect(state).toEqual(EMPTY);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/__tests__/lib/academics/sectionEnrollmentLinkAdmin.test.ts`
Expected: FAIL — cannot resolve `@/lib/academics/sectionEnrollmentLinkAdmin`.

- [ ] **Step 3: Write the state loader**

Create `src/lib/academics/sectionEnrollmentLinkAdmin.ts`:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export interface SectionEnrollmentLinkState {
  token: string | null;
  active: boolean;
  leadCount: number;
}

const EMPTY_STATE: SectionEnrollmentLinkState = {
  token: null,
  active: false,
  leadCount: 0,
};

/**
 * Link state for the teacher and admin panels.
 *
 * `section_enrollment_links` has no grants and no policies, so it cannot be read over
 * PostgREST at all — this RPC is the only window onto it, and it enforces the
 * admin-or-section-staff check itself. A section without a link and a caller without
 * permission both yield no rows, and that ambiguity is intentional.
 */
export async function loadSectionEnrollmentLinkState(
  supabase: SupabaseClient,
  sectionId: string,
): Promise<SectionEnrollmentLinkState> {
  const { data, error } = await supabase.rpc("section_enrollment_link_state", {
    p_section_id: sectionId,
  });

  if (error) {
    logSupabaseClientError("loadSectionEnrollmentLinkState", error, {
      section_id: sectionId,
    });
    return EMPTY_STATE;
  }

  const row = (Array.isArray(data) ? data[0] : data) as
    | { token?: string | null; is_active?: boolean | null; lead_count?: unknown }
    | null
    | undefined;
  if (!row?.token) return EMPTY_STATE;

  // lead_count is a BIGINT, which PostgREST may serialise as a string.
  const count = Number(row.lead_count ?? 0);

  return {
    token: String(row.token),
    active: row.is_active === true,
    leadCount: Number.isFinite(count) ? count : 0,
  };
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/__tests__/lib/academics/sectionEnrollmentLinkAdmin.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Write the failing test for the actions**

Create `src/__tests__/app/enrollmentLinkActions.test.ts`:

```ts
/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const adminUpsert = vi.fn();
const adminUpdate = vi.fn();
const adminFrom = vi.fn();
const revalidatePath = vi.fn();
const userIsSectionTeacherOrAssistant = vi.fn();
const resolveIsAdminSession = vi.fn();
const randomUUID = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      adminFrom(table);
      return { upsert: adminUpsert, update: adminUpdate };
    },
  }),
}));

vi.mock("@/lib/academics/userIsSectionTeacherOrAssistant", () => ({
  userIsSectionTeacherOrAssistant: (...args: unknown[]) =>
    userIsSectionTeacherOrAssistant(...args),
}));

vi.mock("@/lib/auth/resolveIsAdminSession", () => ({
  resolveIsAdminSession: (...args: unknown[]) => resolveIsAdminSession(...args),
}));

vi.mock("node:crypto", () => ({ randomUUID: () => randomUUID() }));

const SECTION = "11111111-1111-1111-1111-111111111111";
const TOKEN = "3f2504e0-4f89-11d3-9a0c-0305e82c3301";

async function load() {
  return import(
    "@/app/[locale]/dashboard/teacher/sections/[sectionId]/enrollmentLinkActions"
  );
}

describe("section enrollment link actions", () => {
  beforeEach(() => {
    vi.resetModules();
    getUser.mockReset();
    adminUpsert.mockReset();
    adminUpdate.mockReset();
    adminFrom.mockReset();
    revalidatePath.mockReset();
    userIsSectionTeacherOrAssistant.mockReset();
    resolveIsAdminSession.mockReset();
    randomUUID.mockReset();

    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    userIsSectionTeacherOrAssistant.mockResolvedValue(true);
    resolveIsAdminSession.mockResolvedValue(false);
    randomUUID.mockReturnValue(TOKEN);
    adminUpsert.mockResolvedValue({ error: null });
    adminUpdate.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  });

  it("refuses an anonymous caller", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const { generateSectionEnrollmentLinkAction } = await load();
    const res = await generateSectionEnrollmentLinkAction("es", SECTION);
    expect(res.ok).toBe(false);
    expect(adminUpsert).not.toHaveBeenCalled();
  });

  it("refuses a teacher who does not lead the section", async () => {
    userIsSectionTeacherOrAssistant.mockResolvedValue(false);
    const { generateSectionEnrollmentLinkAction } = await load();
    const res = await generateSectionEnrollmentLinkAction("es", SECTION);
    expect(res.ok).toBe(false);
    expect(adminUpsert).not.toHaveBeenCalled();
  });

  it("allows an admin who does not lead the section", async () => {
    userIsSectionTeacherOrAssistant.mockResolvedValue(false);
    resolveIsAdminSession.mockResolvedValue(true);
    const { generateSectionEnrollmentLinkAction } = await load();
    const res = await generateSectionEnrollmentLinkAction("es", SECTION);
    expect(res.ok).toBe(true);
    expect(adminUpsert).toHaveBeenCalledTimes(1);
  });

  it("writes to the dedicated link table, never to academic_sections", async () => {
    const { generateSectionEnrollmentLinkAction } = await load();
    await generateSectionEnrollmentLinkAction("es", SECTION);
    expect(adminFrom).toHaveBeenCalledWith("section_enrollment_links");
    expect(adminFrom).not.toHaveBeenCalledWith("academic_sections");
  });

  it("generates a token, activates the link and stamps the author", async () => {
    const { generateSectionEnrollmentLinkAction } = await load();
    const res = await generateSectionEnrollmentLinkAction("es", SECTION);
    expect(res.ok).toBe(true);
    const [row, options] = adminUpsert.mock.calls[0];
    expect(row).toMatchObject({
      section_id: SECTION,
      token: TOKEN,
      is_active: true,
      created_by: "user-1",
    });
    expect(options).toEqual({ onConflict: "section_id" });
  });

  it("deactivates without discarding the token", async () => {
    const { setSectionEnrollmentLinkActiveAction } = await load();
    const res = await setSectionEnrollmentLinkActiveAction("es", SECTION, false);
    expect(res.ok).toBe(true);
    expect(adminUpsert).not.toHaveBeenCalled();
    expect(adminUpdate.mock.calls[0][0]).toMatchObject({ is_active: false });
  });

  it("rotates to a brand-new token", async () => {
    randomUUID.mockReturnValue("99999999-9999-9999-9999-999999999999");
    const { rotateSectionEnrollmentLinkAction } = await load();
    const res = await rotateSectionEnrollmentLinkAction("es", SECTION);
    expect(res.ok).toBe(true);
    expect(adminUpsert.mock.calls[0][0]).toMatchObject({
      section_id: SECTION,
      token: "99999999-9999-9999-9999-999999999999",
      is_active: true,
    });
  });

  it("rejects a section id that is not a uuid", async () => {
    const { generateSectionEnrollmentLinkAction } = await load();
    const res = await generateSectionEnrollmentLinkAction("es", "../../etc/passwd");
    expect(res.ok).toBe(false);
    expect(adminUpsert).not.toHaveBeenCalled();
  });

  it("revalidates the teacher and admin section screens after a write", async () => {
    const { generateSectionEnrollmentLinkAction } = await load();
    await generateSectionEnrollmentLinkAction("es", SECTION);
    expect(revalidatePath).toHaveBeenCalledWith(
      `/es/dashboard/teacher/sections/${SECTION}`,
      "page",
    );
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx vitest run src/__tests__/app/enrollmentLinkActions.test.ts`
Expected: FAIL — cannot resolve the `enrollmentLinkActions` module.

- [ ] **Step 7: Write the actions**

Create `src/app/[locale]/dashboard/teacher/sections/[sectionId]/enrollmentLinkActions.ts`:

```ts
"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { userIsSectionTeacherOrAssistant } from "@/lib/academics/userIsSectionTeacherOrAssistant";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import {
  logServerAuthzDenied,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";
import { isSectionEnrollmentLinkToken } from "@/lib/register/sectionEnrollmentLink";

export type SectionEnrollmentLinkActionState = { ok: boolean; message?: string };

const DENIED: SectionEnrollmentLinkActionState = { ok: false, message: "forbidden" };
const FAILED: SectionEnrollmentLinkActionState = { ok: false, message: "failed" };

/**
 * Section staff and admins may manage the link. Writing the token columns is an UPDATE
 * on `academic_sections`, which RLS reserves for admins, so the write goes through the
 * admin client only after this gate passes.
 */
async function authorize(
  sectionId: string,
  scope: string,
): Promise<{ userId: string } | null> {
  if (!isSectionEnrollmentLinkToken(sectionId)) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    logServerAuthzDenied(scope, { reason: "no_session" });
    return null;
  }

  const leads = await userIsSectionTeacherOrAssistant(supabase, user.id, sectionId);
  if (leads) return { userId: user.id };

  const isAdmin = await resolveIsAdminSession(supabase, user.id);
  if (isAdmin) return { userId: user.id };

  logServerAuthzDenied(scope, { reason: "not_section_staff", section_id: sectionId });
  return null;
}

/**
 * Creates the link row or replaces its token, activating it either way. Generate and
 * rotate are the same write: rotate simply runs when a row already exists.
 */
async function upsertLink(
  scope: string,
  sectionId: string,
  userId: string,
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.from("section_enrollment_links").upsert(
    {
      section_id: sectionId,
      token: randomUUID(),
      is_active: true,
      created_by: userId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "section_id" },
  );
  if (error) {
    logSupabaseClientError(scope, error, { section_id: sectionId });
    return false;
  }
  return true;
}

async function setLinkActive(
  scope: string,
  sectionId: string,
  active: boolean,
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("section_enrollment_links")
    .update({ is_active: active, updated_at: new Date().toISOString() })
    .eq("section_id", sectionId);
  if (error) {
    logSupabaseClientError(scope, error, { section_id: sectionId });
    return false;
  }
  return true;
}

function refresh(locale: string, sectionId: string): void {
  revalidatePath(`/${locale}/dashboard/teacher/sections/${sectionId}`, "page");
  revalidatePath(`/${locale}/dashboard/teacher/sections`, "page");
}

export async function generateSectionEnrollmentLinkAction(
  locale: string,
  sectionId: string,
): Promise<SectionEnrollmentLinkActionState> {
  const scope = "generateSectionEnrollmentLinkAction";
  const auth = await authorize(sectionId, scope);
  if (!auth) return DENIED;

  if (!(await upsertLink(scope, sectionId, auth.userId))) return FAILED;

  refresh(locale, sectionId);
  return { ok: true };
}

export async function setSectionEnrollmentLinkActiveAction(
  locale: string,
  sectionId: string,
  active: boolean,
): Promise<SectionEnrollmentLinkActionState> {
  const scope = "setSectionEnrollmentLinkActiveAction";
  const auth = await authorize(sectionId, scope);
  if (!auth) return DENIED;

  if (!(await setLinkActive(scope, sectionId, active === true))) return FAILED;

  refresh(locale, sectionId);
  return { ok: true };
}

export async function rotateSectionEnrollmentLinkAction(
  locale: string,
  sectionId: string,
): Promise<SectionEnrollmentLinkActionState> {
  const scope = "rotateSectionEnrollmentLinkAction";
  const auth = await authorize(sectionId, scope);
  if (!auth) return DENIED;

  if (!(await upsertLink(scope, sectionId, auth.userId))) return FAILED;

  refresh(locale, sectionId);
  return { ok: true };
}
```

`isSectionEnrollmentLinkToken` doubles as the section-id shape gate: both are UUIDs, and reusing it keeps one regular expression in the codebase.

- [ ] **Step 8: Run it to verify it passes**

Run: `npx vitest run src/__tests__/app/enrollmentLinkActions.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 9: Verification gate**

```bash
npx vitest run src/__tests__/app/enrollmentLinkActions.test.ts src/__tests__/lib/academics/sectionEnrollmentLinkAdmin.test.ts
npx tsc --noEmit
```

Expected: all pass, no type errors. Do not commit.

---

### Task 8: The shared panel and its three placements

What the teacher actually sees. One client component, three screens.

**Files:**
- Modify: `src/dictionaries/en.json`, `es.json`, `pt.json` (add `dashboard.sectionEnrollmentLink`)
- Create: `supabase/migrations/186_section_enrollment_links_bulk_state.sql`
- Create: `src/components/molecules/SectionEnrollmentLinkPanel.tsx`
- Create: `src/components/molecules/SectionEnrollmentLinkCopyButton.tsx`
- Modify: `src/app/[locale]/dashboard/teacher/sections/[sectionId]/page.tsx`
- Modify: `src/app/[locale]/dashboard/admin/academic/[cohortId]/[sectionId]/page.tsx`
- Test: `src/__tests__/components/SectionEnrollmentLinkPanel.test.tsx`

**Interfaces:**
- Consumes: `SectionEnrollmentLinkState` and the three actions from Task 7; `clientAbsoluteUrl` from `@/lib/client/publicUrl`.
- Produces: `SectionEnrollmentLinkPanel({ locale, sectionId, state, labels, canRevoke })`.

- [ ] **Step 1: Add the panel copy to all three dictionaries**

In `src/dictionaries/en.json`, inside `dashboard`, add:

```json
"sectionEnrollmentLink": {
  "title": "Invite families",
  "lead": "Share this link so families enter their own details. Every sign-up lands in the registrations inbox for review.",
  "generate": "Create enrollment link",
  "urlLabel": "Enrollment link",
  "copy": "Copy",
  "copied": "Link copied",
  "share": "Share",
  "leadCount": "{count} families have signed up through this link",
  "leadCountNone": "No family has used this link yet",
  "inactiveNotice": "This link is deactivated. Families who open it see a closed message.",
  "activate": "Reactivate link",
  "deactivate": "Deactivate link",
  "rotate": "Generate a new link",
  "rotateConfirmTitle": "Generate a new link?",
  "rotateConfirmBody": "The current link stops working immediately. Families who already have it will need the new one.",
  "rotateConfirm": "Generate new link",
  "cancel": "Cancel",
  "error": "The action could not be completed. Please try again."
}
```

In `src/dictionaries/es.json`:

```json
"sectionEnrollmentLink": {
  "title": "Invitar familias",
  "lead": "Compartí este link para que las familias carguen sus propios datos. Cada inscripción llega a la bandeja de inscripciones para revisión.",
  "generate": "Crear link de inscripción",
  "urlLabel": "Link de inscripción",
  "copy": "Copiar",
  "copied": "Link copiado",
  "share": "Compartir",
  "leadCount": "{count} familias se inscribieron por este link",
  "leadCountNone": "Todavía ninguna familia usó este link",
  "inactiveNotice": "Este link está desactivado. Las familias que lo abran ven un mensaje de cerrado.",
  "activate": "Reactivar link",
  "deactivate": "Desactivar link",
  "rotate": "Generar un link nuevo",
  "rotateConfirmTitle": "¿Generar un link nuevo?",
  "rotateConfirmBody": "El link actual deja de funcionar de inmediato. Las familias que ya lo tengan van a necesitar el nuevo.",
  "rotateConfirm": "Generar link nuevo",
  "cancel": "Cancelar",
  "error": "No se pudo completar la acción. Intentá de nuevo."
}
```

In `src/dictionaries/pt.json`:

```json
"sectionEnrollmentLink": {
  "title": "Convidar famílias",
  "lead": "Compartilhe este link para que as famílias preencham seus próprios dados. Cada inscrição chega à caixa de inscrições para revisão.",
  "generate": "Criar link de inscrição",
  "urlLabel": "Link de inscrição",
  "copy": "Copiar",
  "copied": "Link copiado",
  "share": "Compartilhar",
  "leadCount": "{count} famílias se inscreveram por este link",
  "leadCountNone": "Nenhuma família usou este link ainda",
  "inactiveNotice": "Este link está desativado. As famílias que o abrirem verão uma mensagem de encerrado.",
  "activate": "Reativar link",
  "deactivate": "Desativar link",
  "rotate": "Gerar um novo link",
  "rotateConfirmTitle": "Gerar um novo link?",
  "rotateConfirmBody": "O link atual para de funcionar imediatamente. As famílias que já o tiverem precisarão do novo.",
  "rotateConfirm": "Gerar novo link",
  "cancel": "Cancelar",
  "error": "Não foi possível concluir a ação. Tente novamente."
}
```

- [ ] **Step 2: Write the failing test for the panel**

Create `src/__tests__/components/SectionEnrollmentLinkPanel.test.tsx`:

```tsx
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const generate = vi.fn();
const setActive = vi.fn();
const rotate = vi.fn();
const refresh = vi.fn();
const writeText = vi.fn();

vi.mock(
  "@/app/[locale]/dashboard/teacher/sections/[sectionId]/enrollmentLinkActions",
  () => ({
    generateSectionEnrollmentLinkAction: (...a: unknown[]) => generate(...a),
    setSectionEnrollmentLinkActiveAction: (...a: unknown[]) => setActive(...a),
    rotateSectionEnrollmentLinkAction: (...a: unknown[]) => rotate(...a),
  }),
);

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

// jsdom does not implement HTMLDialogElement.showModal, which the real Modal calls in a
// layout effect. Render children when open and keep the assertions on the panel.
vi.mock("@/components/atoms/Modal", () => ({
  Modal: ({
    open,
    title,
    children,
  }: {
    open: boolean;
    title: string;
    children: React.ReactNode;
  }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        {children}
      </div>
    ) : null,
}));

const labels = {
  title: "Invitar familias",
  lead: "Compartí este link",
  generate: "Crear link de inscripción",
  urlLabel: "Link de inscripción",
  copy: "Copiar",
  copied: "Link copiado",
  share: "Compartir",
  leadCount: "{count} familias se inscribieron por este link",
  leadCountNone: "Todavía ninguna familia usó este link",
  inactiveNotice: "Este link está desactivado.",
  activate: "Reactivar link",
  deactivate: "Desactivar link",
  rotate: "Generar un link nuevo",
  rotateConfirmTitle: "¿Generar un link nuevo?",
  rotateConfirmBody: "El link actual deja de funcionar.",
  rotateConfirm: "Generar link nuevo",
  cancel: "Cancelar",
  error: "No se pudo completar la acción.",
};

const SECTION = "11111111-1111-1111-1111-111111111111";
const TOKEN = "3f2504e0-4f89-11d3-9a0c-0305e82c3301";

async function renderPanel(
  state: { token: string | null; active: boolean; leadCount: number },
  canRevoke = true,
) {
  const { SectionEnrollmentLinkPanel } = await import(
    "@/components/molecules/SectionEnrollmentLinkPanel"
  );
  return render(
    <SectionEnrollmentLinkPanel
      locale="es"
      sectionId={SECTION}
      state={state}
      labels={labels}
      canRevoke={canRevoke}
    />,
  );
}

describe("SectionEnrollmentLinkPanel", () => {
  beforeEach(() => {
    vi.resetModules();
    generate.mockReset();
    setActive.mockReset();
    rotate.mockReset();
    refresh.mockReset();
    writeText.mockReset();
    generate.mockResolvedValue({ ok: true });
    setActive.mockResolvedValue({ ok: true });
    rotate.mockResolvedValue({ ok: true });
    Object.assign(navigator, { clipboard: { writeText } });
    writeText.mockResolvedValue(undefined);
  });

  it("offers only the generate button when no link exists", async () => {
    await renderPanel({ token: null, active: false, leadCount: 0 });
    expect(screen.getByRole("button", { name: labels.generate })).toBeInTheDocument();
    expect(screen.queryByLabelText(labels.urlLabel)).not.toBeInTheDocument();
  });

  it("generates the link and refreshes the screen", async () => {
    const user = userEvent.setup();
    await renderPanel({ token: null, active: false, leadCount: 0 });
    await user.click(screen.getByRole("button", { name: labels.generate }));
    expect(generate).toHaveBeenCalledWith("es", SECTION);
    expect(refresh).toHaveBeenCalled();
  });

  it("shows the absolute url once a link exists", async () => {
    await renderPanel({ token: TOKEN, active: true, leadCount: 0 });
    const field = screen.getByLabelText(labels.urlLabel) as HTMLInputElement;
    expect(field.value).toContain(`/es/i/${TOKEN}`);
    expect(field).toHaveAttribute("readonly");
  });

  it("copies the url to the clipboard", async () => {
    const user = userEvent.setup();
    await renderPanel({ token: TOKEN, active: true, leadCount: 0 });
    await user.click(screen.getByRole("button", { name: labels.copy }));
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(String(writeText.mock.calls[0][0])).toContain(`/es/i/${TOKEN}`);
    expect(await screen.findByText(labels.copied)).toBeInTheDocument();
  });

  it("interpolates the lead count and handles zero separately", async () => {
    const { unmount } = await renderPanel({ token: TOKEN, active: true, leadCount: 4 });
    expect(
      screen.getByText("4 familias se inscribieron por este link"),
    ).toBeInTheDocument();
    unmount();

    await renderPanel({ token: TOKEN, active: true, leadCount: 0 });
    expect(screen.getByText(labels.leadCountNone)).toBeInTheDocument();
  });

  it("warns when the link is deactivated and offers reactivation", async () => {
    const user = userEvent.setup();
    await renderPanel({ token: TOKEN, active: false, leadCount: 0 });
    expect(screen.getByText(labels.inactiveNotice)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: labels.activate }));
    expect(setActive).toHaveBeenCalledWith("es", SECTION, true);
  });

  it("asks for confirmation in a modal before rotating", async () => {
    const user = userEvent.setup();
    await renderPanel({ token: TOKEN, active: true, leadCount: 0 });
    await user.click(screen.getByRole("button", { name: labels.rotate }));
    expect(rotate).not.toHaveBeenCalled();
    expect(screen.getByText(labels.rotateConfirmBody)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: labels.rotateConfirm }));
    expect(rotate).toHaveBeenCalledWith("es", SECTION);
  });

  it("hides deactivate and rotate when the caller may not revoke", async () => {
    await renderPanel({ token: TOKEN, active: true, leadCount: 0 }, false);
    expect(
      screen.queryByRole("button", { name: labels.deactivate }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: labels.rotate })).not.toBeInTheDocument();
  });

  it("surfaces a failed action without pretending it worked", async () => {
    const user = userEvent.setup();
    generate.mockResolvedValue({ ok: false });
    await renderPanel({ token: null, active: false, leadCount: 0 });
    await user.click(screen.getByRole("button", { name: labels.generate }));
    expect(await screen.findByText(labels.error)).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run src/__tests__/components/SectionEnrollmentLinkPanel.test.tsx`
Expected: FAIL — cannot resolve `@/components/molecules/SectionEnrollmentLinkPanel`.

- [ ] **Step 4: Write the panel**

Create `src/components/molecules/SectionEnrollmentLinkPanel.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Link2, Power, RefreshCw, Share2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { Modal } from "@/components/atoms/Modal";
import { clientAbsoluteUrl } from "@/lib/client/publicUrl";
import type { SectionEnrollmentLinkState } from "@/lib/academics/sectionEnrollmentLinkAdmin";
import {
  generateSectionEnrollmentLinkAction,
  rotateSectionEnrollmentLinkAction,
  setSectionEnrollmentLinkActiveAction,
} from "@/app/[locale]/dashboard/teacher/sections/[sectionId]/enrollmentLinkActions";
import type { Dictionary } from "@/types/i18n";

interface SectionEnrollmentLinkPanelProps {
  locale: string;
  sectionId: string;
  state: SectionEnrollmentLinkState;
  labels: Dictionary["dashboard"]["sectionEnrollmentLink"];
  /** Admins and the section's own teacher may revoke; read-only viewers may not. */
  canRevoke: boolean;
}

export function SectionEnrollmentLinkPanel({
  locale,
  sectionId,
  state,
  labels,
  canRevoke,
}: SectionEnrollmentLinkPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rotateOpen, setRotateOpen] = useState(false);

  const url = state.token
    ? clientAbsoluteUrl(`/${locale}/i/${state.token}`)
    : null;

  function run(action: () => Promise<{ ok: boolean }>) {
    setError(false);
    startTransition(async () => {
      const res = await action();
      if (!res.ok) {
        setError(true);
        return;
      }
      router.refresh();
    });
  }

  async function onCopy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setError(true);
    }
  }

  async function onShare() {
    if (!url) return;
    if (typeof navigator.share !== "function") {
      await onCopy();
      return;
    }
    try {
      await navigator.share({ title: labels.title, url });
    } catch {
      // A cancelled share sheet is not an error worth reporting.
    }
  }

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--color-primary)]">
        <Link2 className="h-5 w-5 shrink-0" aria-hidden />
        {labels.title}
      </h2>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{labels.lead}</p>

      {!url ? (
        <Button
          type="button"
          className="mt-4"
          disabled={pending}
          isLoading={pending}
          onClick={() =>
            run(() => generateSectionEnrollmentLinkAction(locale, sectionId))
          }
        >
          <Link2 className="h-4 w-4 shrink-0" aria-hidden />
          {labels.generate}
        </Button>
      ) : (
        <div className="mt-4 space-y-3">
          <div>
            <Label htmlFor="sel-url">{labels.urlLabel}</Label>
            <Input id="sel-url" value={url} readOnly className="mt-1 w-full" />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={onCopy}>
              <Copy className="h-4 w-4 shrink-0" aria-hidden />
              {labels.copy}
            </Button>
            <Button type="button" variant="secondary" onClick={onShare}>
              <Share2 className="h-4 w-4 shrink-0" aria-hidden />
              {labels.share}
            </Button>
            {canRevoke ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={pending}
                  onClick={() =>
                    run(() =>
                      setSectionEnrollmentLinkActiveAction(
                        locale,
                        sectionId,
                        !state.active,
                      ),
                    )
                  }
                >
                  <Power className="h-4 w-4 shrink-0" aria-hidden />
                  {state.active ? labels.deactivate : labels.activate}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={pending}
                  onClick={() => setRotateOpen(true)}
                >
                  <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
                  {labels.rotate}
                </Button>
              </>
            ) : null}
          </div>

          {copied ? (
            <p className="text-sm text-[var(--color-muted-foreground)]" role="status">
              {labels.copied}
            </p>
          ) : null}
          {!state.active ? (
            <p className="text-sm text-[var(--color-foreground)]" role="note">
              {labels.inactiveNotice}
            </p>
          ) : null}
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {state.leadCount === 0
              ? labels.leadCountNone
              : labels.leadCount.replace("{count}", String(state.leadCount))}
          </p>
        </div>
      )}

      {error ? (
        <p className="mt-3 text-sm text-[var(--color-error)]" role="alert">
          {labels.error}
        </p>
      ) : null}

      <Modal
        open={rotateOpen}
        onOpenChange={setRotateOpen}
        titleId="sel-rotate-title"
        title={labels.rotateConfirmTitle}
      >
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {labels.rotateConfirmBody}
        </p>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setRotateOpen(false)}
          >
            {labels.cancel}
          </Button>
          <Button
            type="button"
            disabled={pending}
            isLoading={pending}
            onClick={() => {
              setRotateOpen(false);
              run(() => rotateSectionEnrollmentLinkAction(locale, sectionId));
            }}
          >
            <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
            {labels.rotateConfirm}
          </Button>
        </div>
      </Modal>
    </section>
  );
}
```

The primitive signatures above are already verified against the tree: `Modal` lives in `@/components/atoms/Modal` and takes `open`, `onOpenChange`, `titleId` and `title`; `Button` accepts `variant` of `"primary" | "secondary" | "ghost" | "destructive" | "destructiveStrong"` plus `isLoading`; `Input` is a `forwardRef` over `<input>`; `Label` takes `children`, `required` and `className`. Use them as written and do not modify the primitives.

- [ ] **Step 5: Run the panel test to verify it passes**

Run: `npx vitest run src/__tests__/components/SectionEnrollmentLinkPanel.test.tsx`
Expected: PASS, 9 tests.

- [ ] **Step 6: Place the panel on the teacher's section page**

In `src/app/[locale]/dashboard/teacher/sections/[sectionId]/page.tsx`, add the imports:

```tsx
import { loadSectionEnrollmentLinkState } from "@/lib/academics/sectionEnrollmentLinkAdmin";
import { SectionEnrollmentLinkPanel } from "@/components/molecules/SectionEnrollmentLinkPanel";
```

After the existing `loadTeacherSectionDetailModel` call, load the state:

```tsx
  const enrollmentLinkState = await loadSectionEnrollmentLinkState(
    supabase,
    sectionId,
  );
```

Then render the panel between the row of section links and `<TeacherSectionRoster>`:

```tsx
      {enrollmentLinkState ? (
        <SectionEnrollmentLinkPanel
          locale={locale}
          sectionId={sectionId}
          state={enrollmentLinkState}
          labels={dict.dashboard.sectionEnrollmentLink}
          canRevoke
        />
      ) : null}
```

`dict` in that file is already the full dictionary; `d` is the `teacherMySections` slice. Use `dict.dashboard.sectionEnrollmentLink`.

- [ ] **Step 7: Place the panel on the admin's section page**

In `src/app/[locale]/dashboard/admin/academic/[cohortId]/[sectionId]/page.tsx`, add the same two imports, load the state with the request-scoped client already in that file, and render the panel with `canRevoke` set. Read the file first to find where the section header ends and place the panel directly below it, so admins and teachers see it in the same relative position.

- [ ] **Step 8: Add the copy-link affordance to the teacher's section list**

The list cannot read the tokens: `section_enrollment_links` has no grants, and calling `section_enrollment_link_state` once per row would be an N+1 on every page load. Add a bulk companion RPC in its own migration, `supabase/migrations/186_section_enrollment_links_bulk_state.sql`:

```sql
-- Bulk companion to section_enrollment_link_state, so the teacher's section list can
-- offer a copy button without one round trip per section. Same staff gate, applied per
-- row: a caller sees only the links of sections they administer or staff.
CREATE OR REPLACE FUNCTION public.section_enrollment_links_for_staff()
RETURNS TABLE (section_id UUID, token UUID, is_active BOOLEAN)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.section_id, l.token, l.is_active
  FROM public.section_enrollment_links l
  WHERE public.is_admin(auth.uid())
     OR public.user_leads_or_assists_section(auth.uid(), l.section_id);
$$;

COMMENT ON FUNCTION public.section_enrollment_links_for_staff() IS
  'Enrollment links for every section the caller administers or staffs; empty for anyone else.';

REVOKE ALL ON FUNCTION public.section_enrollment_links_for_staff() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.section_enrollment_links_for_staff() FROM anon;
GRANT EXECUTE ON FUNCTION public.section_enrollment_links_for_staff() TO authenticated;
```

Add `src/__tests__/db/section_enrollment_links_bulk_state_migration.test.ts` asserting the same three things the Task 1 test asserts about grants — `REVOKE ... FROM PUBLIC`, `REVOKE ... FROM anon`, `GRANT EXECUTE ... TO authenticated` — plus that the body carries both `is_admin` and `user_leads_or_assists_section`.

Then in `src/app/[locale]/dashboard/teacher/sections/page.tsx`, call the RPC once, build a `Map` from `section_id` to `{ token, is_active }`, and for each listed section whose entry exists and is active, render a copy button. The page is a server component, so extract only the button into a client component `src/components/molecules/SectionEnrollmentLinkCopyButton.tsx` taking `{ url, labels: { copy, copied } }` and reusing `clientAbsoluteUrl(`/${locale}/i/${token}`)`. Do not turn the list into a client component.

- [ ] **Step 9: Verify the three screens in the browser**

```bash
npm run dev:golden
```

As a teacher: open a section, create the link, copy it, deactivate it, confirm the public page shows the closed message, reactivate it, rotate it, and confirm the previous URL stops resolving. As an admin: open the same section under `/dashboard/admin/academic/...` and confirm the panel shows the same state.

- [ ] **Step 10: Verification gate**

```bash
npx vitest run src/__tests__/components/SectionEnrollmentLinkPanel.test.tsx
npx tsc --noEmit
npm run lint
```

Expected: all pass, no new warnings. Do not commit.

---

### Task 9: Attribution badge in the admin registrations inbox

So an admin can tell a link lead from a public-form lead without opening the row.

**Files:**
- Modify: `src/dictionaries/en.json`, `es.json`, `pt.json` (add `dashboard.registrations.viaSectionLink`)
- Modify: `src/lib/dashboard/loadPaginatedRegistrations.ts`
- Modify: `src/types/adminRegistration.ts`
- Modify: `src/components/dashboard/AdminRegistrationTableRow.tsx`
- Test: `src/__tests__/lib/dashboard/loadPaginatedRegistrationsSourceLink.test.ts`

**Interfaces:**
- Consumes: `registrations.source_section_link_id` from Task 1.
- Produces: `AdminRegistrationRow.sourceSectionLinkId: string | null`.

- [ ] **Step 1: Read the current loader and row type**

```bash
rg -n "preferred_section_id|select\(" src/lib/dashboard/loadPaginatedRegistrations.ts
rg -n "interface AdminRegistrationRow" -A 25 src/types/adminRegistration.ts
```

Note the exact column list and the row shape. Both files are shared with the desktop table, the PWA list and the export, so the addition must be additive.

- [ ] **Step 2: Write the failing test**

Create `src/__tests__/lib/dashboard/loadPaginatedRegistrationsSourceLink.test.ts`:

```ts
/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// The loader is a thin PostgREST query; asserting on its column list is the cheapest
// way to keep the badge from silently losing its data source.
describe("loadPaginatedRegistrations column list", () => {
  const source = readFileSync(
    resolve(process.cwd(), "src/lib/dashboard/loadPaginatedRegistrations.ts"),
    "utf-8",
  );

  it("selects the section link attribution column", () => {
    expect(source).toContain("source_section_link_id");
  });

  it("maps it onto the row model", () => {
    expect(source).toContain("sourceSectionLinkId");
  });

  it("still avoids select all", () => {
    expect(source).not.toMatch(/select\(\s*["'`]\*/);
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run src/__tests__/lib/dashboard/loadPaginatedRegistrationsSourceLink.test.ts`
Expected: FAIL — `source_section_link_id` is not in the loader.

- [ ] **Step 4: Thread the column through**

Add `source_section_link_id` to the loader's `select(...)` column list, and map it onto the row as `sourceSectionLinkId: row.source_section_link_id ?? null`. Add `sourceSectionLinkId: string | null;` to `AdminRegistrationRow` in `src/types/adminRegistration.ts`.

- [ ] **Step 5: Add the badge copy**

Add to `dashboard.registrations` in all three dictionaries — `en.json`: `"viaSectionLink": "via link"`; `es.json`: `"viaSectionLink": "vía link"`; `pt.json`: `"viaSectionLink": "via link"`.

If `dashboard.registrations` is not the group the table already uses, put the key in whichever group `AdminRegistrationTableRow` reads its labels from, keeping one group per component.

- [ ] **Step 6: Render the badge**

In `src/components/dashboard/AdminRegistrationTableRow.tsx`, next to the section or level cell, render the badge only when `row.sourceSectionLinkId` is set:

```tsx
{row.sourceSectionLinkId ? (
  <span className="ml-2 inline-flex items-center rounded-full bg-[var(--color-muted)] px-2 py-0.5 text-xs font-medium text-[var(--color-muted-foreground)]">
    {labels.viaSectionLink}
  </span>
) : null}
```

The section name itself is already in `level_interest`, which the token action fills with `"<cohort> — <section>"`, so the badge only has to say where the lead came from.

- [ ] **Step 7: Run the test and the surrounding suites**

```bash
npx vitest run src/__tests__/lib/dashboard/loadPaginatedRegistrationsSourceLink.test.ts
npx vitest run src/__tests__/dashboard src/__tests__/lib/dashboard
```

Expected: the new test passes and no pre-existing registrations test breaks. Adding a field to the row type may break a test that builds a full `AdminRegistrationRow` fixture; add `sourceSectionLinkId: null` to those fixtures.

- [ ] **Step 8: Verification gate**

```bash
npx tsc --noEmit
npm run lint
```

Expected: no type errors, no new warnings. Do not commit.

---

### Task 10: End-to-end coverage and the manual QA note

The one test that proves the whole path, and the note the repo owner needs before applying anything to production.

**Files:**
- Create: `e2e/section-enrollment-link.spec.ts`
- Create: `docs/manual-qa/2026-08-08-section-enrollment-link.md`

**Interfaces:**
- Consumes: everything from Tasks 1 to 9.
- Produces: no application code.

- [ ] **Step 1: Read an existing spec to copy the harness**

```bash
rg -n "test\(|login|storageState" e2e/critical-registration.spec.ts
```

Reuse that file's sign-in helpers, selectors and fixtures rather than inventing new ones. Note how it seeds a teacher, an admin and a section, and follow the same approach.

- [ ] **Step 2: Write the end-to-end spec**

Create `e2e/section-enrollment-link.spec.ts` covering exactly two flows, using the helpers found in Step 1:

Flow one, the happy path. Sign in as the teacher who leads a seeded section. Open `/es/dashboard/teacher/sections/<sectionId>`. Click the generate button. Read the value of the enrollment-link field. Open that URL in a fresh, unauthenticated browser context. Assert the section card names the seeded section and that no section `<select>` is present. Fill the form as a minor — which forces the tutor fieldset — and submit. Assert the success dialog appears. Sign in as an admin, open `/es/dashboard/admin/registrations`, and assert the new lead is listed with the "vía link" badge.

Flow two, revocation. As the teacher, deactivate the link. Open the same URL unauthenticated and assert the closed message renders and no form is present. Rotate the link and assert the old URL still shows the closed or unavailable message while the new URL renders the form.

Assert on user-visible text from `es.json` and on roles, never on Tailwind class names.

- [ ] **Step 3: Run the spec**

```bash
npx playwright test e2e/section-enrollment-link.spec.ts
```

Expected: both flows pass. If the local database lacks the migration, run the stack-up script the precommit hook uses (`npm run e2e:stack:up`) first.

- [ ] **Step 4: Write the manual QA note**

Create `docs/manual-qa/2026-08-08-section-enrollment-link.md` listing what only a human can confirm, per rule `32-manual-qa-user-owned.mdc`: that the native share sheet opens on a real phone and offers WhatsApp; that the token page wears the correct brand on each tenant deployment (`golden`, `liora`, `mimundo`, `nago`, `mozarthitos`, `espaciozenit`); that the link still works with `inscriptions_enabled` switched off; and that the migration has been applied to every tenant database via `sql:apply-migration:all-tenants`, which is the repo owner's call and not the implementer's.

- [ ] **Step 5: Full verification gate**

```bash
npm run lint
npx tsc --noEmit
npm run test:coverage
```

Expected: all pass. Report the result and stop — the repo owner commits the whole feature themselves.

---

## Self-Review

**Spec coverage.** Every spec section maps to a task: the database schema, three RPCs and the RLS branch to Task 1; the loader and token validation to Task 2; the copy and the fixed section card to Task 3; the shared-form extension to Task 4; the public route, the action and the unavailable state to Task 5; the rule-28 tenant surfaces to Task 6; generate, deactivate and rotate to Task 7; the three placements described under "Placement" to Task 8; the inbox attribution badge to Task 9; and the testing section to Task 10, with the manual items the repo owner owns split out.

**Error-handling coverage.** Malformed token, unknown or rotated token, deactivated link, archived section or cohort, full section, failed insert and duplicate minor email each have a test in Task 2, 3 or 5. The teacher-side permission denial is covered in Task 7.

**Type consistency.** `SectionEnrollmentLinkContext` is defined once in Task 2 and consumed unchanged in Tasks 3, 4, 5 and 6. `SectionEnrollmentLinkState` is defined in Task 7 and consumed in Task 8. `submitSectionLinkRegistration(locale, token, raw)` has the same three-argument signature in Task 4's mock, Task 5's implementation and Task 5's test. The three panel actions take `(locale, sectionId)` and `(locale, sectionId, active)` consistently in Tasks 7 and 8.

**Two ordering dependencies are called out where they bite:** Task 4 imports the action file created in Task 5, and Task 5's page imports the dispatch created in Task 6. Both notes appear at the top of the affected task.

**Verified against the tree while writing this plan, so the implementer does not have to guess:** `is_admin(uid uuid)` and `user_leads_or_assists_section(p_uid uuid, p_section_id uuid)` exist with the argument order used in Task 1; `Modal` lives in `@/components/atoms/Modal` with `open` / `onOpenChange` / `titleId` / `title`; `Button` supports `variant="secondary"` and `isLoading`; all six register surfaces pass `RegisterForm` the same four props; and `buildPublicRegistrationSchema` requires `preferred_section_id` to be a UUID or the "undecided" sentinel, which is why Task 4 keeps a hidden input.

**One open question, with a verification step rather than a guess:** whether the anon RLS branch is load-bearing for the insert (Task 1, Step 6). PostgreSQL documents that referential integrity checks bypass row security, which contradicts migration 030's comment. The step proves it on the local stack and corrects the comment either way.

**Two shapes to read before editing, because they are shared with the export, the desktop table and the PWA list:** the registrations loader column list and `AdminRegistrationRow` (Task 9, Step 1).
