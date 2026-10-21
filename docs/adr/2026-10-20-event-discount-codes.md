# Event discount codes

## Context

Staff need per-event discount codes. A code has a percent and a use cap. Tuition coupons are a different product and must stay separate.

## Decision

Store codes and redemptions in two new tables. Reserve a use in the same database transaction as the attendee insert. Lock the code row first. Consume the use when payment is approved. Release it when the registration is cancelled or the payment is rejected.

## Options considered

Reuse `discount_coupons`. Rejected. Those rows are for tuition, and they are not scoped to one event.

Parse an Excel file on every enroll. Rejected. The file is not a reliable source after upload, and two enrolls can race.

## Consequences

- Migration `215_event_discount_codes.sql` adds the tables, RLS, and the enroll wrapper.
- A 100% code confirms the attendee and consumes the use at enroll.
- Family discount and a code cannot be used together. The server rejects that payload.
- Admin writes call `recordSystemAudit`.
- Tests cover rounding, the Excel parser, the generator, and the redemption status changes.
