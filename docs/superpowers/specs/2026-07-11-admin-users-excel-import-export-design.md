# Admin users — Excel import / export (multi-role accounts)

**Date:** 2026-07-11  
**Status:** Approved  
**Related:** existing `createDashboardUser` / `ADMIN_INVITE_DEFAULT_PASSWORD` (`educando2026`); Excel patterns in events/collections export; long-job UI for large applies (`11-long-running-jobs-ui.mdc`)

## Intent

On the admin **Users** surface, staff can:

1. **Export** accounts to Excel (`.xlsx`) — either a **blank template** or **rows with data** — using one shared column contract.
2. **Import** accounts from that same Excel contract (replacing the current student-only “Import CSV” flow).
3. **Preview** before writing: counts of **new** vs **duplicate** rows, choose whether to **update duplicates** or leave them, then confirm with OK to apply.

## Understanding

- Users list already supports search, role filter, row selection, and links to create / import.
- Current `/dashboard/admin/users/import` is **student-centric** (tutor, CEFR level, monthly fee, enrollment-oriented job). Product decision: **replace** that entry with multi-role **account** import/export.
- Single-user create already uses `ADMIN_INVITE_DEFAULT_PASSWORD` = `educando2026` when password is empty; bulk create uses the **same** default. Password is **never** written to or read from the spreadsheet.
- Event attendees already ship `.xlsx` artifacts (ExcelJS); file parse already supports CSV/XLSX via `parseImportFile`.

## Goals

1. Shared **column contract** for export template, export-with-data, and import validation.
2. Export modal: **template only** vs **with data**; data scope = **selected rows**, else ask **current filter** vs **all users**.
3. Import: reject wrong format with a clear dictionary error; classify rows; modal with new/duplicate counts + “update duplicates?”; OK applies create (+ optional profile update).
4. Rename CTA copy from “Import CSV” → “Import users” (and aligned tips) in `en` / `es` / `pt`.
5. Automated tests for schema, duplicate classification, export scope rules, and import preview/apply boundaries.

## Non-goals (this change)

- Tutor / guardian linking, CEFR level, monthly fee, or section enrollment via this spreadsheet (former student CSV academic path).
- Password column in the file; invite-by-email-only without creating Auth users.
- Changing the global default password string (stays `educando2026`).
- CSV as the primary download format (import may still accept `.csv` **only if** headers match the same contract; primary export is `.xlsx`).
- Soft-delete / purge via import.
- Role elevation safeguards beyond existing `assertAdmin` on actions.

## Product rules (locked)

| Rule | Detail |
|------|--------|
| Roles | `admin`, `teacher`, `student`, `parent`, `assistant` |
| Password | Always `ADMIN_INVITE_DEFAULT_PASSWORD` (`educando2026`) for newly created Auth users; never in Excel |
| Duplicates | Match on normalized **email** and/or **dni_or_passport** (when present). New → create; duplicates → skip or update profile per modal choice |
| Update duplicates | If chosen: update `first_name`, `last_name`, `phone`, `birth_date`, and empty→set `dni_or_passport` when safe. **Do not** change `role` on update in v1 |
| Format gate | Missing required headers / unparseable workbook → error, no preview apply |
| Export scope | If ≥1 row selected → export those. Else modal: **current list filter** vs **all users**. Template mode ignores row data |
| Replace | Users “Import CSV” entry and `/users/import` UX become account import; academic student bulk import is **no longer reachable** from Users |

## Spreadsheet contract

Stable English header keys (first sheet). Localized display labels may wrap in UI copy; **file headers must be these keys** so round-trip export → import works.

| Column | Required on import | Notes |
|--------|-------------------|--------|
| `email` | yes | Auth login email |
| `role` | yes | One of the five roles above |
| `first_name` | yes | |
| `last_name` | yes | |
| `dni_or_passport` | no | Strongly recommended; used for duplicate detection |
| `phone` | no | |
| `birth_date` | no | ISO `YYYY-MM-DD` |

Template export: header row only (optional one example empty row is fine; no PII).  
Data export: same headers + profile fields for the chosen scope (no password, no internal ids required in v1).

## UX

### Export (Users list)

1. Toolbar / actions: **Export users** (Lucide icon + dict label).
2. Modal asks:
   - Content: **Template only** | **With data**
   - If “With data” and selection empty: **Filtered list** | **All users**
   - If selection non-empty: export selection (show count); no filter/all choice needed
3. Download `.xlsx` via server action (admin-only), `Cache-Control` private if streamed through a route.

### Import (`/users/import` and CTA rename)

1. Upload `.xlsx` (and optionally `.csv` with identical headers).
2. Server **dry-run**: validate headers + rows → `{ newCount, duplicateCount, invalidCount, sampleErrors }` (no writes).
3. Modal:
   - Summary: N new, M duplicates, K invalid (if any)
   - Choice: **Update duplicates** | **Leave duplicates unchanged**
   - Primary **OK** / confirm to apply; Cancel aborts
4. Apply: create new users via existing invite/create orchestration; update duplicates only if chosen; show terminal result (created / updated / skipped / failed) using DS modal + dict (long job if batch is large — reuse `LongJobActivityModal` pattern when apply is async).

Invalid rows in a mixed file: skip with counted failures; do not block valid creates unless the whole file fails format gate.

## Architecture (layers)

| Layer | Responsibility |
|-------|----------------|
| Pure `src/lib/users/` (or `src/lib/dashboard/usersSpreadsheet/`) | Column constants, Zod row schema, header validation, duplicate classification, export row mapping |
| Server actions / route | Admin authz, load profiles for export scope, dry-run + apply, audit (`recordSystemAudit`) |
| UI | Export modal on Users screen; import screen replaces `ImportStudents` entry; confirm modal |
| i18n | All visible strings in `en` / `es` / `pt` |
| Tests | Schema, classify, export scope, dry-run/apply with mocked Supabase |

Reuse `createDashboardUser` / orchestration for creates so Auth + profile rules stay single-sourced. Prefer ExcelJS or existing `xlsx` helpers consistent with other admin exports.

## Observability & governance

- `recordSystemAudit` on successful export (optional, bounded meta: mode, row count) and on import apply (created/updated/skipped counts — no full PII dumps).
- ADR mini-note if the public import contract (file shape + apply API) is treated as a new staff contract — link from this spec when written.

## Risks & mitigation

| Risk | Mitigation |
|------|------------|
| Large “all users” export | Paginated/chunked profile reads; cap + clear error if over safety ceiling |
| Accidental role mass-create of `admin` | Allow in contract (admin-only UI); confirm modal shows role breakdown if cheap |
| Losing academic student CSV | Explicit product choice; document in UI that enrollment/tutor is not part of this file |
| Password in spreadsheets | Forbidden by contract + tests |

## Definition of done

- [ ] Export modal: template vs data; data scope = selection else filter vs all
- [ ] Import validates same headers; wrong format → dict error
- [ ] Preview modal: new/duplicate counts + update-duplicates choice + OK to apply
- [ ] Creates use `educando2026` default; no password column
- [ ] Users CTA/copy: Import users; old student import not reachable from Users
- [ ] Vitest coverage for pure contract + dry-run/apply boundaries
- [ ] Manual QA (user): export → edit → import preview → confirm on a tenant

## Out of scope (reminder)

Academic enrollment/tutor spreadsheet; changing default password; non-admin surfaces.
