# Academic profile custom fields Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an admin define institute academic fields, store one value per student, and filter Alumnos by the fields marked as columns.

**Architecture:** Two tables. Pure rules decide types, column flags, and directory matches. Server actions enforce admin vs section staff. The student card and the teacher roster edit values. The existing Alumnos directory applies the new filter on the server before the page slice.

**Tech Stack:** Next.js App Router, Supabase RLS, Vitest, dictionaries `en` / `es` / `pt`.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-10-27-academic-profile-custom-fields-design.md`
- Files stay at or under 250 lines.
- Visible copy only in `src/dictionaries/en.json`, `es.json`, and `pt.json`. Spanish is neutral tuteo.
- No `window.alert`, `window.confirm`, or `window.prompt`. Archive uses `ConfirmActionModal`.
- Buttons use a leading Lucide icon.
- No hex colors. Use design tokens.
- Student, parent, and tutor cannot read these rows.
- File and image cannot be a directory column or filter.
- Do not commit after each task. This repo commits the spec, the plan, and the implementation together when the feature is done. Other WIP may be in the tree. Ask before that commit.
- Do not push.
- Manual browser QA stays with the user.

---

### Task 1: Pure field rules

**Files:**
- Create: `src/lib/academic-profile/academicProfileFieldRules.ts`
- Test: `src/__tests__/lib/academic-profile/academicProfileFieldRules.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `ACADEMIC_PROFILE_FIELD_TYPES`
  - `AcademicProfileFieldType`
  - `AcademicProfileFieldDraft` `{ label, fieldType, selectOptions, required, showInDirectory }`
  - `normalizeAcademicProfileFieldDraft(draft) -> { ok: true, field } | { ok: false, error: "label" | "type" | "options" | "column" }`
  - `academicProfileValueSlot(fieldType) -> "text" | "number" | "date" | "file"`
  - `isActiveAcademicProfileField(field: { archivedAt: string | null }) -> boolean`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import {
  academicProfileValueSlot,
  isActiveAcademicProfileField,
  normalizeAcademicProfileFieldDraft,
} from "@/lib/academic-profile/academicProfileFieldRules";

describe("normalizeAcademicProfileFieldDraft", () => {
  it("forces the column off for a file", () => {
    const result = normalizeAcademicProfileFieldDraft({
      label: " Certificado ",
      fieldType: "file",
      selectOptions: [],
      required: false,
      showInDirectory: true,
    });
    expect(result).toEqual({
      ok: true,
      field: {
        label: "Certificado",
        fieldType: "file",
        selectOptions: [],
        required: false,
        showInDirectory: false,
      },
    });
  });

  it("rejects a select with no options", () => {
    const result = normalizeAcademicProfileFieldDraft({
      label: "Nivel",
      fieldType: "select",
      selectOptions: ["  "],
      required: false,
      showInDirectory: true,
    });
    expect(result).toEqual({ ok: false, error: "options" });
  });

  it("rejects an empty label", () => {
    const result = normalizeAcademicProfileFieldDraft({
      label: " ",
      fieldType: "text",
      selectOptions: [],
      required: false,
      showInDirectory: false,
    });
    expect(result).toEqual({ ok: false, error: "label" });
  });
});

describe("academicProfileValueSlot", () => {
  it("maps text types to text and image to file", () => {
    expect(academicProfileValueSlot("email")).toBe("text");
    expect(academicProfileValueSlot("number")).toBe("number");
    expect(academicProfileValueSlot("date")).toBe("date");
    expect(academicProfileValueSlot("image")).toBe("file");
  });
});

describe("isActiveAcademicProfileField", () => {
  it("hides an archived field", () => {
    expect(isActiveAcademicProfileField({ archivedAt: null })).toBe(true);
    expect(isActiveAcademicProfileField({ archivedAt: "2026-10-27T00:00:00Z" })).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test**

Run: `npx vitest run src/__tests__/lib/academic-profile/academicProfileFieldRules.test.ts`
Expected: FAIL. The module is missing.

- [ ] **Step 3: Implement the module**

```ts
export const ACADEMIC_PROFILE_FIELD_TYPES = [
  "text",
  "textarea",
  "number",
  "date",
  "email",
  "phone",
  "select",
  "file",
  "image",
] as const;

export type AcademicProfileFieldType = (typeof ACADEMIC_PROFILE_FIELD_TYPES)[number];

export type AcademicProfileFieldDraft = {
  label: string;
  fieldType: string;
  selectOptions: string[];
  required: boolean;
  showInDirectory: boolean;
};

const TEXT_TYPES = new Set<AcademicProfileFieldType>([
  "text",
  "textarea",
  "email",
  "phone",
  "select",
]);

export function academicProfileValueSlot(
  fieldType: AcademicProfileFieldType,
): "text" | "number" | "date" | "file" {
  if (fieldType === "number") return "number";
  if (fieldType === "date") return "date";
  if (fieldType === "file" || fieldType === "image") return "file";
  return "text";
}

export function isActiveAcademicProfileField(field: { archivedAt: string | null }): boolean {
  return field.archivedAt == null;
}

function isFieldType(value: string): value is AcademicProfileFieldType {
  return (ACADEMIC_PROFILE_FIELD_TYPES as readonly string[]).includes(value);
}

export function normalizeAcademicProfileFieldDraft(
  draft: AcademicProfileFieldDraft,
): { ok: true; field: AcademicProfileFieldDraft & { fieldType: AcademicProfileFieldType } } | { ok: false; error: "label" | "type" | "options" | "column" } {
  const label = draft.label.trim();
  if (label.length < 1 || label.length > 80) return { ok: false, error: "label" };
  if (!isFieldType(draft.fieldType)) return { ok: false, error: "type" };
  const selectOptions = draft.selectOptions.map((option) => option.trim()).filter((option) => option.length > 0);
  if (draft.fieldType === "select" && selectOptions.length === 0) return { ok: false, error: "options" };
  const fileLike = draft.fieldType === "file" || draft.fieldType === "image";
  return {
    ok: true,
    field: {
      label,
      fieldType: draft.fieldType,
      selectOptions: draft.fieldType === "select" ? selectOptions : [],
      required: draft.required,
      showInDirectory: fileLike ? false : draft.showInDirectory,
    },
  };
}

void TEXT_TYPES;
```

Remove the unused `TEXT_TYPES` set before the file is done. Keep `academicProfileValueSlot` as the only type-to-slot map.

- [ ] **Step 4: Run the test**

Run: `npx vitest run src/__tests__/lib/academic-profile/academicProfileFieldRules.test.ts`
Expected: PASS

---

### Task 2: Directory match rules

**Files:**
- Create: `src/lib/academic-profile/matchAcademicProfileDirectoryFilter.ts`
- Test: `src/__tests__/lib/academic-profile/matchAcademicProfileDirectoryFilter.test.ts`

**Interfaces:**
- Consumes: `AcademicProfileFieldType` from Task 1
- Produces:
  - `AcademicDirectoryField` `{ id, fieldType, showInDirectory, archivedAt, selectOptions }`
  - `AcademicDirectoryValue` `{ fieldId, studentId, valueText, valueNumber, valueDate }`
  - `parseAcademicDirectoryParams(raw) -> Record<string, string>` keys `acf_<uuid>`
  - `directoryFieldsForColumns(fields) -> AcademicDirectoryField[]`
  - `studentMatchesAcademicDirectoryFilters(studentId, fields, values, params) -> boolean`
  - `countSelectOptionFacet(fieldId, option, studentIds, values, paramsWithoutThisField) -> number`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import {
  directoryFieldsForColumns,
  parseAcademicDirectoryParams,
  studentMatchesAcademicDirectoryFilters,
} from "@/lib/academic-profile/matchAcademicProfileDirectoryFilter";

const level = {
  id: "11111111-1111-4111-8111-111111111111",
  fieldType: "select" as const,
  showInDirectory: true,
  archivedAt: null,
  selectOptions: ["B1", "B2"],
};
const note = {
  id: "22222222-2222-4222-8222-222222222222",
  fieldType: "text" as const,
  showInDirectory: true,
  archivedAt: null,
  selectOptions: [],
};
const file = {
  id: "33333333-3333-4333-8333-333333333333",
  fieldType: "file" as const,
  showInDirectory: true,
  archivedAt: null,
  selectOptions: [],
};

describe("parseAcademicDirectoryParams", () => {
  it("keeps only acf_ uuid params", () => {
    expect(parseAcademicDirectoryParams({
      acf_11111111-1111-4111-8111-111111111111: "B1",
      q: "ana",
      acf_not-a-uuid: "x",
    })).toEqual({ "11111111-1111-4111-8111-111111111111": "B1" });
  });
});

describe("directoryFieldsForColumns", () => {
  it("drops files and archived fields", () => {
    expect(directoryFieldsForColumns([level, { ...note, archivedAt: "2026-10-27" }, file]).map((f) => f.id)).toEqual([level.id]);
  });
});

describe("studentMatchesAcademicDirectoryFilters", () => {
  it("AND-matches exact select and contains text", () => {
    const values = [
      { fieldId: level.id, studentId: "s1", valueText: "B1", valueNumber: null, valueDate: null },
      { fieldId: note.id, studentId: "s1", valueText: "Habla bien", valueNumber: null, valueDate: null },
    ];
    const params = { [level.id]: "B1", [note.id]: "habla" };
    expect(studentMatchesAcademicDirectoryFilters("s1", [level, note], values, params)).toBe(true);
    expect(studentMatchesAcademicDirectoryFilters("s1", [level, note], values, { [level.id]: "B2" })).toBe(false);
  });
});
```

The object key in the first expectation must be quoted: `"acf_11111111-1111-4111-8111-111111111111": "B1"`.

- [ ] **Step 2: Run the test**

Run: `npx vitest run src/__tests__/lib/academic-profile/matchAcademicProfileDirectoryFilter.test.ts`
Expected: FAIL. The module is missing.

- [ ] **Step 3: Implement the matcher**

`parseAcademicDirectoryParams` reads string values whose key matches `^acf_[0-9a-f-]{36}$` and stores the uuid without the prefix.

`directoryFieldsForColumns` keeps fields where `archivedAt` is null, `showInDirectory` is true, and the type is not `file` or `image`.

`studentMatchesAcademicDirectoryFilters` returns true when every param matches:

- missing or unknown field id: ignore that param
- text, textarea, email, phone: `valueText` contains the query, case insensitive
- select, number, date: exact string match against `valueText`, `String(valueNumber)`, or `valueDate`
- empty student value: no match

`countSelectOptionFacet` counts student ids whose value text equals the option, using `studentMatchesAcademicDirectoryFilters` with that field removed from `params`.

- [ ] **Step 4: Run the test**

Run: `npx vitest run src/__tests__/lib/academic-profile/matchAcademicProfileDirectoryFilter.test.ts`
Expected: PASS

---

### Task 3: Migration, RLS, and ADR

**Files:**
- Create: `supabase/migrations/228_academic_profile_fields.sql`
- Create: `docs/adr/2026-10-27-academic-profile-fields.md`
- Modify: `supabase/migrations/masterdb.sql` (append the same SQL under a `228_` marker)

**Interfaces:**
- Consumes: Task 1 type list
- Produces: tables `academic_profile_fields` and `academic_profile_field_values`, function `academic_profile_value_visible(uuid)`, private bucket `academic-profile-files`

- [ ] **Step 1: Write the ADR**

Context: institutes need extra academic facts per student, plus Alumnos columns and filters. Event form tables belong to registration.

Decision: two additive tables. Archive instead of delete. File and image stay off the directory.

Options considered: JSON on `profiles` (weak filters). Reuse `event_form_fields` (wrong owner).

Consequences: migration 228, RLS, staff audit, Vitest on the pure rules.

- [ ] **Step 2: Write the migration**

```sql
create table if not exists public.academic_profile_fields (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  field_type text not null,
  select_options text[] not null default '{}',
  required boolean not null default false,
  show_in_directory boolean not null default false,
  sort_order integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint academic_profile_fields_type_check check (
    field_type in ('text','textarea','number','date','email','phone','select','file','image')
  ),
  constraint academic_profile_fields_label_check check (char_length(btrim(label)) between 1 and 80),
  constraint academic_profile_fields_column_check check (
    show_in_directory = false or field_type not in ('file','image')
  ),
  constraint academic_profile_fields_options_check check (
    (field_type = 'select' and cardinality(select_options) >= 1)
    or (field_type <> 'select' and cardinality(select_options) = 0)
  )
);

create table if not exists public.academic_profile_field_values (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.academic_profile_fields (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  value_text text,
  value_number numeric,
  value_date date,
  storage_path text,
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default now(),
  unique (field_id, student_id)
);

create index if not exists academic_profile_field_values_text_idx
  on public.academic_profile_field_values (field_id, value_text);
create index if not exists academic_profile_field_values_number_idx
  on public.academic_profile_field_values (field_id, value_number);
create index if not exists academic_profile_field_values_date_idx
  on public.academic_profile_field_values (field_id, value_date);

create or replace function public.academic_profile_value_visible(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin(auth.uid())
    or exists (
      select 1
      from public.section_enrollments e
      join public.academic_sections s on s.id = e.section_id
      where e.student_id = p_student_id
        and s.archived_at is null
        and (
          s.teacher_id = auth.uid()
          or exists (
            select 1 from public.academic_section_assistants a
            where a.section_id = s.id and a.assistant_id = auth.uid()
          )
        )
    );
$$;

alter table public.academic_profile_fields enable row level security;
alter table public.academic_profile_field_values enable row level security;

drop policy if exists academic_profile_fields_select_staff on public.academic_profile_fields;
create policy academic_profile_fields_select_staff on public.academic_profile_fields
  for select to authenticated
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('teacher', 'assistant')
    )
  );

drop policy if exists academic_profile_fields_modify_admin on public.academic_profile_fields;
create policy academic_profile_fields_modify_admin on public.academic_profile_fields
  for all to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists academic_profile_field_values_staff on public.academic_profile_field_values;
create policy academic_profile_field_values_staff on public.academic_profile_field_values
  for all to authenticated
  using (public.academic_profile_value_visible(student_id))
  with check (public.academic_profile_value_visible(student_id));

grant select, insert, update, delete on public.academic_profile_fields to authenticated, service_role;
grant select, insert, update, delete on public.academic_profile_field_values to authenticated, service_role;

insert into storage.buckets (id, name, public)
values ('academic-profile-files', 'academic-profile-files', false)
on conflict (id) do nothing;
```

Storage object policies: authenticated staff do not read the bucket directly. The server action uses the service role after the same visibility check, then returns a short-lived signed URL.

- [ ] **Step 3: Append the same SQL to `masterdb.sql`**

Marker: `-- ========== 228_academic_profile_fields.sql ==========`

---

### Task 4: Staff audit and section access

**Files:**
- Create: `src/lib/academic-profile/auditAcademicProfileStaffAction.ts`
- Create: `src/lib/academic-profile/academicProfileSectionAccess.ts`
- Test: `src/__tests__/lib/academic-profile/academicProfileSectionAccess.test.ts`

**Interfaces:**
- Consumes: `createAdminClient` from `@/lib/supabase/admin`
- Produces:
  - `auditAcademicProfileStaffAction({ actorId, action, resourceType, resourceId, payload })`
  - `canEditAcademicProfileValue({ isAdmin, isLeadOrListedAssistant, studentEnrolledInSection }) -> boolean`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { canEditAcademicProfileValue } from "@/lib/academic-profile/academicProfileSectionAccess";

describe("canEditAcademicProfileValue", () => {
  it("allows admin", () => {
    expect(canEditAcademicProfileValue({
      isAdmin: true,
      isLeadOrListedAssistant: false,
      studentEnrolledInSection: false,
    })).toBe(true);
  });

  it("allows a lead or listed assistant when the student is enrolled", () => {
    expect(canEditAcademicProfileValue({
      isAdmin: false,
      isLeadOrListedAssistant: true,
      studentEnrolledInSection: true,
    })).toBe(true);
  });

  it("rejects the institute-wide assistant who is not listed on the section", () => {
    expect(canEditAcademicProfileValue({
      isAdmin: false,
      isLeadOrListedAssistant: false,
      studentEnrolledInSection: true,
    })).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test**

Run: `npx vitest run src/__tests__/lib/academic-profile/academicProfileSectionAccess.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement**

`canEditAcademicProfileValue` returns `isAdmin || (isLeadOrListedAssistant && studentEnrolledInSection)`.

`auditAcademicProfileStaffAction` copies `auditLearningTaskStaffAction` and changes the log scope to `auditAcademicProfileStaffAction`. Payload must not include value text, numbers, dates, or storage paths. Callers pass `{ fieldId, studentId }` for a value save.

- [ ] **Step 4: Run the test**

Expected: PASS

---

### Task 5: Server actions

**Files:**
- Create: `src/app/[locale]/dashboard/admin/users/academicProfileActions.ts`
- Test: `src/__tests__/app/academicProfileActions.test.ts`

**Interfaces:**
- Consumes: `assertAdmin`, `assertTeacher`, `normalizeAcademicProfileFieldDraft`, `canEditAcademicProfileValue`, `auditAcademicProfileStaffAction`, `recordSystemAudit`
- Produces:
  - `saveAcademicProfileFieldAction(input) -> { ok: true, id } | { ok: false, error }`
  - `archiveAcademicProfileFieldAction({ locale, fieldId }) -> { ok: true } | { ok: false, error }`
  - `saveAcademicProfileValueAction(input) -> { ok: true } | { ok: false, error }`
  - `prepareAcademicProfileFileUploadAction(input) -> { ok: true, path, token } | { ok: false, error }`

Keep the file under 250 lines. If it grows past that, split file actions into `academicProfileFileActions.ts`.

- [ ] **Step 1: Write the failing test**

Mock `@/lib/dashboard/assertAdmin`, `@/lib/dashboard/assertTeacher`, `@/lib/supabase/admin`, and `next/cache` `revalidatePath`.

Cases:

- Admin create with `fieldType: "image"` and `showInDirectory: true` inserts `show_in_directory: false`.
- Teacher call to `saveAcademicProfileFieldAction` returns `{ ok: false, error: "forbidden" }`.
- `saveAcademicProfileValueAction` for a lead teacher and an enrolled student updates the row and audits `{ fieldId, studentId }` only.
- The same value action returns forbidden when `canEditAcademicProfileValue` is false.
- A required field with an empty value returns `{ ok: false, error: "required" }` and does not write.

- [ ] **Step 2: Run the test**

Run: `npx vitest run src/__tests__/app/academicProfileActions.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement the actions**

Zod input. `saveAcademicProfileFieldAction` calls `assertAdmin`, then `normalizeAcademicProfileFieldDraft`. Insert or update. Do not accept a new `fieldType` on update. `recordSystemAudit` action `academic_profile_field_save`, resource `academic_profile_field`, payload `{ fieldId, fieldType, showInDirectory }`. `revalidatePath` for `/${locale}/dashboard/admin/users` and the student detail path.

`archiveAcademicProfileFieldAction` sets `archived_at` to `now()`. It does not delete values.

`saveAcademicProfileValueAction` resolves admin via `resolveIsAdminSession`. If not admin, `assertTeacher`, then load `academic_sections.teacher_id` and `academic_section_assistants` for `sectionId`. Enrollment check: a `section_enrollments` row for that student and section. Empty value deletes the row unless `required` is true. Slot columns come from `academicProfileValueSlot`. Then `auditAcademicProfileStaffAction`. `revalidatePath` for the student detail and `/${locale}/dashboard/teacher/sections/${sectionId}` when `sectionId` is present.

`prepareAcademicProfileFileUploadAction` uses the same access check, rejects files over `EVENT_FORM_FIELD_DEFAULT_MAX_BYTES`, and calls `createSignedUploadUrl` on bucket `academic-profile-files`. Path: `${studentId}/${fieldId}/${safeFileName}`.

Log failures with `logSupabaseClientError` or `logServerAuthzDenied`.

- [ ] **Step 4: Run the test**

Expected: PASS

---

### Task 6: Admin card and modal

**Files:**
- Create: `src/components/molecules/AcademicProfileFieldModal.tsx`
- Create: `src/components/molecules/AdminAcademicProfileFields.tsx`
- Modify: `src/components/molecules/AdminUserProfileTabPanels.tsx`
- Modify: `src/dictionaries/en.json`, `es.json`, `pt.json`
- Test: `src/__tests__/components/AdminAcademicProfileFields.test.tsx`

**Interfaces:**
- Consumes: Task 5 actions, `ConfirmActionModal`, `InlineUploadProgressBar`
- Produces: `AdminAcademicProfileFields` props `{ locale, studentId, fields, values, labels, editable }`

- [ ] **Step 1: Add dictionary keys**

Under `admin.users.academicFields`: `edit`, `done`, `addField`, `fieldSettings`, `name`, `type`, `required`, `showColumn`, `archive`, `archiveTitle`, `archiveBody`, `saveError`, `requiredError`, `forbidden`, and one label per field type. Spanish `addField` is "Agregar campo". Spanish `done` is "Listo".

- [ ] **Step 2: Write the failing UI test**

Render read mode. The add button is absent. Click the edit button named by the dictionary. The add button appears. Open the modal, choose type image, and expect the column checkbox to be absent.

- [ ] **Step 3: Run the test**

Expected: FAIL

- [ ] **Step 4: Implement**

`AdminUserAcademicPanel` renders `AdminAcademicProfileFields` inside the academic card, only when `detail.role === "student"`. Pass the fields loaded by the user detail loader.

`AdminAcademicProfileFields` holds `editing` state. Read mode shows label and value, or the em dash. A select value that is no longer an option still displays. The editor only offers current options. Edit mode shows inputs and **Add field**. **Field settings** opens the modal for that field with the type disabled. **Done** saves changed values. A `required` error stays in edit mode.

`AcademicProfileFieldModal` fields: name, type, required, column checkbox. Select shows option inputs. File and image do not render the checkbox. Archive is a second button that opens `ConfirmActionModal`.

File and image inputs use `InlineUploadProgressBar` and `prepareAcademicProfileFileUploadAction`, then `saveAcademicProfileValueAction` with the storage path. On `{ ok: true }`, call `router.refresh()`.

- [ ] **Step 5: Run the test**

Expected: PASS

Wire the detail loader in `src/lib/dashboard/loadAdminUserDetail.ts` to select active fields and that student's values. Keep the loader under 250 lines by putting the query in `src/lib/academic-profile/loadAcademicProfileForStudent.ts`.

---

### Task 7: Teacher roster panel

**Files:**
- Create: `src/components/molecules/TeacherAcademicProfilePanel.tsx`
- Modify: `src/components/molecules/TeacherRosterStudentRow.tsx`
- Modify: `src/components/organisms/TeacherSectionRoster.tsx`
- Modify: the teacher section page that renders the roster, so it passes `canEditAcademicProfile` and the field list
- Test: `src/__tests__/components/TeacherAcademicProfilePanel.test.tsx`

**Interfaces:**
- Consumes: `saveAcademicProfileValueAction`
- Produces: a row button and a panel. The attendance `onOpenContext` stays.

- [ ] **Step 1: Write the failing test**

The panel shows a value input and no add button. Submit with an empty required field shows `requiredError` and does not call the action.

- [ ] **Step 2: Run the test**

Expected: FAIL

- [ ] **Step 3: Implement**

Add a button on `TeacherRosterStudentRow` with a Lucide `ClipboardList` icon and an `aria-label` from `teacherMySections`. It calls `onOpenAcademicProfile`. Render it only when `showAcademicProfile` is true. The parent sets that flag when the viewer is the section lead or a listed assistant.

`TeacherSectionRoster` stores the open student id and renders `TeacherAcademicProfilePanel`. Do not reuse `TeacherStudentQuickContext`.

The panel saves through `saveAcademicProfileValueAction` with `sectionId`. Then `router.refresh()`.

- [ ] **Step 4: Run the test**

Expected: PASS

---

### Task 8: Alumnos columns and filters

**Files:**
- Create: `src/lib/dashboard/applyAcademicProfileDirectoryFilter.ts`
- Create: `src/components/dashboard/AcademicProfileDirectoryFilters.tsx`
- Modify: `src/lib/dashboard/lockedRoleUsersParams.ts`
- Modify: `src/lib/dashboard/loadAdminLockedRoleDirectory.ts`
- Modify: `src/components/dashboard/AdminUsersDataTable.tsx`
- Modify: `src/components/dashboard/AdminUsersDataTableRow.tsx`
- Modify: `src/components/pwa/molecules/AdminUsersPwaListItem.tsx`
- Modify: `src/lib/product-changelog/catalogEntriesNow.ts`
- Test: `src/__tests__/lib/dashboard/applyAcademicProfileDirectoryFilter.test.ts`

**Interfaces:**
- Consumes: Task 2 matcher
- Produces: `applyAcademicProfileDirectoryFilter(studentIds, fields, values, params) -> string[]`

- [ ] **Step 1: Write the failing test**

Two students. Params require select B1 and text "habla". Only the student who matches both remains. The result is the id list before any page slice.

- [ ] **Step 2: Run the test**

Expected: FAIL

- [ ] **Step 3: Implement the filter hook**

`lockedRoleUsersParams` adds `academicFieldFilters: parseAcademicDirectoryParams(raw)` on `PaginatedAdminUsersParams`.

In `loadAdminLockedRoleDirectory`, after `matched` and only when `role === "student"`, replace the id set with `applyAcademicProfileDirectoryFilter`. Load field rows and value rows in `src/lib/academic-profile/loadAcademicProfileDirectoryFacts.ts` with explicit columns and `chunkedIn` for student ids. Do not add the query inline if that pushes the directory loader over 250 lines.

Attach display values only for `pageProfiles`. Add `academicFieldCells: { fieldId, label, text }[]` on `AdminUserRow` as an optional field so other directories stay empty.

`AdminUsersDataTable` appends one column per directory field before the actions column. Text cells use 120 characters. Empty cells use the em dash.

`AdminUsersPwaListItem` appends the same labels to the row summary.

`AcademicProfileDirectoryFilters` renders under the existing Alumnos filter panel. Select options use `countSelectOptionFacet`. Text, number, and date are inputs. Changing a control writes `acf_<uuid>` and resets `page`. Clear filters deletes every `acf_` key and keeps `q`.

- [ ] **Step 4: Changelog**

Prepend `academic-profile-custom-fields` to `PRODUCT_CHANGELOG_ENTRIES` with date `2026-10-27`, area `academic`, and `t()` title and summary in es, en, and pt. Staff-facing. One sentence each.

- [ ] **Step 5: Run the tests**

Run:

```bash
npx vitest run src/__tests__/lib/academic-profile src/__tests__/app/academicProfileActions.test.ts src/__tests__/components/AdminAcademicProfileFields.test.tsx src/__tests__/components/TeacherAcademicProfilePanel.test.tsx src/__tests__/lib/dashboard/applyAcademicProfileDirectoryFilter.test.ts
```

Expected: PASS

## Manual QA (user)

- Admin adds a list field, marks the column, sets B1, and filters Alumnos to B1.
- Admin adds an image. It shows on the card. It is not a column.
- Archive removes the column. The database still has the value.
- The section lead edits the value. A teacher of another section cannot.
- A student session does not show the fields.

## Spec coverage

| Spec section | Task |
| --- | --- |
| Field types, column force-off, archive | 1, 3, 5, 6 |
| Per-student value slots | 1, 5 |
| RLS and section staff | 3, 4, 5 |
| Admin pencil, modal, archive confirm | 6 |
| Teacher panel, no add button | 7 |
| Alumnos column, filter, facets, page slice | 2, 8 |
| File upload and 25 MB cap | 5, 6 |
| Audit without value text | 4, 5 |
| i18n and changelog | 6, 8 |
| Student, parent, tutor denied | 3, 5 |
