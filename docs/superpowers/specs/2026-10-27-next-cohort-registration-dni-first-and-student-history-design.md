# Public Registration Cohort, DNI-First Intake, and Student History Audit

**Date:** 2026-10-27
**Status:** Draft (awaiting user approval)
**Related rules:** `03-architecture.mdc`, `04-security.mdc`, `08-analytics-observability.mdc`, `09-i18n-copy.mdc`, `10-engineering-governance.mdc`, `12-supabase-app-boundaries.mdc`, `13-postgrest-pagination-bounded-queries.mdc`, `21-migrations-production-no-data-destruction.mdc`, `27-post-mutation-ui-refresh.mdc`, `30-harness-self-contained-tests.mdc`, `33-admin-tutorials-contract.mdc`, `40-neutral-spanish-copy.mdc`, `41-asd-ste100-english.mdc`, `42-persistent-page-tabs.mdc`.

## 1. Intent

This change enables three workflows for multi-year student intake and traceability:

1. **Configurable public registration cohort and admin cohort picker:** Staff can configure which non-archived cohort receives public `/register` submissions (for example, next year's cohort) while the current academic cohort (`is_current = true`) stays active for classes. In `/dashboard/admin/registrations`, the "Nueva inscripción" modal also lets staff pick which cohort to enroll into.
2. **DNI-first public registration with editable prefill:** Step 1 asks only for the student document (RUT, DNI, or passport). When the document matches an existing student, the form pre-fills the student and tutor or contact fields and keeps every field editable. Accepting the registration reuses the existing student profile, applies any confirmed contact or tutor updates, and enrolls the student in the new cohort sections without duplicating the student.
3. **Student history and audit tab (`Historial`):** The admin student profile (`AdminUserProfileFicha`) adds a `history` tab. This tab shows all cohorts and sections the student has joined and a chronological audit log of profile edits, tutor changes (previous tutor to new tutor), and section movements.

---

## 2. Architecture and Data Model

### 2.1 Public Registration Cohort Selection

- **Setting key:** `site_settings.key = 'registration_cohort_id'` stores either a JSON string UUID of a non-archived `academic_cohorts` row or `null`.
- **SQL resolver:** A new migration adds `public.resolve_public_registration_cohort_id() RETURNS uuid` (`STABLE SECURITY DEFINER`, `search_path = public`):
  1. Read `site_settings.value` for `key = 'registration_cohort_id'`.
  2. If the value is a valid UUID of an `academic_cohorts` row with `archived_at IS NULL`, return that cohort ID.
  3. Otherwise, return the ID of the `academic_cohorts` row where `is_current = true AND archived_at IS NULL`.
- **Updated SQL RPCs (additive):**
  - `list_registration_section_picker_options(p_cohort_id uuid DEFAULT NULL)`: Lists non-archived sections for `COALESCE(p_cohort_id, public.resolve_public_registration_cohort_id())`. Keeps the zero-argument call signature compatible for `/register`.
  - `list_registration_section_options()`: Uses `c.id = public.resolve_public_registration_cohort_id()`.
  - `registration_public_section_label(p_section_id uuid)`: Returns `c.name || ' — ' || s.name` when the section belongs to `public.resolve_public_registration_cohort_id()`, or when called by an authenticated admin for any non-archived cohort.
  - `registration_public_section_has_open_seat(p_section_id uuid)`: Checks open seats for sections in `public.resolve_public_registration_cohort_id()`, or any non-archived cohort when called by an authenticated admin.
- **Admin UI surfaces:**
  - **Settings (`/dashboard/admin/settings`):** `InscriptionsSettingsForm` displays the current cohort (`is_current = true`), the cohort currently active for public web registrations, and a selector to switch the public registration cohort.
  - **Registrations header (`/dashboard/admin/registrations`):** A compact cohort configuration bar shows the current cohort and the public registration cohort, and lets staff change the public registration cohort in place.
  - **Admin "Nueva inscripción" modal (`AdminRegistrationCreateButton`):** Adds a cohort selector at the top of the modal. It lists all non-archived cohorts, defaults to the public registration cohort, and filters the section options passed to `RegisterForm` for the selected cohort.

### 2.2 DNI-First Registration and Editable Prefill

- **Extended lookup RPC (`lookup_registration_student(p_dni text)`):**
  - Normalizes `p_dni` using the existing document normalization rules.
  - When a `profiles` row with `role = 'student'` matches, returns:
    - `found = true`
    - `first_name`, `last_name`, `birth_date` (ISO `YYYY-MM-DD`), `phone`
    - `email` (blank if the auth email is a synthetic minor address)
    - Primary linked tutor fields from `tutor_student_rel` + `profiles` + `auth.users`: `tutor_name`, `tutor_dni`, `tutor_email` (blank if synthetic), `tutor_phone`, `tutor_relationship`.
  - When no student matches (or the document belongs to a non-student role), returns `found = false` with `NULL` fields.
- **Step machine in `RegisterForm`:**
  - **Step 1 (`"dni"`):** Renders only the document input (`dni`) and the **Continue** button.
  - **Step 2 (`"details"`):**
    - Shows an informative banner when `existingMatch` is true, explaining that the student already exists and will be enrolled into the new cohort without creating a duplicate account.
    - Renders `RegisterStudentFieldset` with `readOnly={false}` so `dni`, `first_name`, `last_name`, and `birth_date` remain editable after pressing Continue.
    - Pre-fills `first_name`, `last_name`, `birth_date`, adult contact (`email`, `phone`), and minor tutor fields (`tutor_name`, `tutor_dni`, `tutor_email`, `tutor_phone`, `tutor_relationship`) from the lookup response when a student was found.
    - Shows `RegisterFormContactAndSections` (tutor fields for minors, contact fields for adults, section picker, privacy consent).
  - **Step 3 (`"extras"` for Nago pack):**
    - Adds a **Back** button to return to `"details"` without losing form values.
- **Submit and Accept behavior for existing students:**
  - `submitPublicRegistration` and `submitSectionLinkRegistration` store the submitted student and tutor fields on the `registrations` row for both new and existing students.
  - `acceptRegistrationLead` re-resolves the student by DNI. When `reuseStudent` is true:
    - Reuses `identity.studentId` instead of creating a second auth user.
    - Updates changed student profile fields (`first_name`, `last_name`, `birth_date`, `phone`) on `profiles`.
    - When `tutor_dni` is provided on the lead, ensures the tutor profile and upserts `tutor_student_rel`.
    - Emits `audit_events` for any profile or tutor link changes.
    - Enrolls the student in the requested sections for the target cohort.

### 2.3 Student History and Audit (`Historial` Tab)

- **Audit emission on student mutations:**
  - `updateAdminUserDetailFieldAction` and `adminUserDetailProfileHomeAddressActions`: Read the previous field value before updating, then call `auditIdentityAction` with `resourceType = 'student_profile'`, `resourceId = targetUserId`, `beforeValues`, and `afterValues`.
  - `upsertAdminStudentTutorLinkAction`, `removeAdminStudentTutorLinkAction`, `createAdminStudentTutorAction`, and `acceptRegistrationLead`: Snapshot the student's linked tutors before and after the mutation, then call `auditIdentityAction` with `resourceType = 'student_tutor'`, `resourceId = studentId`, `beforeValues: { tutors }`, and `afterValues: { tutors }`.
  - `addStudentToSectionAction`, `removeStudentFromSectionAction`, `enrollStudentInSectionAction`, `adminDirectSectionMoveAction`, and `approveSectionTransferRequestAction`: Call `auditAcademicAction` with `resourceType = 'student_enrollment'`, `resourceId = studentId`, and cohort/section names in `beforeValues`, `afterValues`, and `metadata`.
- **History loader (`loadAdminStudentHistory.ts`):**
  - Queries all `section_enrollments` for `studentId` joined with `academic_sections` and `academic_cohorts` (ordered by cohort start/created date) to build the cohort and section trajectory list.
  - Queries `audit_events` where `resource_id = studentId` (bounded to the latest 100 entries, ordered by `created_at DESC`) with actor names resolved from `profiles`.
- **UI (`AdminUserHistoryPanel.tsx`):**
  - Added as tab `"history"` in `AdminUserProfileFicha` (persisted via `usePersistentPageTab`).
  - **Section 1 — Trayectoria de cohortes y secciones:** Cards/rows showing each cohort, section name, teacher, enrollment status (`active`, `transferred`, `dropped`), and dates.
  - **Section 2 — Historial de cambios y auditoría:** Timeline showing date, actor, change type badge (Ficha, Tutor, Cohorte/Sección, Inscripción), summary, and `Antes → Después` values (including previous tutor vs. new tutor).

---

## 3. Risks and Mitigation

1. **PII exposure on public lookup:** `lookup_registration_student` is callable by `anon`. Mitigation: Return data only on exact normalized document match for `role = 'student'`, strip synthetic internal emails, and never expose internal UUIDs or passwords.
2. **File size ceiling (250 lines):** `RegisterForm.tsx` and `AdminUserProfileFicha.tsx` are near 245 lines. Mitigation: Extract `RegisterDniStep.tsx`, `AdminRegistrationCohortBar.tsx`, `AdminUserHistoryPanel.tsx`, and `loadAdminStudentHistory.ts` into dedicated modules under 250 lines.
3. **Existing E2E and unit tests on `RegisterForm`:** Existing tests fill `first_name`, `last_name`, `birth_date`, and `dni` in Step 1. Mitigation: Update the affected registration tests and E2E helpers to match the DNI-first step flow while keeping self-contained test isolation (`30-harness-self-contained-tests.mdc`).

---

## 4. Definition of Done

- [ ] Migration adds `resolve_public_registration_cohort_id()`, updates public registration section RPCs to support the configured cohort and optional `p_cohort_id`, and updates `lookup_registration_student(text)` to return student + tutor prefill fields.
- [ ] `masterdb.sql` and ADR under `docs/adr/` are updated.
- [ ] Admin can configure the public registration cohort from `/dashboard/admin/settings` and `/dashboard/admin/registrations`, seeing both the current cohort (`is_current`) and the public registration cohort.
- [ ] Admin "Nueva inscripción" modal includes a cohort selector and loads sections for the chosen cohort.
- [ ] Public `/register` and `/i/[token]` ask for RUT/DNI/Passport first, prefill student and tutor/contact fields when the student exists, keep all fields editable after pressing Continue, and reuse the existing student on accept.
- [ ] Student detail page (`AdminUserProfileFicha`) includes the `Historial` tab showing cohort/section history and audit events (profile changes, tutor changes with before/after, and section enrollments).
- [ ] Dictionary keys added in `en.json`, `es.json` (neutral tuteo), and `pt.json`.
- [ ] Product changelog entry added in `src/lib/product-changelog/catalog.ts`.
- [ ] Self-contained unit/component tests pass in Vitest.
