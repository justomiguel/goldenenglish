# Critical E2E — coverage roadmap (post–Phase 5a)

**Date:** 2026-07-12  
**Parent:** [critical-e2e-suite-design.md](./2026-07-12-critical-e2e-suite-design.md)  
**Status:** Phase 5b **shipped** (reject payment, ward email, create cohort) — next is Phase 6a when approved  
**Related:** runbook `docs/runbooks/e2e-isolated-harness.md`, phases 2b/3b → 5a

## Understanding

1. Precommit Playwright is **fail-closed** on the isolated Supabase stack (`npm run test:e2e:precommit`). Current warm run is ~**7 min / 26 tests** (over the original ≤4 min budget).
2. **Money / identity / academic / events** happy paths for receipt-only flows are largely covered.
3. Remaining risk ranks from the parent suite (12–15) plus several admin/portal surfaces have **zero** browser E2E.
4. Goal of this doc: **complete coverage plan** — what to add next, what stays nightly, what Vitest already owns.

## Current precommit map (done)

| Area | Spec(s) | Notes |
|------|---------|--------|
| Tours L3 anchors | `admin-tours` | `data-tour` only |
| Auth / role gates | `critical-auth` | admin/student/parent + student≠admin |
| Academic hub smoke | `critical-academic` | hub + cohort new-section control |
| Register → accept → login | `critical-registration` | inscriptions_enabled seed |
| Student receipt → approve → paid | `critical-payments` | no live MP/Flow |
| Parent receipt → approve | `critical-parent-payments` | ward due month |
| Create teacher | `critical-create-user` | |
| Create section | `critical-create-section` | heavy RSC; flaky if forced re-nav |
| Users spreadsheet import | `critical-users-import` | ImportUsers, not KV ImportStudents |
| Free event register | `critical-events` | |
| Paid event + transfer proof | `critical-paid-event` | |
| Section enroll | `critical-section-enroll` | `e2e-student-b` + schedule_slots |
| Event payment approve | `critical-event-payment-approve` | |
| Reject monthly receipt | `critical-payment-reject` | third due month |
| Parent ward email + step-up | `critical-parent-ward-email` | restores via seed DNI |
| Create cohort (UI) | `critical-create-cohort` | hard nav after create |

**Seed fixtures in use:** admin, student, student-b (unenrolled), parent, teacher, cohort, section A (+ schedule), due monthly payment, free + paid events.

## Gap analysis (by parent risk rank + product surface)

### Still open from original ranking

| Rank | Journey | Precommit? | Rationale |
|------|---------|------------|-----------|
| 1–2 remainder | Live MP / Flow checkout | **Nightly only** | Needs gateway sandbox + secrets; keep out of default precommit |
| 12 | Parent ward credential / email change | **Yes — Phase 5b** | Cross-account + step-up; high security |
| 13 | Collections / section bulk messaging | **Yes — Phase 5b or 6a** | Mass email blast risk |
| 14 | Site-setup / CMS publish | **Phase 6b** or nightly | Brand public surface; slower / asset-heavy |
| 15 | Event attendee destructive ops (remove / refund-ish) | **Phase 6a** | Data-loss path |

### High value not in original top-15 (recommend adding)

| Journey | Why | Phase |
|---------|-----|-------|
| **Reject / return** monthly payment receipt | Opposite of approve; ledger correctness | **5b** |
| **Create cohort** via UI (full, not tour-only) | Academic lifecycle start | **5b** |
| **Drop / unenroll** or section transfer | Inverse of enroll; billing edge | **6a** |
| **Attendance** mark once on section | Daily ops; soft money adjacent | **6a** |
| **Teacher** login → section view | Role matrix incomplete (no teacher storage) | **6a** |
| **Messaging** compose / send to one user | Staff↔family channel | **6b** |
| **Coupons or promotions** create + list | Revenue config | **6b** (one of them) |
| **Admin finance record payment** without receipt | Alternate ledger path | **6a** if UI stable |

### Covered enough by Vitest / skip E2E

| Area | Reason |
|------|--------|
| Billing math, parsers, import row schemas | Heavy Vitest already |
| Tour L1/L2 catalogs | Unit + RTL |
| Analytics event constants | Unit |
| Pure glossary / screen catalog | Unit |

### Explicit non-goals for “complete” precommit

- Full CMS visual regression / multi-tenant branding matrix (Manual QA / Lighthouse user-owned).
- Every sidebar screen deep CRUD (prefer **smoke open** only if we ever need it — prefer journeys over page inventory).
- Remounting KV `ImportStudents` long-job unless product remounts it (then nightly).
- Parallel workers >1 until suite is deterministic (keep `workers: 1`).

## Recommended phases

### Phase 5b — Security + ledger inverse + cohort create *(done)*

**Shipped:** `critical-payment-reject`, `critical-parent-ward-email`, `critical-create-cohort`. Warm full suite ~**7 min / 53 tests** (exit 0). Seed restores student email by DNI; adult DOB for payments access; hard nav after create cohort.

1. **Reject payment** — student uploads receipt → admin **rejects** → student sees rejected (third seeded due month).
2. **Parent ward sensitive change** — ward profile email + parent password step-up → Guardado.
3. **Create cohort** — academic hub → New cohort → lands on cohort detail.

**Out of 5b:** live gateways, attendance, bulk message, CMS.

### Phase 6a — Academic ops + destructive event + teacher

1. Attendance: open section attendance → mark one cell / save → persisted after refresh.
2. Unenroll or transfer student-b (or in-test enrollee) → roster status changes.
3. Event attendee: admin removes or cancels one paid/free attendee → gone from list (confirm modal, no native `confirm`).
4. Teacher storage in `auth.setup` → teacher lands on teacher hub / section.

### Phase 6b — Comms + light commerce config

1. Admin messages: send one internal/portal message to seeded student → student sees inbox item (or admin sent folder).
2. Collections bulk message **dry** path if product has preview; else skip to single-recipient send only.
3. Coupons **or** promotions: create one → appears in list.
4. Optional: CMS blog draft create **without** public publish; site-setup “next step” smoke only.

### Phase 7 — Nightly / optional (`E2E_SUITE=full` or CI night)

| Spec | Notes |
|------|--------|
| MP/Flow sandbox checkout | Secrets in CI only |
| Site-setup wizard complete + public homepage brand assert | Slow |
| ImportStudents long-job if remounted | SSE + KV |
| Multi-locale smoke (en/pt) on register + one admin page | |

Wire nightly via separate npm script; **do not** block default precommit.

## Timing / harness constraints

| Constraint | Action |
|------------|--------|
| Suite already ~7 min | Raise documented budget to **≤9 min warm / ≤12 min cold**; split Phase 6+ behind `E2E_SUITE=extended` if precommit pain returns |
| `.next-e2e` isolation | Keep; never wipe tenant `.next` |
| Section RSC cold compile | Avoid forced double `goto`; long timeouts on section detail |
| Reseed before precommit | Keep `seed-admin.sql` idempotent; Phase 5b fixtures must not break student due payment used by payments specs |

## Approaches

| Option | Verdict |
|--------|---------|
| A — Implement ranks 12–15 + all gaps in one PR | Reject — time + flake |
| B — Phase 5b then 6a/6b then nightly 7 | **Recommend** |
| C — Only expand tour anchors / sidebar opens | Reject as sole strategy — weak signal |

## Risks

| Risk | Mitigation |
|------|------------|
| Precommit too slow | Cap Phase 5b at 3 tests; move 6b/7 off default |
| Reject-payment races approve tests | Unique email/month or dedicated seed payment id |
| Ward email needs step-up + mail | Assert UI + audit path; Resend failures already non-blocking in E2E |
| Attendance UI dense | Prefer one deterministic cell + `data-tour`/`data-testid` if needed |

## Definition of done (this roadmap doc)

- [ ] User approves this roadmap (or a trimmed Phase 5b-only subset).
- [ ] On approval: write plan `docs/superpowers/plans/2026-07-12-critical-e2e-phase5b.md` and implement **Phase 5b only** (unless user asks for more).
- [ ] Update parent suite “Follow-ups” + runbook project table when 5b ships.
- [ ] Manual QA (user): optional visual pass on reject + ward change.

## Out of scope (this approval)

- Implementing Phase 6/7 in the same change unless explicitly requested.
- Softening `E2E_REQUIRE=1`.
- Rewriting Vitest.

## Open questions (confirm on approval)

1. **Phase 5b order preference:** reject-payment first, ward-credential first, or all three?
2. **Budget:** accept ~9 min warm precommit, or put create-cohort / ward behind `E2E_SUITE=extended`?
3. **Ward change:** is email-change the path to test, or password-only / skip if unstable?
