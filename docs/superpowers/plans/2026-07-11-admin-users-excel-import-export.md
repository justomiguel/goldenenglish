# Admin users Excel import/export — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace student CSV import on Users with multi-role Excel export/import (shared column contract, preview modal, create + optional duplicate update).

**Architecture:** Pure spreadsheet contract + classifiers under `src/lib/users/`; admin server actions for export / dry-run / apply; Users list export modal + rewritten `/users/import` UI. Creates reuse `createDashboardUser` orchestration and `ADMIN_INVITE_DEFAULT_PASSWORD`.

**Tech Stack:** Next.js App Router, ExcelJS/`xlsx`, Zod, Vitest, dictionaries `en`/`es`/`pt`, `recordSystemAudit`.

**Spec:** [`docs/superpowers/specs/2026-07-11-admin-users-excel-import-export-design.md`](../specs/2026-07-11-admin-users-excel-import-export-design.md)

## Global Constraints

- Column headers: `email`, `role`, `first_name`, `last_name`, `dni_or_passport`, `phone`, `birth_date`
- Password never in file; creates use `educando2026` via `ADMIN_INVITE_DEFAULT_PASSWORD`
- Duplicate match: normalized email and/or dni; update does not change `role`
- Export scope: selection → those rows; else filter vs all; template = headers only
- File size ≤250 lines; copy in dictionaries; no native `alert`/`confirm`
- Self-contained tests (`30`); TDD vertical slices

---

## File map

| Path | Role |
|------|------|
| `src/lib/users/usersSpreadsheetColumns.ts` | Header constants + required set |
| `src/lib/users/usersSpreadsheetRowSchema.ts` | Zod row schema |
| `src/lib/users/classifyUsersSpreadsheetRows.ts` | new / duplicate / invalid |
| `src/lib/users/buildUsersSpreadsheetXlsx.ts` | ExcelJS workbook (template or data) |
| `src/lib/users/parseUsersSpreadsheetFile.ts` | Parse + header gate (wrap `parseImportFile`) |
| `src/app/.../users/exportUsersAction.ts` | Admin export download |
| `src/app/.../users/importUsersActions.ts` | Dry-run + apply |
| `src/components/molecules/AdminUsersExportModal.tsx` | Export choices |
| `src/components/molecules/AdminUsersImportPreviewModal.tsx` | Preview + update choice |
| `src/components/organisms/ImportUsers.tsx` | Replaces ImportStudents entry on users import page |
| `src/components/dashboard/AdminUsersToolbar.tsx` (+ desktop/narrow screens) | Export button wiring |
| Dictionaries | Export/import copy |
| Tests under `src/__tests__/lib/users/` and component tests |

---

## Task 1 — Spreadsheet contract (pure)

- [ ] RED: tests for columns, Zod row validation, header gate
- [ ] GREEN: implement columns + schema + `assertUsersSpreadsheetHeaders`
- [ ] Verify: `npx vitest run src/__tests__/lib/users/usersSpreadsheet*`

## Task 2 — Classify rows

- [ ] RED: classify new vs duplicate by email/dni against existing profiles fixture
- [ ] GREEN: `classifyUsersSpreadsheetRows`
- [ ] Verify vitest

## Task 3 — Build / parse XLSX

- [ ] RED: template has headers only; data workbook round-trips through parser
- [ ] GREEN: `buildUsersSpreadsheetXlsx` + `parseUsersSpreadsheetFile`
- [ ] Verify vitest

## Task 4 — Export action + modal UI

- [ ] RED: export scope helper (selection / filter / all)
- [ ] GREEN: `exportUsersAction` + `AdminUsersExportModal` + toolbar CTA
- [ ] i18n keys en/es/pt
- [ ] Vitest for scope helper + modal smoke

## Task 5 — Import dry-run + preview modal

- [ ] RED: dry-run returns counts; wrong headers → error code
- [ ] GREEN: `dryRunImportUsersAction` + `AdminUsersImportPreviewModal` + `ImportUsers` organism
- [ ] Wire `/users/import` to `ImportUsers`; rename CTA “Import users”
- [ ] Vitest

## Task 6 — Apply import

- [ ] RED: apply creates only new; updates profile when flag set; skips when not
- [ ] GREEN: `applyImportUsersAction` using create orchestration + bounded profile updates; audit
- [ ] Long-job path if batch large (reuse existing job UX if already practical; else sync with clear progress for v1 cap)
- [ ] Vitest with mocked admin client

## Task 7 — Cleanup + DoD

- [ ] Remove Users entry points to student `ImportStudents` (page/gate)
- [ ] Update tips/glossary/dict that say “Import CSV”
- [ ] Run targeted vitest suite; note Manual QA checklist for user

---

## Manual QA (user)

1. Export template → fill 2 new + 1 existing → import → preview counts → leave duplicates → OK → only new created  
2. Re-import same file → update duplicates → names change, roles unchanged  
3. Export with selection / filter / all  
4. Bad headers → error, no apply
