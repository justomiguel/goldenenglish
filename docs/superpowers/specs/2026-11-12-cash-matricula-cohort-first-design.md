# Cash matrícula reads the cohort first

**Intent:** When staff mark a registration paid in cash, use the cohort matrícula when that amount is greater than 0.
**Done when:** A lead with no section, a zero fee snapshot, and an inscriptions cohort matrícula of 55000 records that amount and does not return `no_fee`.
**Out of scope:** Changing the section editor, the public checkout page, or the mail-quote builder.

## Context

`markRegistrationPaidInPersonAction` builds the amount from `fee_snapshot.total`, then from the preferred section. A missing section returns 0. Golden cohort 2027 stores `default_enrollment_fee_amount` 55000. The lead that failed has no section and a snapshot total of 0, so the action returns `no_fee`.

## Decision

Resolve the cash amount in this order:

1. Cohort matrícula, when it is greater than 0.
2. Section matrícula, when it is greater than 0.
3. Snapshot total, when it is greater than 0.
4. Otherwise `no_fee`.

The cohort is the preferred section's cohort. When the lead has no section, the cohort is the inscriptions cohort (`registration_cohort_id`), the same row `loadOpenCohortEnrollmentDefault` already reads.

A cohort amount greater than 0 wins over a different section amount and over the stored snapshot. Cohort 2027 at 55000 wins over section TEENS 6 2027 at 50000.

## Options considered

Use the cohort fee only when the section is missing. Rejected. Staff asked that a cohort matrícula is the amount that applies.

## Consequences

- The cash action writes `enrollment_fee_paid_amount` from this order.
- A section-specific matrícula is used only when the cohort amount is null or 0.
- Web and PWA both call the same action. No screen layout change.
- Tests lock the three-step order, including the no-section plus cohort fee case.

## Surfaces (Web vs PWA)

Tier B admin inbox. A PWA sheet exists (`AdminRegistrationActionsSheet`) and renders the same `AdminRegistrationFunnelPanel`. This change is the server amount only. Both surfaces keep the same button and the same error code when every amount is 0.
