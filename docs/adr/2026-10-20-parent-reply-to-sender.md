# Parent reply to the message sender

## Context

A parent can read a portal message from an admin or a teacher. The parent compose form can start a new message to a linked teacher or to every admin. That path requires a linked student. It does not answer one sender.

## Decision

Add a reply that inserts one `portal_messages` row to the sender of an inbound message. Allow it when that sender already wrote to this parent and the sender role is `admin` or `teacher`. Do not require `tutor_student_rel` for this insert. Keep the broadcast-to-administration path behind a linked student.

## Options considered

Send the reply to every admin. Rejected. The parent asked to answer the person who wrote the message.

Store `reply_to` on the row. Rejected. The inbox is a timeline. A new column does not change who receives the reply.

## Consequences

- Migration `216_parent_reply_to_sender.sql` adds `parent_may_reply_to_sender` and extends the parent insert policy.
- The server action checks the same rule before insert.
- The parent receives an email notify on the existing staff template.
- `recordUserEventServer` logs `parent_message_sent` with `destination: "reply"`.
- Tests cover a missing prior message, a disallowed role, and a successful insert to one recipient.
