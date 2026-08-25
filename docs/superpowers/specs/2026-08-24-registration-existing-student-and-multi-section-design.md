# Registration: existing-student match and multi-section request

**Date:** 2026-08-24
**Status:** Approved (brainstorm)
**Kind:** Design spec. One implementation plan under `docs/superpowers/plans/`.

**Related:**

- [`2026-08-08-section-enrollment-link-design.md`](2026-08-08-section-enrollment-link-design.md) — shareable `/i/[token]` form this feature extends. A submission is still a **lead**. This spec **does** let `acceptRegistration` write `section_enrollments` for the sections the family asked for (preview + commit, no capacity override). The section enroll modal stays the path for leftovers (cupo, solape).
- [`2026-07-23-section-students-enroll-modal-design.md`](2026-07-23-section-students-enroll-modal-design.md) — `preview` / `commit` (`academic_admin_section_enroll_commit`) reused on accept.
- [`2026-07-24-tenant-parent-synthetic-email-design.md`](2026-07-24-tenant-parent-synthetic-email-design.md) — synthetic email for **new** minors only. An existing student keeps the email already on their account.

**Governing rules:** `28-tenant-register-surface.mdc` (do not fork `RegisterForm`), `09-i18n-copy.mdc`, `04-security.mdc`, `12-supabase-app-boundaries.mdc`, `21-migrations-production-no-data-destruction.mdc`, `03-architecture.mdc` (250-line ceiling).

## Intent

A parent filling `/register` or a section link should type **the student's** document first. If that RUT / DNI / passport already belongs to a student, the form shows the stored name, asks for confirmation, skips tutor data, and lets the parent mark **more than one section**. The result is one lead. The admin accepts: no second ficha, and the requested sections are enrolled when cupo and schedule allow.

If the document is new, the form then asks for parent data (minors) or email/phone (adults), then the same multi-section picker.

## Context

Today both public surfaces share `RegisterForm`. The lead copy is first-person («Contanos sobre vos»). Name fields have no «alumno» heading. Tutor fields appear in the same view once birth date says minor. A section link locks one section. There is no document lookup. `profiles` has `UNIQUE (lower(trim(dni_or_passport)))`. `acceptRegistration` always calls `createDashboardUser`, so a second lead for the same document fails. Extra groups mean a second form and, if accepted, a collision.

`submitPublicRegistration` / `submitSectionLinkRegistration` insert as `anon` into `registrations`. Section membership is `section_enrollments` via `enrollStudentInSectionAction`. Accept today also inserts a **course** `enrollments` row when a course can be resolved; that path stays for new students and does not replace academic-section enroll.

## Decisions

| Topic | Choice |
|-------|--------|
| Existing student | Confirm stored name; skip tutor; pick sections; one lead; no new profile |
| Who enrols | Admin, on accept. The public form never writes `section_enrollments` |
| Extra sections | Both `/register` and `/i/[token]` |
| Form shape | Two steps. Step 1 = student only. Parent / adult contact only if no student match |
| Match key | Document only (normalized). Show `first_name` + `last_name` from `profiles` |
| «Not this student» | Do not insert. Ask to check the document or contact the institute |
| Stored match id | **None.** Do not persist a client-supplied `matched_student_id`. Re-lookup by DNI on submit, list, and accept |
| Extra sections storage | `registrations.additional_section_ids UUID[] NOT NULL DEFAULT '{}'` |
| Primary section | `preferred_section_id` unchanged (token section, or first pick on `/register`) |
| «No estoy seguro» | `/register` only; exclusive; empty `additional_section_ids` |
| Non-student document | Lookup returns not found (no name). Submit and accept fail closed |
| Lookup PII | Name + surname only. No id, email, or current sections |
| Rate limit / captcha | Out of scope (same as the section-link spec) |
| Edit extras on the lead | Out of scope. Inbox shows them; the edit form does not change them |

## Architecture

### Database — migration `188_registration_additional_sections.sql`

One additive column. No drops, no rewrites of existing rows.

| Column | Type | Meaning |
|--------|------|---------|
| `additional_section_ids` | `UUID[] NOT NULL DEFAULT '{}'` | Sections besides `preferred_section_id` |

No FK on array elements. The submit actions validate each id the same way `/register` already validates a single section: `registration_public_section_label` (current-cohort public list). Invalid ids are dropped, not stored. The token section is never also stored in the array.

`anon` insert already allowed on `registrations`. The new column is writable on insert; spoofed ids are filtered server-side before insert. A spoofed «I am student X» is impossible because that id is not a column.

### Database — RPC `lookup_registration_student(p_dni text)`

`STABLE SECURITY DEFINER`, `search_path = public`, granted to `anon` and `authenticated`. Revoke from `PUBLIC`.

Normalize `p_dni` the same way as `normalizeDni` in `src/lib/import/studentImportUtils.ts` (strip `.` and whitespace, trim), then compare with `lower(trim(dni_or_passport))`.

Returns one row:

| Column | When found (role = `student`) | Otherwise |
|--------|-------------------------------|-----------|
| `found` | `true` | `false` |
| `first_name` | profile first name | `null` |
| `last_name` | profile last name | `null` |

No other columns. If the document belongs to a non-student, or to nobody, return `found = false` with the same shape. Do not distinguish those cases to the browser.

The function is the only public read of student identity for this feature. It must not select `email`, `id`, phones, or `section_enrollments`.

### Shared helpers (app)

| Piece | Role |
|-------|------|
| `normalizeRegistrationDocument(raw)` | Same rules as `normalizeDni().dni`, used by lookup client, submit, accept, and inbox match |
| `lookupRegistrationStudent(dni)` | Server wrapper around the RPC (token shape / empty short-circuit) |
| `resolveExistingStudentByDni(admin, dni)` | Service-role / admin read: student id + email if `role = student`; «occupied» if another role; none if missing |
| `parseRequestedSectionIds(...)` | Dedupes, drops the preferred id from extras, validates public labels, rejects undecided + extras |

### `RegisterForm` — one form, two steps

Do not fork per tenant. `RegisterSurfaceByTemplate` and the six surfaces keep forwarding props. Wizard state lives in `RegisterForm` (and small extracted pieces if the file hits 250 lines).

**Step 1 — student.** Fieldset title: student data. Fields: first name, last name, birth date, document. Lead copy states that these fields are the **student's**, and that parent/tutor data comes **next** if the student is a minor and is not already on file. Button: Continue (not submit).

Continue calls a server action that runs `lookup_registration_student`.

- RPC/network error: stay on step 1. Generic «could not verify, try again». Do **not** treat as new.
- `found`: confirmation card with stored name. **Yes** → skip tutor; go to sections. **No** → no insert; stay on step 1; check document or contact the institute.
- `found = false` and minor: step 2 = existing tutor fieldset + sections.
- `found = false` and adult: step 2 = email + phone + sections.

**Sections (last step, both routes).** Multi-select from the same current-cohort list `/register` already uses.

- `/register`: «undecided» remains and is exclusive. Among checked ids, the first that appears in `sectionOptions` (server list order, not click order) is `preferred_section_id`; the rest go in `additional_section_ids`.
- `/i/[token]`: `SectionEnrollmentLinkCard` stays locked. Copy under it: the student can also join… Checkboxes = public list minus the token section. `preferred_section_id` is always the token section (server-derived). No undecided.

The form does **not** show groups the student is already in. That list is not in the anonymous lookup.

Success dialog and «another request» stay.

### Submit

`submitPublicRegistration` and `submitSectionLinkRegistration` both:

1. Re-run document lookup on the server. Ignore any client flag that says «existing» or «new».
2. If the document is a **student**: resolve their login email from `auth.users` via the service-role/admin client (profiles have no email column). Insert one `registrations` row with that email (`registrations.email` is `NOT NULL`), empty tutor fields, requested sections. Do not invent a new synthetic email.
3. If the document is a **non-student** profile: `{ ok: false }` with the contact-the-institute message. No row.
4. If nobody: current new-lead path (synthetic email + tutor rules for minors).
5. Validate extras as above. Token path still ignores a client-posted preferred id.

### Admin inbox

Loader resolves «existing student» live from the lead DNI (same normalize + student role). `AdminRegistrationRow` gains:

- `additionalSectionIds: string[]`
- `existingStudentId: string | null` (derived, not a column)

UI:

- Badge «existing student» next to the section-link badge when `existingStudentId` is set.
- Requested sections = preferred label + additional labels, in expanded row, accept summary, and list chrome as space allows.
- Section filter matches `preferred_section_id` **or** any id in `additional_section_ids`.
- Accept summary links to the student ficha when matched.
- Lead edit form: **no** extra-section editor this cut.

### `acceptRegistration`

1. Re-resolve the document.
2. **Student match:** do not call `createDashboardUser`. `studentId` = existing profile. Do not re-create a tutor from empty tutor fields. Course `enrollments` insert stays `insertEnrollmentIfMissing` when a course resolves; skip if already there.
3. **Non-student document:** fail with a localized «document already used by another account» — do not create a student.
4. **No profile:** current create + tutor-for-minor path.
5. **Sections (new and existing):** for `preferred_section_id` plus each additional id, call the same preview + `commitSectionEnrollmentRpc` as `enrollStudentInSectionAction`, **without** capacity override and without a drop. `ALREADY_ACTIVE` = skip, success. `CAPACITY_EXCEEDED` / `SCHEDULE_OVERLAP` / other = collect that section; do **not** roll back the student or sibling enrolls.
6. Mark the lead `enrolled` if the student exists (created or matched) even when some sections are pending.
7. Widen `AcceptRegistrationResult` success to include `pendingSectionIds: string[]` (empty if all commits succeeded or were already active) so the accept UI can name leftovers and point at the section enroll modal.

Course `enrollments` (CEFR / online course row) is unchanged and is not a substitute for `section_enrollments`.

## Data flow

```
Family — step 1 (student name, birth, document)
  → lookup_registration_student(normalized dni)

found + «yes»
  → sections only → submit → re-lookup → lead (existing email, extras)

found + «no»
  → no insert

not found + minor
  → tutor + sections → submit → new lead (synthetic email)

not found + adult
  → email, phone + sections → submit → new lead

Admin — inbox
  → badge + requested sections (live DNI match)
  → accept → create or reuse ficha → commit each section
  → leftovers: capacity / overlap → section enroll modal
```

## Error handling

| Case | Family or admin sees |
|------|----------------------|
| Lookup transport/RPC error | Stay on step 1; try again. Not treated as new |
| Non-student DNI | No name on lookup. Submit/accept: contact institute / document in use |
| Confirmed «not this person» | No row |
| Student appears after Continue | Submit treats as existing |
| Invented or duplicate extra ids | Dropped on the server |
| Undecided + extras | Validation error |
| Closed inscriptions / dead token | Existing messages |
| Accept: one section over cap or overlapping | Student kept; message lists pending sections |

## Testing

**Against a real database**

- `anon` can `EXECUTE` `lookup_registration_student` and cannot `SELECT` `profiles` or `section_enrollments`.
- Found student returns only the three columns. Non-student DNI returns `found = false`.
- Grants: `REVOKE ALL … FROM PUBLIC` then `GRANT EXECUTE` to `anon, authenticated`.

**Vitest**

- Document normalize matches `normalizeDni` (dots, spaces, case).
- Schema: extras + exclusive undecided; token preferred not in the array.
- Form: step 1 has no tutor and no submit; match → confirm → no tutor; miss + minor → tutor; «no» does not call insert.
- Submit ignores a forged existing-student flag; re-looks up.
- Accept: existing DNI skips `createDashboardUser`; calls section commit per requested id; `ALREADY_ACTIVE` does not fail; one `CAPACITY_EXCEEDED` leaves the other enrolls and the lead `enrolled`.

**End-to-end**

1. New minor on `/register`: step 1 → tutor → two sections → inbox shows both, no existing-student badge → accept creates one ficha and two `section_enrollments` (when capacity allows).
2. Existing student on `/i/[token]`: confirm name → extra section → inbox badge + both sections → accept does not create a second ficha; new section enrollment appears; token section skipped if already active.

## Non-goals

- Writing `section_enrollments` from the public form.
- Captcha or rate limiting on the lookup.
- Showing current groups on the public form.
- Editing `additional_section_ids` on the admin lead edit form.
- Persisting `matched_student_id` on the lead.
- Changing `inscriptions_enabled` or token generate/rotate/revoke.
- Auto capacity override on accept.
- Forking a tenant-specific registration form.

## Consequences

- Accept now enrols academic sections. The 2026-08-08 line that only the section modal writes `section_enrollments` no longer holds for this accept path. The modal remains for conflicts and for staff-initiated enrols.
- Anonymous DNI → name is an enumeration risk. Scope is name-only, student-only, after step 1. Follow-up: rate limit if abused.
- `RegisterForm` will need a split (step machine, confirm card, multi-select) to stay under 250 lines.

## Done when

- Step 1 is only student fields, with copy that says so, on `/register` and `/i/[token]`.
- Existing student: confirm name, no tutor, multi-section, one lead, accept reuses the ficha.
- New minor: tutor after step 1. New adult: email/phone after step 1.
- Inbox shows existing-student badge and all requested sections; section filter includes extras.
- Accept enrols requested sections without capacity override; leftovers are reported, not rolled back.
- Dictionaries `en` / `es` / `pt` aligned. Tests above green.
