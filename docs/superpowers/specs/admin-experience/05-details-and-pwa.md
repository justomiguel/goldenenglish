# Mini 05 — Details and PWA admin

**Parent:** [`../2026-08-22-admin-experience-unification-design.md`](../2026-08-22-admin-experience-unification-design.md)
**Needs:** Mini 00

## Intent

Fichas, event detail, message thread, and narrow admin lists use `AdminBackLink` + the same cards. PWA admin must not reintroduce secondary chips.

## Done when

- User ficha / billing back links use `AdminBackLink`.
- Event detail back link uses `AdminBackLink`.
- Message compose/thread already have the banner; leftover inner shells (`AdminPortalCompose`, mailbox cards) use body-card classes.
- `AdminUsersPwaList` sort chips stay primary (already); no new secondary.
- Event detail workspace cards (`AdminEventAttendee*`, notifications) use body-card, not `bg-surface`.

## Out of scope

Changing ficha tabs or event payment RPCs.
