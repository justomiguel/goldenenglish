# Plan: Admin messages administration peer label

**Spec:** `docs/superpowers/specs/2026-07-11-admin-messages-administration-peer-label-design.md`

## Tasks

1. **Pure helper** `isAdministrationBoundAdminInbound` (+ tests) — `broadcast_batch_id` set OR sender role in `student` | `parent` | `site_contact`.
2. **Dict** `admin.messages.administrationPeerLabel` in en/es/pt (“Administration” / locale equivalents).
3. **Mailbox** `loadAdminPortalMessagesMailbox` — select `broadcast_batch_id`; parent in inbox allowlist; set `toName` via helper + dict.
4. **Detail** `loadAdminPortalMessageDetail` — same select + labeling.
5. **Tests** update/add for mailbox + detail.
6. Run targeted Vitest.
