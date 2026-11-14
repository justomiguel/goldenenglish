# Cash matrícula reads the cohort first

Spec: `docs/superpowers/specs/2026-11-12-cash-matricula-cohort-first-design.md`

1. Change `registrationMatriculaAmount` so cohort, then section, then snapshot wins. Lock that order in `registrationMatriculaAlta.test.ts`.
2. Add `loadRegistrationCashMatriculaAmounts`. No section reads the inscriptions cohort. A section reads that section's cohort and its own amount.
3. `markRegistrationPaidInPersonAction` uses those two amounts plus the snapshot. A zero result still returns `no_fee`.
4. Add the staff changelog row.
