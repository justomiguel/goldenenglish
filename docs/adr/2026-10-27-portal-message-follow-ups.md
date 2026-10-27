# Portal message follow-ups

## Context

Admin messages must show what happened to an inbound message. A portal reply and an email the app sends already live on `portal_messages`. Opening WhatsApp, Gmail, Outlook, or a mail draft happens in another app. The server cannot see that delivery. It can record that a staff member opened the link.

## Decision

Add `portal_message_follow_ups` with `message_id`, `actor_id`, `channel` (`whatsapp`, `mailto`, `gmail`, `outlook`), and `created_at`. Admin RLS allows select, and insert only when `actor_id` is the signed-in admin. The detail action inserts one row, then the browser opens the link. The label says opened. It does not say the outside app delivered the message.

## Options considered

Store the open as another `portal_messages` row. Rejected. That row would look like a portal reply and would mix a link click with a message the recipient can read.

## Consequences

- Additive migration `226_portal_message_follow_ups.sql`. No backfill.
- A follow-up clears `needsReply` for that inbound message.
- The insert is audited with `recordSystemAudit`. The click is a `trackEvent` with `channel` and `messageId` only.
- Tests cover the status stack, the link builders, and the phone match. The migration is the schema contract.
