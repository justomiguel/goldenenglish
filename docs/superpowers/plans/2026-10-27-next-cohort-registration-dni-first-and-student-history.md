# Public Registration Cohort, DNI-First Intake, and Student History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable configurable next-year public registration cohorts (in Settings, Registrations header, and New Registration modal), make `/register` ask for RUT/DNI/Passport first with editable student/tutor prefill and existing-student reuse, and add a `Historial` audit tab to the admin student profile.

**Architecture:** A new migration (`227_registration_cohort_and_student_lookup.sql`) adds `resolve_public_registration_cohort_id()`, updates the registration section RPCs to accept an optional `p_cohort_id` and default to the configured registration cohort, and expands `lookup_registration_student(text)` with student and tutor prefill fields. `RegisterForm` moves to a DNI-first step that pre-fills editable student and tutor fields. Student mutations emit structured `audit_events` (`before_values` / `after_values`) consumed by `loadAdminStudentHistory` and rendered in the new `AdminUserHistoryPanel` tab on `AdminUserProfileFicha`.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS (design tokens), Supabase Postgres + RPC, Vitest + Testing Library.

## Global Constraints

- No file may exceed 250 lines (`03-architecture.mdc`).
- All user-visible copy must live in `src/dictionaries/en.json`, `src/dictionaries/es.json` (neutral tuteo per `40-neutral-spanish-copy.mdc`), and `src/dictionaries/pt.json` (`09-i18n-copy.mdc`).
- English prose in docs, comments, and `en.json` follows `41-asd-ste100-english.mdc`.
- All new and touched tests must be self-contained (`30-harness-self-contained-tests.mdc`).
- Every visible mutation must call `revalidatePath` on the server and `router.refresh()` on the client (`27-post-mutation-ui-refresh.mdc`).
- Buttons must include a leading Lucide icon (`16-admin-buttons-icons.mdc`).
- Page-level tabs use `usePersistentPageTab` (`42-persistent-page-tabs.mdc`).

---

### Task 1: Database Migration (`227_registration_cohort_and_student_lookup.sql`) and `masterdb.sql`

**Files:**
- Create: `supabase/migrations/227_registration_cohort_and_student_lookup.sql`
- Modify: `supabase/migrations/masterdb.sql`
- Test: `src/__tests__/db/registration_cohort_and_student_lookup_migration.test.ts`

- [ ] **Step 1: Write the failing migration contract test**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Write migration `227_registration_cohort_and_student_lookup.sql` and append to `masterdb.sql`**
- [ ] **Step 4: Run test to verify it passes**

---

### Task 2: Public Registration Cohort Settings & Section Picker Loader

**Files:**
- Modify: `src/lib/settings/inscriptionsServer.ts`
- Modify: `src/app/[locale]/dashboard/admin/settings/actions.ts`
- Modify: `src/lib/register/loadRegistrationSectionPickerOptions.ts`
- Create: `src/components/dashboard/AdminRegistrationCohortBar.tsx`
- Modify: `src/components/dashboard/InscriptionsSettingsForm.tsx`
- Modify: `src/components/dashboard/AdminRegistrationCreateButton.tsx`
- Modify: `src/app/[locale]/dashboard/admin/settings/page.tsx`
- Modify: `src/app/[locale]/dashboard/admin/registrations/page.tsx`
- Test: `src/__tests__/settings/inscriptionsServer.test.ts`
- Test: `src/__tests__/components/AdminRegistrationCreateButton.test.tsx`

- [ ] **Step 1: Write failing tests for cohort configuration helpers and UI**
- [ ] **Step 2: Implement server loaders (`loadRegistrationCohortConfig`, `setRegistrationCohortAction`, per-cohort section options)**
- [ ] **Step 3: Update `InscriptionsSettingsForm`, `AdminRegistrationCohortBar`, and `AdminRegistrationCreateButton`**
- [ ] **Step 4: Run Vitest on the touched test files**

---

### Task 3: DNI-First Registration Form, Editable Prefill, and Existing-Student Reuse

**Files:**
- Modify: `src/lib/register/lookupRegistrationStudent.ts`
- Create: `src/components/register/RegisterDniStep.tsx`
- Modify: `src/components/register/RegisterStudentFieldset.tsx`
- Modify: `src/components/register/RegisterTutorFieldset.tsx`
- Modify: `src/components/register/RegisterFormContactAndSections.tsx`
- Modify: `src/components/register/RegisterForm.tsx`
- Modify: `src/app/[locale]/register/actions.ts`
- Modify: `src/app/[locale]/i/actions.ts`
- Modify: `src/lib/register/acceptRegistrationLead.ts`
- Test: `src/__tests__/lib/register/lookupRegistrationStudent.test.ts`
- Test: `src/__tests__/organisms/RegisterNagoSurface.test.tsx`
- Test: `src/__tests__/organisms/RegisterLioraSurface.test.tsx`
- Test: `src/__tests__/app/registrationsActions.test.ts`

- [ ] **Step 1: Write failing tests for extended `lookupRegistrationStudent`, DNI-first `RegisterForm` editable fields, and existing-student update on accept**
- [ ] **Step 2: Implement `lookupRegistrationStudent` prefill fields and `RegisterDniStep`**
- [ ] **Step 3: Update `RegisterForm`, `RegisterStudentFieldset`, `RegisterTutorFieldset`, `submitPublicRegistration`, `submitSectionLinkRegistration`, and `acceptRegistrationLead`**
- [ ] **Step 4: Run Vitest on all registration tests**

---

### Task 4: Student Audit Events, History Loader, and `Historial` Tab in `AdminUserProfileFicha`

**Files:**
- Modify: `src/app/[locale]/dashboard/admin/users/adminUserDetailProfileActions.ts`
- Modify: `src/app/[locale]/dashboard/admin/users/adminUserDetailTutorActions.ts`
- Modify: `src/app/[locale]/dashboard/admin/users/studentCurrentCohortSectionAssignmentActions.ts`
- Modify: `src/app/[locale]/dashboard/admin/academic/enrollmentActions.ts`
- Create: `src/lib/dashboard/loadAdminStudentHistory.ts`
- Create: `src/components/molecules/AdminUserHistoryPanel.tsx`
- Modify: `src/lib/dashboard/adminUserDetailVM.ts`
- Modify: `src/lib/dashboard/loadAdminUserDetail.ts`
- Modify: `src/components/molecules/AdminUserProfileTabButton.tsx`
- Modify: `src/components/molecules/buildAdminUserProfileTabs.tsx`
- Modify: `src/components/molecules/AdminUserProfileFicha.tsx`
- Test: `src/__tests__/lib/dashboard/loadAdminStudentHistory.test.ts`
- Test: `src/__tests__/components/AdminUserProfileFicha.test.tsx`

- [ ] **Step 1: Write failing tests for `loadAdminStudentHistory` and the `history` tab in `AdminUserProfileFicha`**
- [ ] **Step 2: Add `auditIdentityAction` / `auditAcademicAction` calls with `beforeValues` and `afterValues` on student profile, tutor, and section mutations**
- [ ] **Step 3: Implement `loadAdminStudentHistory` and `AdminUserHistoryPanel`, and wire into `AdminUserProfileFicha`**
- [ ] **Step 4: Run Vitest on the touched test files**

---

### Task 5: Dictionaries (`es`, `en`, `pt`), Product Changelog, and Full Test Verification

**Files:**
- Modify: `src/dictionaries/es.json`
- Modify: `src/dictionaries/en.json`
- Modify: `src/dictionaries/pt.json`
- Modify: `src/lib/product-changelog/catalogEntriesNow.ts`

- [ ] **Step 1: Add all new dictionary keys in `es.json`, `en.json`, and `pt.json`**
- [ ] **Step 2: Add product changelog entry in `src/lib/product-changelog/catalogEntriesNow.ts`**
- [ ] **Step 3: Run targeted and suite Vitest checks and typecheck**
