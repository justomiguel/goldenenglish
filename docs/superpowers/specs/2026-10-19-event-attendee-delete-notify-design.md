# Delete any event registration and email the reason

**Intent:** Staff can delete any event attendee, including one whose payment is Mercado Pago, Flow, or already approved. The confirm dialog asks for the reason and offers to email that person. The email checkbox starts checked and applies only to that deletion.

**Done when:**
- The attendees list shows Eliminar for every row. `canDeleteEventAttendee` no longer blocks gateway or approved payments.
- The confirm dialog has a reason field and a checkbox “Avisar por correo” (and en/pt equivalents). The checkbox is checked each time the dialog opens. Mail goes out only when that box stays checked. Unchecking it skips the email for that deletion only.
- With the box checked, the reason is required (trimmed, max 500). The server sends `events.registration_removed` to that attendee’s email, with `{reason}` escaped, and only then deletes the row. If the send fails, or the row has no email, the attendee stays and the dialog shows an error.
- With the box unchecked, no mail is sent and the reason is optional. The row is deleted.
- The new template is one copy for the whole event (not per flow), editable on the event email tab, with a default body that includes `{reason}`. A migration extends the `event_email_templates` key check. `masterdb.sql` matches.
- Audit `event_attendee_delete` records whether mail was requested. The reason is stored only as a bounded note, not as a new PII field beyond the email already logged.
- Deleting does not call Mercado Pago or Flow. The dialog says that an approved gateway payment is not refunded. The local `event_payments` row still disappears with the attendee (`ON DELETE CASCADE`).

**Out of scope:** Refunds, the payments-tab delete of a payment row, companion rows created by ticket packages (they still cascade when the primary is deleted; only the row being deleted is emailed), and changing other event mails.
