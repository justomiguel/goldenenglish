# Contact-form message export implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an institute admin export website contact-form messages to Excel or PDF, choosing fields and choosing all rows or the latest 2000.

**Architecture:** A pure parser turns each `portal_messages` contact row into six values. A paged loader dedupes `broadcast_batch_id`. A server action builds ExcelJS or a branded react-pdf file. The messages header opens a modal.

**Tech Stack:** Next.js server actions, ExcelJS, `@react-pdf/renderer`, Vitest, dictionaries `en` / `es` / `pt`.

## Global Constraints

- Tier B desktop admin. No PWA tree.
- Fields, fixed order: sent date, name, email, phone, subject, body. At least one.
- Scope default `all`. Alternate `latest_2000` unique rows after dedupe.
- PDF letterhead uses the brand layer (logo, name, legal name, primary color).
- Audit stores format, scope, field ids, and row count. No message text.
- Spanish copy is neutral tuteo.
- Files stay at or under 250 lines.

---

### Task 1: Parse and select columns

- [x] Test subject, name, email, phone, and body from contact HTML.
- [x] Test column order stays fixed when the client sends a subset.
- [x] Implement `contactMessageExportContract.ts` and `parseContactMessageExportRow.ts`.

### Task 2: Page, dedupe, cap

- [x] Test two admin copies of one batch become one row.
- [x] Test `latest_2000` stops at 2000 unique rows and `all` reads the short last page.
- [x] Implement `loadContactMessagesForExport.ts`.

### Task 3: Files

- [x] Test the xlsx sheet has only the selected headers and the institute name.
- [x] Test a logo render failure retries the PDF without the logo.
- [x] Implement the xlsx builder, the PDF document, and the PDF artifact.

### Task 4: Action, dialog, copy

- [x] Test a non-admin gets no file.
- [x] Test the dialog sends the chosen scope and fields.
- [x] Implement the server action, the modal, dictionary keys, the ADR, and the changelog entry.
