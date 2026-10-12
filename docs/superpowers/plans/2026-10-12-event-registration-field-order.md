# Event registration field order

Spec: `docs/superpowers/specs/2026-10-10-event-base-field-required-design.md`

1. Pure resolver `registrationFieldOrder.ts` plus validator flags (phone / birth date).
2. Migration `209` and admin actions (order, required flags, clear `require_birth_date` when collection turns off) with audit and revalidation.
3. Admin form tab: one sortable list (pointer + up/down) and required checkboxes. Public registration renders that order.
4. Dictionaries, ADR, changelog.
