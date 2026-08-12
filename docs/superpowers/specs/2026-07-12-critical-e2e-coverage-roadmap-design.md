# Critical E2E — coverage roadmap (post–Phase 5a)

**Date:** 2026-07-12  
**Parent:** [critical-e2e-suite-design.md](./2026-07-12-critical-e2e-suite-design.md)  
**Status:** Phase 6 **shipped** (teacher, attendance, unenroll, event remove, record-payment, scholarship, messaging, collections-bulk, forgot-password, portal smokes) — Phase 7 still open (nightly)  
**Related:** runbook `docs/runbooks/e2e-isolated-harness.md`, phases 2b/3b → 6, design `2026-08-12-critical-e2e-phase6-full-coverage-design.md`

## Understanding

1. Precommit Playwright is **fail-closed** on the isolated Supabase stack (`npm run test:e2e:precommit`). Warm budget target **≤15 min** (full Phase 6 suite on default precommit).
2. **Money / identity / academic / events / teacher / comms** happy paths for receipt-only and dry-run flows are covered on precommit.
3. Remaining risk is mostly **nightly**: live gateways, CMS publish, coupons, multi-locale, assistant.
4. Goal of this doc: **complete coverage plan** — what shipped, what stays nightly.

## Current precommit map (done)

| Area | Spec(s) | Notes |
|------|---------|--------|
| Tours L3 anchors | `admin-tours`, `parent-tours` | `data-tour` only |
| Auth / role gates | `critical-auth`, `critical-teacher-auth` | admin/student/parent/teacher + finance deny |
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
| Section unenroll | `critical-section-unenroll` | drop student-b |
| Attendance mark | `critical-attendance` | persist after refresh |
| Event payment approve | `critical-event-payment-approve` | |
| Event attendee remove | `critical-event-attendee-remove` | pending bank-transfer path |
| Reject monthly receipt | `critical-payment-reject` | third due month |
| Record payment (no receipt) | `critical-record-payment` | fourth due month |
| Scholarship assign | `critical-scholarship` | section enrollment % |
| Parent ward email + step-up | `critical-parent-ward-email` | restores via seed DNI |
| Create cohort (UI) | `critical-create-cohort` | hard nav after create |
| Messaging | `critical-messaging` | admin → student inbox |
| Collections bulk | `critical-collections-bulk` | preview / degrade (no mass send) |
| Forgot password | `critical-forgot-password` | recorded-email link |
| Portal hub smokes | `portal-smoke-hubs` | parent/student/teacher landmarks |
| Enrollment link + anon | `section-enrollment-link`, privileges, anon hardening | post-5b surfaces |
| Student care | `critical-student-care` | care notes |

**Seed fixtures in use:** admin, student, student-b (unenrolled baseline), parent, teacher (+ `teacher.json` storage), cohort, section A (+ schedule), four due monthly payments, free + paid events.

## Gap analysis (by parent risk rank + product surface)

### Still open from original ranking

| Rank | Journey | Precommit? | Rationale |
|------|---------|------------|-----------|
| 1–2 remainder | Live MP / Flow checkout | **Nightly only** | Needs gateway sandbox + secrets; keep out of default precommit |
| 12 | Parent ward credential / email change | **Yes — Phase 5b** | Cross-account + step-up; high security |
| 13 | Collections / section bulk messaging | **Yes — Phase 6** | Preview/dry path on precommit |
| 14 | Site-setup / CMS publish | **Phase 7** nightly | Brand public surface; slower / asset-heavy |
| 15 | Event attendee destructive ops (remove / refund-ish) | **Yes — Phase 6** | Data-loss path |

### High value not in original top-15 (shipped in Phase 6)

| Journey | Why | Phase |
|---------|-----|-------|
| **Reject / return** monthly payment receipt | Opposite of approve; ledger correctness | **5b** |
| **Create cohort** via UI (full, not tour-only) | Academic lifecycle start | **5b** |
| **Drop / unenroll** or section transfer | Inverse of enroll; billing edge | **6** |
| **Attendance** mark once on section | Daily ops; soft money adjacent | **6** |
| **Teacher** login → section view | Role matrix incomplete (no teacher storage) | **6** |
| **Messaging** compose / send to one user | Staff↔family channel | **6** |
| **Admin finance record payment** without receipt | Alternate ledger path | **6** |
| **Scholarship** assign | Revenue config adjacent | **6** |
| **Forgot-password** via recording provider | Auth recovery | **6** |
| **Portal hub smokes** | Shell/routing for 3 roles | **6** |

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

**Shipped:** `critical-payment-reject`, `critical-parent-ward-email`, `critical-create-cohort`. Seed restores student email by DNI; adult DOB for payments access; hard nav after create cohort.

1. **Reject payment** — student uploads receipt → admin **rejects** → student sees rejected (third seeded due month).
2. **Parent ward sensitive change** — ward profile email + parent password step-up → Guardado.
3. **Create cohort** — academic hub → New cohort → lands on cohort detail.

**Out of 5b:** live gateways, attendance, bulk message, CMS.

### Phase 6 — Full coverage (6a + 6b + portal smokes) *(shipped)*

See `2026-08-12-critical-e2e-phase6-full-coverage-design.md`. All ten journeys + portal smokes on default precommit. Teacher `storageState`, fourth due month for record-payment, warm budget ≤15 min. `E2E_SUITE=extended` escape hatch documented but not wired while under budget.

### Phase 7 — Nightly / optional (`E2E_SUITE=full` or CI night) *(open)*

| Spec | Notes |
|------|--------|
| MP/Flow sandbox checkout | Secrets in CI only |
| Site-setup wizard complete + public homepage brand assert | Slow |
| ImportStudents long-job if remounted | SSE + KV |
| Multi-locale smoke (en/pt) on register + one admin page | |
| CMS blog draft (no public publish) + coupons/promotions | Asset-heavy / commerce config |
| Assistant role fixture + attendance smoke | New seed user |

Wire nightly via separate npm script; **do not** block default precommit.

## Timing / harness constraints

| Constraint | Action |
|------------|--------|
| Phase 6 suite | Documented warm budget **≤15 min**; split lightest three behind `E2E_SUITE=extended` if precommit pain returns |
| `.next-e2e` isolation | Keep; never wipe tenant `.next` |
| Section RSC cold compile | Avoid forced double `goto`; long timeouts on section detail |
| Reseed before precommit | Keep `seed-admin.sql` idempotent; due months must not collide across payment specs |

## Approaches

| Option | Verdict |
|--------|---------|
| A — Implement ranks 12–15 + all gaps in one PR | Reject — time + flake |
| B — Phase 5b then 6 then nightly 7 | **Recommend** (executed) |
| C — Only expand tour anchors / sidebar opens | Reject as sole strategy — weak signal |

## Risks

| Risk | Mitigation |
|------|------------|
| Precommit too slow | ≤15 min warm; `E2E_SUITE=extended` for 3 lightest specs if needed |
| Reject-payment races approve tests | Unique email/month or dedicated seed payment id |
| Ward email needs step-up + mail | Assert UI + audit path; Resend failures already non-blocking in E2E |
| Attendance UI dense | Prefer one deterministic cell + `data-tour`/`data-testid` if needed |

## Definition of done (this roadmap doc)

- [x] User approves this roadmap (or a trimmed Phase 5b-only subset).
- [x] Phase 5b shipped; Phase 6 design approved and shipped.
- [x] Update parent suite “Follow-ups” + runbook project table when 6 ships.
- [ ] Phase 7 nightly suite (separate effort).

## Out of scope (this approval)

- Implementing Phase 7 in the same change unless explicitly requested.
- Softening `E2E_REQUIRE=1`.
- Rewriting Vitest.
