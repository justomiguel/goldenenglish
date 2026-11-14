# Cohort matrícula when the lead has no section

## Intent

A lead with no section belongs to the open inscriptions cohort. When that cohort `default_enrollment_fee_amount` is above zero, the lead owes that matrícula. Mark contacted must not create the student. The funnel stays on the contacted stage. The matrícula mail quotes that amount.

A section amount still wins, including 0. A cohort default of 0 or null keeps the zero-fee accept.

## Done when

- `chargesEnrollmentFee` is true for a section-less lead when the open cohort default is above zero.
- `registrationFunnelStage` returns `contacted`, not `awaiting_section`, for that lead after mark contacted.
- The registrations table query uses the same rule, so the contacted count and the rows match.
- `promoteZeroFeeContact` does not call `acceptRegistrationLead` when that default is above zero.
- `buildRegistrationEnrollmentFeeInsertFields` with no section ids writes a snapshot whose total is the open cohort default.
- `canStartRegistrationEnrollmentFeeFlow` allows that lead, including `intake_state` `needs_section`.
- `startAdminRegistrationEnrollmentFeeFlow` quotes the cohort default and does not return `needs_section`.
- Spanish and Portuguese stage copy says pre-inscritos contactados. English says Pre-enrolled, contacted.
- A lead whose open cohort default is 0 or missing still skips payment.

## Out of scope

- Do not delete or rewrite a student already created for a past lead.
- Do not change a section whose stored fee is 0.
- Do not charge the cohort monthly fee when there is no section.

## Surfaces (Web vs PWA)

Tier B. The registrations list and the actions popup share the same row flag and the same server actions. No new PWA tree.

## Decisions

The open cohort is `site_settings.registration_cohort_id`, with the same fallback as `resolveRegistrationCohortState`. The amount is `academic_cohorts.default_enrollment_fee_amount`. The quote is one matrícula line named with the cohort. It does not assign a section.
