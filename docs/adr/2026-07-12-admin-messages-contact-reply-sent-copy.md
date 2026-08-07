# ADR: Persist Sent copy for website contact email replies

**Date:** 2026-07-12  
**Status:** Accepted  
**Spec:** `docs/superpowers/specs/2026-07-12-admin-messages-contact-reply-sent-copy-design.md`

## Context

Admin replies to public contact-form threads go out by email only. Sent mailbox is `portal_messages` where `sender_id = admin`, so those replies never appeared in Sent.

## Decision

After a successful visitor email send, insert one `portal_messages` row via **service-role** (`createAdminClient`):

- `sender_id` = admin  
- `recipient_id` = `PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID`  
- copy visitor `external_contact_reply_email` / `external_contact_display_name`  
- set `read_at` (outbound copy is not inbox attention)

Mailbox **To** for rows whose recipient is the site-contact profile shows the visitor name (or email), not the system profile label.

## Options considered

1. **User-scoped insert** — rejected: `portal_messages_insert_admin` only allows recipients with roles student/parent/teacher/admin, not `site_contact`.
2. **Widen RLS for admin → site_contact** — viable later; service-role matches inbound contact delivery and keeps the exception explicit.
3. **Email-only + separate sent table** — rejected: duplicates mailbox model.

## Consequences

- Sent list grows with contact replies; filter “contact form only” (inbound sender) stays unchanged.
- Insert failure after email success is logged; action still returns ok (email already delivered).
- Tests cover persist helper + Sent `toName`.
