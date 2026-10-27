# Academic profile custom fields

**Date:** 2026-10-27
**Status:** Draft. Waiting for approval.
**Kind:** Design spec. Implementation plan after this file is approved.

**Intent:** An institute defines extra academic fields once. Each student stores a value. Admin and the student's teachers read and edit the value. The student, the parent, and the tutor do not see it. Admin can show a field as a column on Alumnos and filter by it.

**Done when:**

- The student card **Estado académico** lists the active fields under the role row.
- A pencil opens edit mode for values. **Done** saves them. Spanish copy is "Listo".
- In edit mode, **Add field** opens a modal like the event form field modal. Spanish copy is "Agregar campo".
- The modal accepts text, long text, number, date, email, phone, select, file, and image.
- File and image cannot be a column or a filter. The column checkbox stays off.
- The same modal edits a field. The type stays fixed. Archive hides the field.
- A button on the teacher section roster opens a panel for that student. The panel edits values only. The attendance quick context stays as it is.
- Alumnos (desktop table and narrow list) shows a column for each field marked as a column.
- Those fields also appear in the existing Alumnos **Filtros** panel. The filter runs in the server query, before paging.
- Copy is in `en.json`, `es.json`, and `pt.json`. Spanish is neutral tuteo.
- Vitest covers the pure rules, the directory filter, and the two save actions.

**Out of scope:**

- A settings page separate from the student card. The only place to add a field is that card.
- Drag to reorder fields. Order is creation order.
- Sorting the Alumnos table by a custom column. That sort is in `2026-10-27-table-column-sort-toggle-design.md`.
- Columns or filters on Profes, Padres, or the unlocked users list.
- The student portal, the parent portal, and tutor views.
- Changing a field type after create.
- Hard delete of a field or of its stored values.
- A teacher creating, renaming, or archiving a field.

## Decisions

| Topic | Choice |
| --- | --- |
| Owner of the definition | The institute. One list for every student. |
| Owner of the value | The student. One value per field. |
| Who defines a field | Admin only. |
| Who edits a value | Admin, the section lead teacher, or a listed assistant of that section. The student must be enrolled there. The institute-wide assistant role does not get this access by itself. |
| Who cannot read | Student, parent, tutor. |
| Column | Optional on the field. Forced off for file and image. Default off. |
| Filter | Only fields that are columns. Alumnos only. AND across fields. |
| Remove a field | Archive (`archived_at`). Values stay in the database. |
| Storage shape | Two tables. Do not store this on `profiles` JSON. Do not reuse `event_form_fields`. |

## Data

Next additive migration after the latest file in `supabase/migrations/`. Update `masterdb.sql` in the same change. ADR: `docs/adr/2026-10-27-academic-profile-fields.md` in the same implementation.

`academic_profile_fields`

- `id`, `label` (1–80 chars), `field_type`, `select_options` (text array, select only), `required` (boolean), `show_in_directory` (boolean), `sort_order`, `archived_at`, `created_at`, `updated_at`
- `field_type` is one of `text`, `textarea`, `number`, `date`, `email`, `phone`, `select`, `file`, `image`
- Check: `show_in_directory` is false when the type is `file` or `image`
- Check: `select` has at least one non-empty option. Other types store an empty array.

`academic_profile_field_values`

- `id`, `field_id`, `student_id`, `value_text`, `value_number`, `value_date`, `storage_path`, `updated_by`, `updated_at`
- Unique `(field_id, student_id)`
- One slot matches the type. Text types use `value_text`. Number uses `value_number`. Date uses `value_date`. File and image use `storage_path`.
- No row means empty. Clearing a value deletes the row.

Index `(field_id, value_text)`, `(field_id, value_number)`, and `(field_id, value_date)` so the directory filter does not scan the whole value table.

## Access

RLS and the server action both enforce the rule.

- Select field rows: admin, teacher, or assistant. These rows have no student value.
- Insert or update field rows: admin only. Archive is an update.
- Select or write a value: admin, or the lead teacher or listed assistant of a non-archived section where the student is enrolled.
- Student, parent, and tutor: no policy.

Server actions validate with Zod. They do not trust the client. Failures log with `[ge:server]`. Auth denials use `logServerAuthzDenied`.

## Admin card

Surface: `AdminUserAcademicPanel`, student role only.

Read mode shows the label and the value. An empty value shows the existing em dash. File shows the file name. Image shows a preview.

The card pencil enters edit mode. Inputs match the type. **Done** saves changed values and leaves edit mode. **Add field** is visible only in edit mode. A required field that is empty blocks **Done**. The error sits on that field. Other fields stay in edit mode.

**Field settings** on each custom row opens the same modal for that field. Type is read-only there. Archive uses `ConfirmActionModal`. It does not use `window.confirm`.

A select value that is no longer an option still displays. A new choice must be a current option.

## Modal

Fields: name, type, required, and **Show as a column on Alumnos**. Select also asks for options. File and image hide the column checkbox.

Create appends `sort_order`. Edit can change the name, required, options, and the column flag. It cannot change the type.

## Teacher panel

Surface: the teacher section roster (`TeacherSectionRoster`). A button on the student row opens the panel. The attendance quick context stays as it is.

The panel lists active fields and saves values. An empty required field blocks that save. The panel has no add, rename, or archive control. The button is visible to the lead teacher and to a listed assistant of that section. If someone else calls the action, it returns forbidden.

## Alumnos column and filter

A field is a column only when it is active and `show_in_directory` is true.

- Desktop table: one extra column per such field, after the built-in columns and before actions. Long text shows 120 characters.
- Narrow list: the same values in the row summary, truncated.
- Empty value shows an em dash. The column header sorts by that field. An empty value sorts last.

Filters use the existing Alumnos **Filtros** panel.

| Type | Control | Match |
| --- | --- | --- |
| text, textarea, email, phone | text box | contains, case insensitive |
| select | combo of current options | exact |
| number | number box | exact |
| date | date box | exact |
| file, image | none | none |

URL param: `acf_<fieldUuid>`. Omit it when empty. Ignore an unknown id or an archived field. Several params combine with AND. A change resets `page`. **Limpiar filtros** clears these params and keeps `q`.

Select combos show faceted counts, same rule as the other Alumnos combos. Text, number, and date have no option counts.

The filter applies inside the paginated students query. Do not load every student and filter in the browser.

## Files

Private Storage bucket. Path `{studentId}/{fieldId}/{fileName}`.

Max size is the event form default (`EVENT_FORM_FIELD_DEFAULT_MAX_BYTES`, 25 MB). The picker uses `InlineUploadProgressBar`. The read path uses a short-lived signed URL. Do not put the file in the directory query.

## Audit and refresh

Admin field create, update, and archive call `recordSystemAudit`. A value save can come from a teacher, and `recordSystemAudit` requires an admin session. Value saves call `auditAcademicProfileStaffAction`, the same shape as `auditLearningTaskStaffAction`: service-role insert into `system_config_audit` plus `recordAuditEvent` with the real actor.

- Field resource: `academic_profile_field`. Payload: field id, type, `show_in_directory`. No option list.
- Value resource: `academic_profile_field_value`. Payload: field id and student id. Do not store the value text, the number, the date, or the file path.

After a successful save, `revalidatePath` for the student card, the Alumnos list, and the teacher section. The client calls `router.refresh()`.

## Errors

- Forbidden: dictionary message. Do not open a link and do not change the form.
- Invalid type, empty label, select with no options, or a column flag on file or image: reject before write.
- Storage failure: the value row is not written. The user sees a dictionary error.
- A failed value save does not archive the field.

## Tests

- Pure: column flag forced off for file and image. Archive hides a field. Empty value is no row. Select keeps a stale option visible.
- Directory: URL parse, unknown id ignored, contains vs exact, AND of two fields, filter applied before the page slice.
- Actions: admin creates a field. A lead teacher or listed assistant can save a value for an enrolled student. Another teacher cannot. The institute-wide assistant role cannot. A student session is forbidden.
- UI smoke: pencil shows **Add field**. File type has no column checkbox. Teacher panel has no add button. An empty required field blocks save.

## Manual QA (user)

- Admin adds a list field, marks it as a column, sets B1 on one student, and filters Alumnos to B1.
- Admin adds an image field. It shows on the card. It is not a column.
- Archive removes the column. The old value is still in the database.
- A teacher of that section edits the list value. A teacher of another section cannot.
- A student session does not show the fields.
