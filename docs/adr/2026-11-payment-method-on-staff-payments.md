# Payment method on staff-recorded payments

## Context

Staff take cash and bank transfers at the desk. `payments` and `section_enrollments` stored a paid status and a date, but not the method or the amount of a cash enrollment fee. Waiving the fee was the only inbox action, so a cash payment looked like an exemption.

## Decision

Store the method and the paid date on the existing rows.

- `payments.payment_method` and `payments.paid_on`
- `section_enrollments.enrollment_fee_paid_method`, `enrollment_fee_paid_amount`, and `enrollment_fee_paid_on`

Allowed methods: `cash`, `transfer`, `card`, `gateway`, `other`. Null means the method was not recorded. Staff cash and transfer writes go through the admin actions and `auditFinanceAction`. Gateway capture writes `gateway`. Receipt approval writes `transfer`.

## Options considered

A separate cash-drawer ledger was rejected. It can be added later and can read these columns. Keeping the waive action as the cash path was rejected because reports would keep treating a payment as an exemption.

## Consequences

- Migration `267_payment_method_cash.sql` is additive. Old rows stay null.
- The cohort collections RPC returns the new enrollment and payment fields.
- Tests cover `parsePaidOn`, the inbox action, and the migration text.
- Finance audits include `payment_method`. A failed audit on the mark-paid and monthly record paths reverts the payment write.
