# Delete any event registration and email the reason

Spec: `docs/superpowers/specs/2026-10-19-event-attendee-delete-notify-design.md`

1. Allow every attendee row to be deleted, including Mercado Pago, Flow, and approved payments.
2. Add `events.registration_removed` with `{{reason}}`, editable for the whole event, plus the key-check migration.
3. Confirm dialog: reason + “Avisar por correo”, checked on open. Send only when it stays checked, and only then delete. Unchecked deletes with no mail.
4. Tests for the allow rule, the send-before-delete gate, and the checkbox default.
