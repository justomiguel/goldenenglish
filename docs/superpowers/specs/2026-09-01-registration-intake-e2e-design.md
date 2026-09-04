# Registration intake E2E (join package, assign, trial, disposition)

**Date:** 2026-09-01  
**Status:** Approved (user asked to add Playwright for these journeys and the other complex app flows)  
**Kind:** Design spec. One implementation plan under `docs/superpowers/plans/`.

**Related:**

- [`2026-09-01-registration-schedule-offer-design.md`](2026-09-01-registration-schedule-offer-design.md) — offer journeys stay in that spec’s Task 8.
- [`2026-08-31-registration-join-package-design.md`](2026-08-31-registration-join-package-design.md)
- [`2026-08-28-trial-class-and-dual-cta-design.md`](2026-08-28-trial-class-and-dual-cta-design.md)
- [`2026-08-12-critical-e2e-phase6-full-coverage-design.md`](2026-08-12-critical-e2e-phase6-full-coverage-design.md) — Phase 6 already covers auth, monthly payments, events, academic, messaging, tours.

**Governing rules:** `02-testing-tdd.mdc`, `34-precommit-e2e.mdc`, `32-manual-qa-user-owned.mdc`, `28-tenant-register-surface.mdc`. Isolated stack only (`docs/runbooks/e2e-isolated-harness.md`).

## Intent

The isolated Playwright suite already walks the **old** register→accept path (Section A, `$0` matrícula) and the Phase 6 money/academic journeys. It does **not** walk the 2026-08 intake money paths. This spec adds those browser journeys to precommit. It does **not** re-implement Phase 6 or add live MP/Flow.

## Context (today)

| Covered on precommit | Missing |
|----------------------|---------|
| Register (A, no fee) → accept al día → student login | Register with fee → `/matricula` transfer → receipt approve |
| Monthly student/parent receipt approve/reject/record | Join-package breakdown on `/matricula` |
| Events free/paid/approve/remove | Admin **Asignar** when `needs_section` then family pay link |
| Enroll / unenroll / attendance / scholarship | Trial book → convert `/unirse` (if seed can offer trial) |
| Auth roles, messaging, forgot-password, tours, hubs | Accept **No al día** / beca (only `Al día` is clicked today) |

Phase 7 nightly (unchanged): live MP/Flow, CMS publish, coupons, multi-locale, assistant.

## Decisions

| Topic | Choice |
|-------|--------|
| Where | Same isolated stack + `RecordingEmailProvider`. New specs under `e2e/critical-registration-*.spec.ts` so `chromium-critical-registration` picks them up. |
| Seed | Do **not** put a fee on `E2E Section A`. Use `E2E Section B` (fee) and/or `E2E Section Tiny` from the schedule-offer seed. Enable trial on a dedicated `E2E Section Trial` only if `offers_trial` can be set without breaking A. |
| Pay method | Bank transfer + receipt fixture (`e2e/fixtures/receipt-tiny.png`), same as paid-event / monthly payments. No sandbox gateways. |
| Join disposition | One extra accept journey with **No al día** (`behind`). Beca stays unit-tested unless the dialog is one extra radio click in the same spec. |
| Trial | Include if the public register CTA + one seeded trial section is cheap. If `offers_trial` / cupo / mail is too coupled, ship join-package + assign + behind first; trial as a follow-up task in the same plan, not a new spec. |
| Budget | Stay inside the ≤15 min warm precommit budget. These specs are sequential (`workers: 1`) and must not reseed mid-file. |

## Journeys (required)

### 1. Join package `/matricula`

1. Anon registers an adult into **E2E Section B** (fee > 0).
2. Recorded `registration.received` mail has `/matricula/{token}` and names the package (matrícula and/or month).
3. Family opens the token: title/amount visible; Flow/MP may be absent (USD seed); **transfer** is present (seed already has `bank_transfer_instructions`).
4. Upload `receipt-tiny.png` → page shows receipt-pending copy.
5. Admin inbox: filter Comprobante / row shows receipt pending → approve + **Al día** → lead enrolled.
6. Student can log in with DNI password (same as `critical-registration`).

### 2. Assign schedule then pay

1. Anon registers **without** a section if the form allows “horario por asignar”; otherwise register then admin clears / uses needs_section by picking undecided if that control exists.
2. If the form always requires a section: register to B, admin does **not** use this journey — instead: register with no preferred section via the undecided option (`#rg-section` empty / “aún no sé”) when present.
3. Inbox **Falta sección**. Admin **Asignar** B (join disposition only if that action enrols; if it only writes the package, skip disposition).
4. Family mail or inbox pay link → `/matricula` amount for B → transfer receipt (or `$0` skip).

If the public form cannot submit without a section, **drop journey 2** and document that in the plan; do not invent a hidden API.

### 3. Accept No al día

Same as today’s register→accept on **Section A** (`$0`), but choose the **No al día / Behind** radio. Post-condition: student logs in; do **not** assert ledger months here (Vitest owns `applyJoinBillingDisposition`). This only proves the dialog cannot be skipped and `behind` enrols.

### 4. Trial convert (same plan, second task)

1. Seed `E2E Section Trial` with `offers_trial = true`, trial fee `0` or transfer-able amount, open cupo, schedule slot.
2. Anon `/register` intent trial (dual CTA) → book → success.
3. Admin marks the visit attended if the inbox requires it.
4. Family `/unirse/{token}` from recorded mail → sees join-package quote → transfer or `$0` enrol.
5. Skip if trial CTA is tenant-flagged off on `GE_DEV_TARGET=e2e` after 15 minutes of wiring — write that skip reason in the spec file comment, do not fake the journey.

## Harness

- Reuse `gotoIsolated`, `registerForm`, `chooseJoinBillingCurrent`, add `chooseJoinBillingBehind`.
- Reuse `e2e/fixtures/receipt-tiny.png` and the monthly-payment upload pattern.
- `extractMatriculaUrlFromHtml` from the schedule-offer helper (share the file; do not duplicate).
- Precommit reseeds `seed-admin.sql` — Tiny/B fees must be idempotent.
- No new Playwright **project** unless a spec cannot match `critical-registration.*`.

## Done when

1. Journey 1 green on isolated precommit.
2. Journey 3 green (behind accept).
3. Journey 2 green **or** explicitly dropped with a one-line reason in the plan.
4. Journey 4 green **or** skipped with a comment pointing at the tenant flag.
5. Existing `critical-registration.spec.ts` still green (Section A unchanged).
6. Warm `test:e2e:precommit` still ≤15 min.

## Out of scope

- Live MP/Flow, CMS, coupons, multi-locale, assistant (Phase 7).
- Schedule-offer journeys (other spec).
- Re-testing Phase 6 payments/events/academic.
- Questionnaires / NPS web (not an intake money path).
- Home-card counts.
