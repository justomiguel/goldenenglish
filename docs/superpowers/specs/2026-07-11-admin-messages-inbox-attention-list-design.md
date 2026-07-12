# Admin messages inbox: dense list + unread / unanswered emphasis

**Intent:** Make the admin **Received** (and Sent where useful) mailbox scannable: denser **list rows** instead of large cards, a **shorter preview**, and clear visual weight for messages that are still **unread** and/or **unanswered**.

**Done when:**

1. Inbox UI is a compact **list** (bordered rows / subtle dividers), not tall preview cards; preview is **one line** (`line-clamp-1`), truncated.
2. Each inbound row exposes:
   - `isUnread` — `read_at` is null on that `portal_messages` row.
   - `needsReply` — no later staff reply to the peer (see Decision); site-contact rows need reply until an external reply was recorded (see below).
3. Unread and/or unanswered rows are **visually distinct** (e.g. stronger type weight, primary left accent / unread dot, optional badge chips from dictionaries) with AA contrast (**`26`**); not color-alone.
4. Opening message **detail** (or successful reply compose) sets `read_at` for that row (idempotent).
5. Migration adds nullable `read_at` (+ optional `external_replied_at` if needed for contact form) with RLS update for recipient/admin; ADR under `docs/adr/`.
6. Vitest for status helpers + mailbox flags + list row RTL smoke; en/es/pt copy for badges/aria.
7. Sort preference: unread/unanswered float above fully handled mail within the same folder (stable secondary sort by `created_at` desc).

**Out of scope:**

- Shared cross-admin “one of us already replied” collapsing of broadcast copies into a single shared read state (each admin’s row keeps its own `read_at`; **needsReply** may still clear for all if any admin replied to the peer — see Decision).
- Parent/student/teacher mailbox redesign.
- Real-time websockets; page refresh / navigation is enough.
- New filter toggles beyond visual + sort (can add later).

## Understanding

- Current `AdminMessageCard` is card-heavy (`line-clamp-3` preview, large padding) with no unread/answered concept.
- `portal_messages` has no `read_at` today.
- Replies are separate rows (admin → original sender); site-contact replies are outbound email only.

## Decision

1. **Layout** — Replace card grid with compact list rows: From → To, date, role chip(s), one-line preview, trailing Reply/Delete icon actions.
2. **Unread** — Additive `read_at TIMESTAMPTZ NULL`. Mark read on detail page load (server) and when a successful reply is sent from compose linked to that message.
3. **Unanswered (`needsReply`)** — For portal peers: true if no later `portal_messages` exists with `sender_id` in admin (or teacher when applicable) and `recipient_id` = original sender after this row’s `created_at`. Prefer “any staff admin replied to this peer after this inbound” so Admin B’s copy does not stay “needs reply” forever after Admin A answered. For `site_contact`: set `external_replied_at` when external reply email succeeds (or treat as needsReply until that column is set).
4. **Visual** — Unread: unread indicator + semibold from-name. Needs reply: dictionary badge. Both: left border accent with token colors. Handled rows stay muted.
5. **Governance** — Short ADR for `read_at` / `external_replied_at` contract.

## Risks

| Risk | Mitigation |
|------|------------|
| N+1 reply checks on 500 inbox rows | Batch: load recent outbound staff messages in one query / Map keyed by peer |
| Broadcast copies diverge on read | Document per-admin read; needsReply shared via staff reply heuristic |
| False “answered” from unrelated later admin→parent mail | Scope reply detection to pairs matching this inbound peer (+ optional `replyTo` link later); v1 = any admin→peer after `created_at` is acceptable product tradeoff — call out in ADR |

## Manual QA (user)

- Unread inbound looks emphasized; after opening detail, returns to list as read.
- After reply, row no longer shows needs-reply (for that peer’s pending inbound).
- Dense list readable on desktop; preview one line.

## Open questions (defaults if you just say OK)

1. Sort: **attention first** (unread ∪ needsReply) then date — default **yes**.
2. Sent folder: keep denser list but **no** unread styling — default **yes**.
