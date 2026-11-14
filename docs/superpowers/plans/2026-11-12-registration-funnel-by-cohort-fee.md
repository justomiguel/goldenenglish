# Registration funnel by cohort matrícula

Spec: `docs/superpowers/specs/2026-11-12-registration-funnel-by-cohort-fee-design.md`

1. Pure stage list and URL fallback in `registrationFunnelStage.ts`.
2. Load `default_enrollment_fee_amount` on cohort options. The selected cohort fee drives the list filter and the inbox counts.
3. Pass `cohortHasMatricula` through the screen, desktop, PWA, toolbar, and arrows. Shorten the arrow labels in `en.json`, `es.json`, and `pt.json`.
4. Changelog row `047`.
