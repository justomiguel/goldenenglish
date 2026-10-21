# Event list shows the creator

**Intent:** On the admin events list, each row shows the staff member who created that event.

**Done when:**

- The admin events table has a creator column.
- The name comes from `events.created_by` and the linked profile.
- The visible name uses surname first, then given name (`formatProfileNameSurnameFirst`).
- Copy for the column header is in `en.json`, `es.json`, and `pt.json`. Spanish is neutral Latin American tuteo.
- The list stays server-paginated. The profile lookup uses only the creator ids on the current page.

**Out of scope:**

- The public events list.
- Editing `created_by` after create.
- Sorting or filtering the list by creator.
- Discount codes. That work stays in `2026-10-20-event-discount-codes-design.md`.
