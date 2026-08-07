# ADR 2026-07 — Portal messages read_at and external_replied_at

## Context

Admin inbox had no way to tell unread vs handled mail. Product needs attention signals for staff.

## Decision

1. Add nullable `read_at` and `external_replied_at` on `public.portal_messages`.
2. Recipients (and admins) may `UPDATE` those columns via RLS; other columns stay immutable through that policy.
3. Per-admin `read_at` on broadcast copies; `needsReply` for portal peers clears when **any** admin later messages that peer; site-contact clears when `external_replied_at` is set on the batch (site contact inserts share `broadcast_batch_id`).

## Options considered

- Client-only “read” in localStorage — rejected (no cross-device, no shared ops).
- Single shared inbox row — rejected (breaks per-admin notifications; ADR 2026-05).

## Consequences

- Migration `167_portal_messages_read_at.sql`.
- Detail page and successful reply mark `read_at`; external reply sets `external_replied_at` on the broadcast batch.
- Tests cover helpers + mailbox flags.

## Follow-up (2026-07 visitor display name)

- Additive `external_contact_display_name` (`168_portal_messages_external_contact_display_name.sql`) so admin inbox shows the contact-form visitor name instead of the synthetic `site_contact` profile.
- Column is insert-only (same immutability guard as `external_contact_reply_email` in the attention UPDATE trigger).
