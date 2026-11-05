# Admin sidebar unread message badge

**Intent:** The institute sidebar Messages badge shows unread inbox messages for the signed-in admin.
**Done when:** The count is `portal_messages` where this admin is the recipient, `read_at` is null, and the sender is a person the inbox lists. Marking a message read or unread refreshes that badge.
**Out of scope:** The sent folder, and messages the inbox does not list.

## Surfaces (Web vs PWA)

Tier B admin shell. One loader feeds the desktop sidebar, the header icon, and the phone tab. The number is the same on each. No separate PWA layout.
