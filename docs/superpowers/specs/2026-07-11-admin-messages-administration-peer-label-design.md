# Admin inbox: administration messages labeled as Administration (not a person)

**Intent:** Messages addressed to **administration** (student/parent → all admins, public contact form → all admins) must not look like personal mail to one named admin. In the admin inbox and message detail, **To** must show a dictionary label equivalent to **Administration** / **Admin**, and those messages must appear for **every** admin who received a row.

**Done when:**

1. Admin mailbox cards and detail view show `toName` = dictionary administration peer label (reuse the same concept as parent/student `administrationPeerLabel`, e.g. “Administration”) when the row is an **administration-bound** inbound message — not the individual admin’s profile display name.
2. **To role** stays the admin/administration role label (already via `portalMessageRoleDisplay`).
3. Parent → administration messages appear in every admin’s **Received** list (today the inbox filter allows teacher/admin/student/site_contact but **omits parent**).
4. Delivery already inserts one row per admin (broadcast / site-contact loop); no change to that model unless a gap is found in tests.
5. Vitest covers mailbox/detail labeling + parent-in-inbox; en/es (and pt if key added under `admin.messages`) dictionaries stay aligned.
6. Person-to-person staff DMs (admin ↔ admin, teacher → specific admin) keep the real person name in **To** / **From**.

**Out of scope:**

- Changing the one-row-per-admin persistence model to a shared single row.
- Parent/student timeline UX (already collapses to Administration).
- Teacher workspace messaging UI.
- Collapsing duplicate broadcast rows across admins into one shared UI thread (each admin still has their own inbox row).

## Context

- Parents/students send via `send*MessageToAdministrationUseCase` → one `portal_messages` row per admin + `broadcast_batch_id`.
- Public contact uses `deliverPublicSiteContactToAdmins` (one row per admin; may lack batch id).
- `loadAdminPortalMessagesMailbox` / `loadAdminPortalMessageDetail` set `toName` from the recipient profile name → admins see themselves as the named recipient.
- Inbox filter excludes `parent` senders → guardian administration mail can be invisible in the UI even though rows exist.

## Decision

1. Treat as **administration-bound** when inbound to the viewing admin and either:
   - `broadcast_batch_id` is set, or
   - sender role is `student` | `parent` | `site_contact` (and recipient is admin).
2. For those rows, set `toName` (and detail `toName`) from `admin.messages.administrationPeerLabel` (new key under `admin.messages`, aligned with existing portal copy).
3. Extend inbox sender allowlist to include `parent`.
4. Do **not** relabel teacher→admin or admin→admin person-to-person messages.

## Risks / mitigation

| Risk | Mitigation |
|------|------------|
| Relabeling all admin-recipient mail hides who was DM’d | Only administration-bound heuristics above |
| Detail loader lacks batch/sender role | Select `broadcast_batch_id` + use sender role from profiles |
| Dict drift en/es/pt | Add key in all locales in the same change |

## Manual QA (user)

- As parent/student, send to administration; as each of two admins, open Received → **To** = Administration, message visible for both.
- Teacher DM to one admin → **To** still that admin’s name.
- Public contact form → same Administration label for all admins.
