# Admin sidebar messages

**Intent:** The admin sidebar lists Messages as a direct link to the inbox.

**Done when:** `buildAdminDailyNavItems` includes `/messages` after registrations, with the `messages` icon, the existing `messages` label, and the recent-message count as a badge. The mobile drawer uses the same list. Tests expect the link and the badge.

**Out of scope:** The phone tab bar, message permissions, and the inbox screen.
