# Event payment ticket lines

Spec: `docs/superpowers/specs/2026-11-11-event-payment-charge-lines-design.md`

1. Change `AdminEventPaymentChargeLines` so a view always renders the adult line. Keep the minor line and the discount line conditional.
2. Pass every `shownEventChargeView` result as `chargeLines` in `loadEventPaymentsPaginated`.
3. Lock the plain adult row, the minor row, and the discount-only row in `AdminEventPaymentChargeLines.test.tsx`.
4. Add the staff changelog row. Commit only these files.
