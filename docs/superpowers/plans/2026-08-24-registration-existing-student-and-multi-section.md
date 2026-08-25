# Existing-student match and multi-section registration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Public `/register` and `/i/[token]` look up a student by document, confirm the stored name, skip tutor when they already exist, and let the family request several sections in one lead that the admin accepts without creating a second ficha.

**Architecture:** Additive `additional_section_ids` on `registrations` plus a name-only `lookup_registration_student` RPC. Match is always re-derived from the normalized document (no client `matched_student_id`). `RegisterForm` becomes a two-step wizard shared by every tenant surface. `acceptRegistration` reuses the existing student and commits requested `section_enrollments` without capacity override.

**Tech Stack:** Next.js App Router, Zod, Supabase Postgres (`SECURITY DEFINER` RPCs), Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-24-registration-existing-student-and-multi-section-design.md`

## Global Constraints

- Spec authority: that file. A public submit is still a `registrations` lead, never a `section_enrollments` write.
- Do not fork `RegisterForm` (rule `28-tenant-register-surface.mdc`).
- i18n `en` / `es` / `pt` same key shape (rule `09-i18n-copy.mdc`).
- Supabase only via `src/lib/supabase/` (rule `12-supabase-app-boundaries.mdc`).
- Migrations additive only (rule `21-migrations-production-no-data-destruction.mdc`).
- Files ≤ 250 lines (rule `03-architecture.mdc`).
- Tests under `src/__tests__/` are self-contained (rule `30-harness-self-contained-tests.mdc`).
- Commits: only when the user asks. Each task ends with `npx vitest run <paths>` + `npx tsc --noEmit` as needed. Do not `git commit` unless asked.
- Commands: `npx vitest run <path>`, `npx tsc --noEmit`.

---

### Task 1: Document normalize + requested-section parse

Pure helpers the RPC wrapper, submit, inbox and accept all share.

**Files:**
- Create: `src/lib/register/normalizeRegistrationDocument.ts`
- Create: `src/lib/register/parseRequestedSectionIds.ts`
- Test: `src/__tests__/lib/register/normalizeRegistrationDocument.test.ts`
- Test: `src/__tests__/lib/register/parseRequestedSectionIds.test.ts`

**Interfaces:**
- Consumes: `normalizeDni` from `@/lib/import/studentImportUtils`, `REGISTRATION_UNDECIDED_FORM_VALUE` from `@/lib/register/registrationSectionConstants`.
- Produces:
  - `normalizeRegistrationDocument(raw: string): string` — same as `normalizeDni(raw).dni` (strip `.` and whitespace, trim; do not lowercase here).
  - `ParseRequestedSectionsOk = { ok: true; preferredSectionId: string | null; additionalSectionIds: string[]; undecided: boolean }`
  - `ParseRequestedSectionsErr = { ok: false; reason: "undecided_with_extras" }`
  - `parseRequestedSectionIds(input: { selectedIds: string[]; sectionOptionsOrder: string[]; lockedPreferredId?: string | null; allowUndecided: boolean }): ParseRequestedSectionsOk | ParseRequestedSectionsErr`

**Rules for `parseRequestedSectionIds`:**
- Deduplicate selected ids, preserve first occurrence.
- If `allowUndecided` and selected contains `REGISTRATION_UNDECIDED_FORM_VALUE`: if any other concrete uuid is also selected → `{ ok: false, reason: "undecided_with_extras" }`; else `{ ok: true, preferredSectionId: null, additionalSectionIds: [], undecided: true }`.
- If `lockedPreferredId` is set (token form): that id is always `preferredSectionId`; extras are selected uuids minus the locked id, minus anything not in `sectionOptionsOrder`.
- Else (`/register`): among selected uuids that appear in `sectionOptionsOrder`, the first in **options order** is preferred; the rest are additional.

- [ ] **Step 1: Write the failing tests** (files above). Cover: dots/spaces match `normalizeDni`; undecided exclusive; locked preferred never in the array; options-order preferred, not click order.

- [ ] **Step 2: Run tests — expect FAIL** (modules missing).

```bash
npx vitest run src/__tests__/lib/register/normalizeRegistrationDocument.test.ts src/__tests__/lib/register/parseRequestedSectionIds.test.ts
```

- [ ] **Step 3: Implement the two modules.** Reuse `normalizeDni`; do not copy the regex.

- [ ] **Step 4: Re-run the same vitest command — expect PASS.**

---

### Task 2: Migration 188 — column + lookup RPC

**Files:**
- Create: `supabase/migrations/188_registration_additional_sections.sql`
- Test: `src/__tests__/db/registration_additional_sections_migration.test.ts`

**Interfaces:**
- Produces:
  - `registrations.additional_section_ids UUID[] NOT NULL DEFAULT '{}'`
  - `lookup_registration_student(p_dni text)` returns `TABLE (found boolean, first_name text, last_name text)`
  - `STABLE SECURITY DEFINER`, `search_path = public`
  - Normalize in SQL: `lower(trim(both FROM replace(replace(p_dni, '.', ''), ' ', '')))` compared to `lower(trim(both FROM dni_or_passport))`
  - `found = true` only when `role = 'student'`
  - Non-student or missing → one row `found = false`, names null
  - `REVOKE ALL … FROM PUBLIC`; `GRANT EXECUTE` to `anon, authenticated`
  - Function body must not mention `email`, `id`, `phone`, or `section_enrollments`

- [ ] **Step 1: Write the SQL-text test** asserting column, function name, grants, student-only found, and that the function SQL does not select email/id/phone/section_enrollments.

- [ ] **Step 2: Run test — expect FAIL.**

- [ ] **Step 3: Write the migration.** No drops.

- [ ] **Step 4: Re-run test — expect PASS.** Apply locally with the repo’s usual `supabase migration up` / tenant apply when implementing against a real DB; the text test is the task gate.

---

### Task 3: Lookup wrappers

**Files:**
- Create: `src/lib/register/lookupRegistrationStudent.ts`
- Create: `src/lib/register/resolveExistingStudentByDni.ts`
- Create: `src/app/[locale]/register/lookupRegistrationStudentAction.ts`
- Test: `src/__tests__/lib/register/lookupRegistrationStudent.test.ts`
- Test: `src/__tests__/lib/register/resolveExistingStudentByDni.test.ts`

**Interfaces:**
- `LookupRegistrationStudentResult = { ok: true; found: false } | { ok: true; found: true; firstName: string; lastName: string } | { ok: false }`
- `lookupRegistrationStudent(dni: string): Promise<LookupRegistrationStudentResult>` — empty after normalize → `{ ok: true, found: false }` without RPC; RPC error → `{ ok: false }`; maps the row.
- `ExistingStudentResolution = { kind: "none" } | { kind: "student"; studentId: string; email: string } | { kind: "occupied" }`
- `resolveExistingStudentByDni(admin, dni)` — admin/service client: profile by normalized document; student + `auth.admin.getUserById` email; other role → `occupied`; missing → `none`.
- `lookupRegistrationStudentAction(dni: string)` — `"use server"`, calls `lookupRegistrationStudent` via `createClient()` (anon). No PII in logs beyond a boolean `found`.

- [ ] **Step 1: Failing tests** for empty short-circuit, RPC map, RPC error → `ok: false`, occupied vs student vs none.

- [ ] **Step 2: Run — FAIL.**

- [ ] **Step 3: Implement.** `resolveExistingStudentByDni` uses `createAdminClient` only when called from accept/submit (pass the client in).

- [ ] **Step 4: Run — PASS.**

---

### Task 4: Schema + both submit actions

**Files:**
- Modify: `src/lib/register/publicRegistrationSchema.ts` — add `additional_section_ids: z.array(z.string().uuid()).max(40).optional()` (client may send selected extras; server still re-parses).
- Modify: `src/app/[locale]/register/actions.ts`
- Modify: `src/app/[locale]/i/[token]/actions.ts`
- Test: extend `src/__tests__/register/publicRegistrationSchema.test.ts`
- Test: extend `src/__tests__/app/submitSectionLinkRegistration.test.ts`
- Test: `src/__tests__/app/submitPublicRegistration.test.ts` (create if missing, else extend)

**Submit algorithm (both actions, after Zod):**
1. `parseRequestedSectionIds` with token `lockedPreferredId` on the link path (`allowUndecided: false`); `/register` `allowUndecided: true`. On `undecided_with_extras` return validation error.
2. Validate each concrete section id with existing `registration_public_section_label` (token preferred comes from `resolve_section_enrollment_link`, not the client).
3. `resolveExistingStudentByDni(createAdminClient(), dni)`:
   - `occupied` → `{ ok: false, message: dict.register.documentInUse }` (new key).
   - `student` → insert lead with that email, empty tutor fields, `additional_section_ids`.
   - `none` → current new-lead path + `additional_section_ids`.
4. Ignore any client `existingStudent` / `matched` flag.

- [ ] **Step 1: Tests** — forged existing flag still re-looks up; occupied fails closed; student insert uses resolved email and extras; undecided + extras rejected; token preferred not in the array.

- [ ] **Step 2: Run — FAIL.**

- [ ] **Step 3: Implement.** Insert column `additional_section_ids`. New dict keys in `en`/`es`/`pt` `register.documentInUse`.

- [ ] **Step 4: Run — PASS.**

---

### Task 5: RegisterForm wizard + copy

**Files:**
- Modify: `src/components/register/RegisterForm.tsx` (split if > 250 lines)
- Create: `src/components/register/RegisterStudentFieldset.tsx`
- Create: `src/components/register/RegisterExistingStudentConfirm.tsx`
- Create: `src/components/register/RegisterSectionMultiSelect.tsx`
- Modify: `src/dictionaries/en.json`, `es.json`, `pt.json` under `register`
- Test: extend `src/__tests__/register/registerForm.test.tsx` and `src/__tests__/components/register/RegisterFormEnrollmentLink.test.tsx`

**Copy (en, mirror es/pt):**
- `lead`: "These details are the student's. If they are under the legal age and are not already on file, we will ask for the parent or guardian next."
- `studentSectionTitle`: "Student details"
- `continue`: "Continue"
- `lookupFailed`: "We could not verify the document. Try again."
- `existingFoundTitle`: "We already have a student with this document"
- `existingFoundLead`: "Is this {firstName} {lastName}?"
- `existingYes`: "Yes, this is the student"
- `existingNo`: "No, this is not the student"
- `existingRejected`: "Check the document or contact the institute. We cannot create another record with the same document."
- `sectionsTitle`: "Sections"
- `sectionsHint`: "You can choose more than one."
- `sectionsAlsoJoin`: "They can also join…"
- `documentInUse`: "This document already belongs to another account. Contact the institute."

**UI state machine:** `step: "student" | "confirm" | "details"`. Continue → action → confirm or details. Confirm No stays on student with `existingRejected`. Confirm Yes → details without tutor. Details = tutor (new minor) or email/phone (new adult) or neither (existing), plus section multi-select. Token card stays; extras are checkboxes of `sectionOptions` minus locked id. `/register` keeps undecided exclusive.

- [ ] **Step 1: RTL** — step 1 has no tutor and no submit; match shows stored name; Yes hides tutor; No does not submit; miss + minor shows tutor.

- [ ] **Step 2: Run — FAIL.**

- [ ] **Step 3: Implement.** Surfaces only forward existing props.

- [ ] **Step 4: Run form tests + localeParity if keys were added — PASS.**

---

### Task 6: Admin inbox

**Files:**
- Modify: `src/types/adminRegistration.ts` — `additionalSectionIds: string[]`, `existingStudentId: string | null`
- Modify: `src/lib/dashboard/loadPaginatedRegistrations.ts` — select `additional_section_ids`; section filter `or(preferred_section_id.eq.X, additional_section_ids.cs.{X})`
- Create: `src/lib/register/resolveExistingStudentIdsForLeads.ts` — batch DNI → student ids (admin client)
- Modify: accept summary, expanded details, table/PWA card — badge + requested section labels
- Test: `src/__tests__/lib/dashboard/loadPaginatedRegistrationsSourceLink.test.ts` (extend) + new mapping test

- [ ] **Step 1: Tests** for mapping extras, filter includes array, `existingStudentId` derived.

- [ ] **Step 2–4:** FAIL / implement / PASS.

---

### Task 7: acceptRegistration

**Files:**
- Modify: `src/app/[locale]/dashboard/admin/registrations/acceptRegistrationAction.ts`
- Modify: `src/lib/register/acceptRegistrationHelpers.ts` if the result type lives there
- Modify: accept UI to show `pendingSectionIds`
- Test: `src/__tests__/app/registrationsActions.test.ts` (extend)

**Algorithm:**
1. `resolveExistingStudentByDni`.
2. `student` → skip `createDashboardUser`; `studentId` = existing; skip tutor ensure when tutor fields empty.
3. `occupied` → localized fail, no create.
4. `none` → current create + tutor-for-minor.
5. For preferred + each additional: `buildSectionEnrollmentPreview` + `commitSectionEnrollmentRpc` with `allowCapacityOverride: false`, `dropId: null`. `ALREADY_ACTIVE` skip. `CAPACITY_EXCEEDED` / `SCHEDULE_OVERLAP` / other → collect id.
6. Success `{ ok: true, studentId, pendingSectionIds: string[] }`. Mark lead `enrolled` if the student exists even when some sections pending.

- [ ] **Step 1: Tests** — existing DNI does not call `createDashboardUser`; one capacity failure does not roll back; `ALREADY_ACTIVE` is not a failure.

- [ ] **Step 2–4:** FAIL / implement / PASS.

---

### Task 8: E2E

**Files:**
- Create or extend: `e2e/critical-registration.spec.ts` (or a focused sibling if that file is already at the line limit)

**Flows:**
1. New minor `/register`: step 1 → tutor → two sections → inbox shows both, no existing-student badge.
2. Seeded student via `/i/[token]`: confirm name → extra section → inbox badge; accept does not create a second profile.

- [ ] **Step 1:** Write the spec using existing isolation helpers (`gotoIsolated`, admin storage).
- [ ] **Step 2:** Run only if the isolated stack is up: `npx playwright test e2e/<file> --project=chromium-critical-registration` (or the project name the file’s tag uses).
- [ ] **Step 3:** Fix until green.

---

## Spec coverage (self-review)

| Spec item | Task |
|-----------|------|
| `additional_section_ids` + no `matched_student_id` | 2, 4 |
| Lookup RPC name-only, student-only | 2, 3 |
| Re-lookup on submit/accept | 4, 7 |
| Two-step form + confirm + reject | 5 |
| Multi-section both surfaces | 5, 4 |
| Inbox badge + filter extras | 6 |
| Accept reuse ficha + section commit + leftovers | 7 |
| E2E both flows | 8 |
| Non-goals (captcha, edit extras, public enroll) | omitted |

No TBD. Names above are the ones later tasks must use.
