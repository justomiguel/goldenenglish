# Mini 06 — Messages

**Parent:** [`../2026-08-21-admin-surface-language-design.md`](../2026-08-21-admin-surface-language-design.md)
**Needs:** Mini 00

## Intent

Mensajes is a daily drawer item. Put it on the kit and match people/registrations chrome. The mailbox, filters and compose editor stay.

## Done when

- `/admin/messages` uses `AdminPageHeader` with `iconId="messages"`, `adminNav.messages` + `tipMessages`, and `AdminMessagesHeaderActions` in `actions`. `messagesTitle` tour stays.
- Four KPI cards sit under the header (received / unread / needs reply / sent) from the already-loaded mailbox rows. No new RPC.
- Filters, header CTAs, bulk actions, and accept/reply chrome use primary or ghost — never `--color-secondary`.
- The mailbox, compose form, and thread sit in the same white `rounded-2xl` card language as people lists.
- `/admin/messages/compose` and `/admin/messages/[messageId]` use the same title classes (compose/thread may keep a smaller visual weight via the header; still primary, not secondary).

## Out of scope

Reply templates, recipient picker, rich-text colours inside a message body.

## Files

- `src/app/[locale]/dashboard/admin/messages/page.tsx`
- `src/app/[locale]/dashboard/admin/messages/compose/page.tsx`
- `src/app/[locale]/dashboard/admin/messages/[messageId]/page.tsx`
