# Admin message outcome and unread badge

Specs:

- `docs/superpowers/specs/2026-10-27-admin-message-reply-and-contact-actions-design.md`
- `docs/superpowers/specs/2026-10-27-admin-sidebar-unread-messages-design.md`

## Steps

1. Count unread inbound rows in `loadAdminRecentInboundMessageCount` (`read_at` is null).
2. Add pure status stack, reply match, phone extract, and mail/WhatsApp URL builders. Test them.
3. Add `portal_message_follow_ups` (migration, RLS, ADR) and the insert action.
4. Attach the stack on inbox cards. Attach the stack and the action buttons on the detail.
5. Add en/es/pt copy and the product changelog entry.
