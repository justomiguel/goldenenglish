# ADR: Institute default reply template for admin Messages

**Date:** 2026-07-12  
**Status:** Accepted  
**Spec:** `docs/superpowers/specs/2026-07-12-admin-messages-default-reply-design.md`

## Context

Admins need a shared canned reply for inbound portal / contact-form threads, with tenant name and phone from the brand layer, without one-click send.

## Decision

Persist one plain-text template **per app locale** (`es` / `en` / `pt`) in `site_settings` key `messaging_default_reply_template` as `{ "templates": { "es", "en", "pt" } }` with placeholders `{{instituteName}}` and `{{phone}}`. Resolve at compose-open when `useDefault=1` is present with a valid `replyTo` bootstrap, picking the template for the **active dashboard locale**. Edit via modal tabs next to Write message; audit on save.

## Alternatives considered

- `site_themes` property — rejected (operational copy ≠ brand tokens).
- Dictionary-only fixed string — rejected (not editable per institute).
- One-click send — rejected (product chose compose prefill).

## Consequences

- New migration seed `169_messaging_default_reply_template.sql`.
- Admin-only read/write via existing `site_settings` RLS.
- Tests cover resolve, load/update, action, and UI CTAs.
