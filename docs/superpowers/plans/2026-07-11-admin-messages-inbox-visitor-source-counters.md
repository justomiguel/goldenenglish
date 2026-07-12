# Plan: Admin messages visitor name, source icon, row gap, counters

**Spec:** `docs/superpowers/specs/2026-07-11-admin-messages-inbox-visitor-source-counters-design.md`

## Tasks

1. **TDD — pure helpers**
   - `extractSiteContactVisitorNameFromPortalHtml` (+ resolve preferring column)
   - `adminPortalMessageSource` / counters from rows
2. **Migration 168** — `external_contact_display_name TEXT NULL`; update attention trigger allowlist if needed; ADR note / mini extend
3. **Deliver + mailbox + detail** — persist name; set `fromName` + `source` on rows
4. **UI** — icon, spaced rows, counters bar; dict en/es/pt
5. **Tests** — helpers, mailbox, AdminMessageCard / inbox / tabs RTL
