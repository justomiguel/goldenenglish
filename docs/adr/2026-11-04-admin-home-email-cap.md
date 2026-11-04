# Admin home email cap

**Date:** 2026-11-04
**Status:** Accepted

## Context

Each institute sends mail through its own Resend key. The admin home had no count and no ceiling. A director could not see how close the account was to 5000 mails in the current month. Event seats, cohort enrollments, today's classes, trials, tight sections, waitlist, and event payments waiting for review were also missing from that home.

## Decision

Store each accepted send in `public.email_send_ledger`. Count `recipient_count` for the UTC calendar month. The default cap is 5000 and lives in `site_settings.email_monthly_cap`. `sendBrandedEmail` refuses a send that would pass the cap and does not call Resend. The admin home reads one snapshot, `admin_home_ops_snapshot`, after `resolveIsAdminSession`. The function is `SECURITY DEFINER` and granted to `authenticated`, the same grant as `admin_hub_profile_counts`.

## Options considered

Read the month from the Resend API. Rejected. The call is slow, the key is a secret, and a network failure hides the number. The ledger is the source the cap can enforce.

Show the number and still send past the cap. Rejected. A cap that still sends is only a label.

## Consequences

- Mails sent before this ledger are not counted. The card says the count starts now.
- If the ledger insert fails after Resend accepts the mail, the send still succeeds and the month count can be short by that mail. The failure is logged with scope `email.monthlyCap`.
- If the usage read fails, the send is allowed and the failure is logged. A database blip does not stop every mail.
- Companion attendee rows count as seats. That matches the event admin total.
- A section with one attendance row counts as a started list.
- `released` trial seats are not unused capacity.
- Tests cover the cap math, the refuse path, the snapshot parser, and the cards.
