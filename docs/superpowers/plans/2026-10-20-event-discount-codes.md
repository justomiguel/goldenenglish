# Event discount codes

Spec: `docs/superpowers/specs/2026-10-20-event-discount-codes-design.md`

## Tasks

1. Migration `215_event_discount_codes.sql` and the same SQL in `masterdb.sql`.
2. Pure helpers: percent, Excel parse, generator. Tests first.
3. Enroll wrapper that locks the code row, then inserts the attendee and the redemption in one transaction.
4. Preview, approve, reject, revert, cancel, and delete.
5. Admin tab `codes` after Payments, with add, Excel, generator, and delete.
6. Public code field on the registration form (web, mobile, and staff preview).
7. Dictionaries, tour anchor, audit, changelog.

## Out of scope

Tuition coupons, shared codes, stacking with the family discount, and editing the code text.
