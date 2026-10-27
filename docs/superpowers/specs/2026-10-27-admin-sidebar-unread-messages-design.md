# Admin sidebar unread message count

**Intent:** The admin sidebar Messages badge shows how many inbound messages are still unread. It does not show the size of the whole mailbox.

**Done when:**

- `loadAdminRecentInboundMessageCount` counts `portal_messages` for this admin where `recipient_id` matches and `read_at` is null.
- Read rows are excluded.
- A count of 0 hides the badge, as it does today.
- The same number feeds the sidebar, the header messages icon, and the phone tab, because they share this loader.
- The loader test expects the `read_at` is-null filter.

**Out of scope:**

- The reply status stack and the mail / WhatsApp actions.
- Changing which sender roles appear in the inbox.
- A date window. Unread stays unbounded by date.
