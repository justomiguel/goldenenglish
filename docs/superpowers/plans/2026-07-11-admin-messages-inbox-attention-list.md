# Plan: Admin messages inbox attention list

**Spec:** `docs/superpowers/specs/2026-07-11-admin-messages-inbox-attention-list-design.md`

## Tasks

1. ADR + migration `167_portal_messages_read_at.sql` (`read_at`, `external_replied_at`) + RLS update for recipient/admin.
2. Pure helpers: `adminPortalMessageNeedsReply`, `sortAdminPortalMailboxRows` + Vitest.
3. Extend `AdminPortalMessageRow` + mailbox loader (batch staff replies, flags, sort inbox).
4. Mark `read_at` on detail page load; set `external_replied_at` on successful external reply.
5. Dense list row component + inbox wiring; dict badges en/es/pt.
6. Tests for loaders + RTL list row; run Vitest.
