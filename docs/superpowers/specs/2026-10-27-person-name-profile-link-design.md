# Person name opens the profile

**Intent:** In an admin list of people, a click on the name opens that person's profile at `/{locale}/dashboard/admin/users/{id}`.

**Done when:**

- The section roster name opens the student profile.
- The admin attendance list name opens the student profile. The teacher attendance list stays plain text.
- Retention, collections, enrollment, payment history, and top debtors use the same profile URL for the person's name.
- A separate billing action stays a billing action.
- The directory lists that already open the profile stay as they are.

**Out of scope:**

- Teacher and parent portals.
- Rows that have no user id (a registration that is not a user yet).
