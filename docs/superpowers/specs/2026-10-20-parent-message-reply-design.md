# Parent reply to a received message

**Intent:** A parent can reply to one message from an admin or a teacher. The reply goes only to that sender. A linked student is not required for this reply.

**Done when:**

- Each received message from an admin or a teacher shows a **Reply** button on desktop and on mobile.
- The button opens a compose form addressed to that sender.
- The server stores one `portal_messages` row. The recipient is that sender.
- The insert is allowed when that person already sent this parent a message, even with no `tutor_student_rel` row.
- A parent cannot use this path to write to someone who never wrote to them.
- A new message to all administration still requires a linked student.
- Visible copy is in `en.json`, `es.json`, and `pt.json`.
- The parent messages tour text matches the button.

**Out of scope:**

- A reply button for students.
- A `reply_to` column or a thread view.
- A change to the broadcast compose tab.

## Decision

See `docs/adr/2026-10-20-parent-reply-to-sender.md`.

## Behavior

1. The parent inbox lists messages where the parent is the sender or the recipient.
2. A **Reply** button is shown when the message is incoming and the sender role is `admin` or `teacher`.
3. The parent writes the reply and sends it.
4. The server checks three facts:
   - The caller role is `parent`.
   - At least one prior row has `sender_id` = the recipient and `recipient_id` = the parent.
   - The recipient role is `admin` or `teacher`.
5. The server inserts one row and emails that recipient.
6. The timeline refreshes.

## Surfaces

Parent messages are Tier A. Desktop uses the compose area on the page. Mobile opens the existing compose modal.

## Data

Migration `216_parent_reply_to_sender.sql` adds `parent_may_reply_to_sender(recipient_id)` as `SECURITY DEFINER`. The parent insert policy keeps the current teacher and administration branches. It adds this function as a third allowed branch.
