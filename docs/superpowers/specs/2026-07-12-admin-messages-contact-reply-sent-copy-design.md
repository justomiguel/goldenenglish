# Admin messages — persist Sent copy for website contact email replies

**Date:** 2026-07-12  
**Status:** Approved (user confirmed)  
**Related:** `docs/superpowers/specs/2026-07-12-admin-messages-default-reply-design.md`, contact-form reply path `sendAdminSiteContactVisitorReply`

## Intent

When an admin replies to a **website contact** thread by email, also insert a `portal_messages` row so the reply appears under **Sent** (same as portal-to-portal sends).

## Done when

- After a successful visitor email send, a row exists with `sender_id = admin`, `recipient_id = site_contact` system profile, body = reply HTML, and visitor email/name copied onto `external_contact_*` columns.
- Sent list shows the visitor display name (or email) as **To**, not a cryptic system profile label.
- Vitest covers insert-on-success and mailbox `toName` for outbound contact replies.
- Failure to insert after email success is logged; email success still returns ok (or we fail closed — prefer: log + still ok, with audit already present; optional soft warn in UI later).

## Out of scope

- Changing inbound contact delivery.
- Backfilling historical email-only replies.
- Teacher/parent surfaces.
