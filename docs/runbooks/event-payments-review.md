# Event Payments Review Runbook

## Goal

Review pending event transfer receipts and resolve each payment as approved or rejected.

## Scope

- Event registrations stored in `event_attendees`.
- Event payments stored in `event_payments`.
- Finalization records in `event_payment_flow_finalize_records` and `event_payment_mp_finalize_records`.

## Daily checklist

1. Open the admin finance hub in the `events` tab.
2. Identify rows with `status = pending`.
3. Verify amount, currency, attendee identity, and uploaded receipt evidence.
4. Approve or reject using admin event actions.
5. Confirm the attendee receives the corresponding notification email template.

## Approval criteria

- Receipt is readable and matches expected amount.
- Payment reference matches event context.
- No duplicate approved payment exists for the same attendee/event.

## Rejection criteria

- Invalid or unreadable proof.
- Amount mismatch without justification.
- Duplicate or unrelated transfer evidence.

## Operational notes

- No automatic refunds are triggered on event cancellations.
- Waitlist entries do not require payment until manually promoted.
- Keep `recordSystemAudit` traces for administrative decisions.
