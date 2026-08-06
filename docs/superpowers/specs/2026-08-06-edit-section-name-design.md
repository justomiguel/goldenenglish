# Edit academic section name

**Date:** 2026-08-06  
**Status:** Approved  
**Related:** `AcademicSectionRoomLabelEditor`, `sectionRoomLabelActions.ts`, `AcademicSectionPageHeader`, `AcademicSectionSettingsSummary`, `academic_sections.name`

## Intent

Admins can rename an academic section after creation. Today `academic_sections.name` is set only at create/copy time and shown read-only in the section header and Configuration tab.

## Decisions

| Topic | Choice |
|-------|--------|
| Who | Admin only (`assertAdmin`), same as other section settings |
| Where | Both Configuration (Clase group) and inline in the section page `<h1>` |
| Pattern | Reuse room-label editor + dedicated server action |
| Duplicate names in same cohort | Reject with `DUPLICATE` (case-insensitive after trim) |
| Database | **No migrations, no new constraints.** Uniqueness is enforced in the app layer only |
| Archived sections | Renaming allowed (same as room/period editors) |

## Architecture

### Server action

New file: `src/app/[locale]/dashboard/admin/academic/sectionNameActions.ts`

`updateAcademicSectionNameAction({ locale, sectionId, name })` returns:

- `{ ok: true }`
- `{ ok: false; code: "PARSE" | "DUPLICATE" | "SAVE" }`

Behavior:

1. `assertAdmin`
2. Zod: UUID `sectionId`; name trim, min length 2, max length 120
3. Load section `id`, `cohort_id`, current `name`
4. If trimmed name equals current name → `{ ok: true }` (no-op)
5. Query sibling sections in the same `cohort_id` for a case-insensitive name match excluding self → `DUPLICATE`
6. `.update({ name }).eq("id", …).select(…).maybeSingle()`; fail closed on 0 rows → `SAVE`
7. Audit `academic_section_name_updated` with `{ cohort_id, name }`
8. `revalidateAcademicSurfaces` + revalidate cohort and section paths

No DB schema changes.

### UI component

New: `AcademicSectionNameEditor` (client), mirroring `AcademicSectionRoomLabelEditor`.

Variants:

- **`embedded`** — label + input + Save in Configuration → Clase group (first field, above period/room)
- **`inline`** — pencil / click-to-edit on the page title; input + Save/Cancel; keep edit mode open on `DUPLICATE`/`PARSE`/`SAVE`

Shared save logic; both call the same action; on success `router.refresh()`.

### Wiring

- `AcademicSectionSettingsSummary` — mount name editor in Clase group; pass `section.name` and `nameEditor` dict
- `AcademicSectionPageHeader` — replace static `<h1>{sectionName}</h1>` with inline editor (still expose tour anchor `sectionDetailTitle`)
- Page / configuration panel — thread `nameEditor` i18n keys; `section.name` already loaded by `loadAdminSectionPageData`

### i18n

Under `dashboard.academicSectionPage.nameEditor` in `es.json` / `en.json` / `pt.json`:

- `title`, `lead`, `label`, `placeholder`, `save`, `cancel`, `success`, `error`, `duplicate`, `tooShort`
- Inline aria labels as needed (`editName`, `editNameAria`)

## Done when

1. Admin can rename from Configuration and from the section title; both persist to `academic_sections.name`.
2. Names shorter than 2 or longer than 120 are rejected (`PARSE` / `tooShort`).
3. Duplicate name in the same cohort (case-insensitive) is rejected with clear copy; edit mode stays open (inline).
4. Teachers cannot rename; non-admin callers fail via `assertAdmin`.
5. No Supabase migrations or UNIQUE constraints added.
6. Vitest covers action (parse / no-op / duplicate / save) and editor messaging for duplicate/success.
7. After save, header title and cohort section cards reflect the new name via refresh/revalidate.

## Out of scope

- Teacher (or assigned-teacher) rename
- Rename from cohort section card list
- DB UNIQUE index or migration
- Changing create-section uniqueness rules
- Auto-suffixing duplicates (`Nombre (2)`)

## Manual QA (admin)

1. Open section → click pencil on title → rename → success → title updates; back to cohort → card shows new name.
2. Configuration → Clase → change name → save → same persistence.
3. Try a name already used by another section in the cohort → duplicate error; name unchanged.
4. Try 1-character name → validation error.
5. Rename archived section → succeeds.
6. As teacher, confirm no rename control on teacher section views.
