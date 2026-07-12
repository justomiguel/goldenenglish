# Critical E2E — Phase 5a (section enroll + event payment approve)

**Date:** 2026-07-12  
**Parent:** [critical-e2e-suite-design.md](./2026-07-12-critical-e2e-suite-design.md)  
**Status:** Approved (user “si”)

## Intent

Add two high-value precommit Playwright journeys without live gateways:

1. **Section enroll** — admin enrolls a student into the seeded section (or transfers if already enrolled elsewhere).
2. **Admin approve paid-event payment** — after anon paid register + transfer proof, admin approves the pending event payment.

## Done when

1. Spec covers enroll (prefer enroll of a unique student created in-test or seeded second student) → visible on section roster / enrollment list.
2. Spec covers: paid-event register (reuse paid path) → admin events payments/attendees UI → approve → row leaves pending / attendee no longer `pending_payment`.
3. Both wired in `playwright.config.ts`; `npm run test:e2e:precommit` green; warm suite ideally ≤4.5 min.
4. No collision with existing student enrollment used by payments tests (use unique student or a second section).

## Out of scope

- Section transfer between two sections (unless enroll path naturally includes it).
- Live MP/Flow.
- Reject receipt, record-without-receipt, attendance, ward email (Phase 5b+).

## Risks

| Risk | Mitigation |
|------|------------|
| Enrolling e2e-student breaks payments seed assumptions | Create unique student in-test via admin create-user, then enroll; or seed `e2e-student-b` |
| Paid-event approve UI selectors | Reuse dict labels; mirror finance OK — Paid pattern |
| Suite time | Keep each ≤70s warm |

## Definition of done

Specs + seed if needed + config; precommit green.
