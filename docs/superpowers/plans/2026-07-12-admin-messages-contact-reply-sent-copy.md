# Plan — Contact reply Sent copy

## Approach

1. After successful visitor email in `sendAdminSiteContactVisitorReply`, insert a `portal_messages` row via **admin client** (`sender_id=admin`, `recipient_id=PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID`, body + `external_contact_*` from source). User-scoped RLS cannot target `site_contact` recipients today.
2. Update mailbox `toName` when recipient is `site_contact` to show visitor name/email.
3. TDD: unit test for persist helper + mailbox toName; extend action test if present.

## Files

- `src/lib/messaging/persistAdminSiteContactVisitorReplySentCopy.ts` (new)
- `src/app/.../messages/actions.ts` (wire)
- `src/lib/dashboard/loadAdminPortalMessagesMailbox.ts` (toName)
- Tests under `src/__tests__/lib/messaging/` and mailbox test
- Mini ADR under `docs/adr/`
