# Plan: Admin messages bulk selection

**Spec:** `docs/superpowers/specs/2026-07-11-admin-messages-bulk-selection-actions-design.md`

## Tasks

1. Pure helpers: ID cap (100), selection set ops — Vitest.
2. Server: `bulkSetAdminPortalMessageReadState`, `bulkDeleteAdminPortalMessages` — Zod UUID[], admin gate, chunked `.in()`, revalidate, audit, logs.
3. Hook `useAdminMessagesBulkSelection` — selection state, select-all/clear, run actions + refresh.
4. UI: row checkbox, bulk bar (read/unread/delete + confirm modal), wire into `AdminMessagesTabs` / inbox.
5. i18n en/es (+ pt if present).
6. Tests: action mocks, RTL checkbox + bar.
