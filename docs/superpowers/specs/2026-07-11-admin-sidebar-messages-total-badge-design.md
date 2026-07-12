# Admin sidebar: messages badge = total inbound

**Intent:** The admin sidebar **Messages** badge must show the **total count of inbound portal messages** addressed to the signed-in admin (`recipient_id = admin`), **not** a 7-day recent window.

**Done when:**

1. `loadAdminRecentInboundMessageCount` (or renamed helper) uses `count: "exact"` with `.eq("recipient_id", adminId)` and **no** `created_at` lower bound.
2. Layout still passes that number to the Messages nav badge.
3. Vitest covers “counts all inbound for recipient” (mock supabase; assert no date filter / returns total).
4. Hub summary “recent” messaging (if separate) is **unchanged** unless it shares this helper — only the **sidebar badge** contract changes.
5. Rename/docs comment no longer claim “recent window” for the sidebar badge.

**Out of scope:** Changing page folder tiles; unread-only badge; sent-folder counts in the sidebar; pagination of the messages list.

## Understanding

- Today: `RECENT_MESSAGE_BADGE_DAYS = 7` under-counts vs the full inbox list.
- Product ask: lateral = **total** inbound messages.

## Risks

| Risk | Mitigation |
|------|------------|
| Large totals | Cap display already `99+` in nav UI |
| Count cost | `head: true, count: "exact"` + recipient filter (indexed FK path) |

## Manual QA (user)

Open admin with a full inbox → sidebar badge matches **Recibidos** (or full inbound total) when no filters are applied.
