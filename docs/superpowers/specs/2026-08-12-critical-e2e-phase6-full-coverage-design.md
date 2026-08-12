# Critical E2E — Phase 6 full coverage (precommit + Phase 7 nightly)

**Date:** 2026-08-12  
**Parent:** [critical-e2e-suite-design.md](./2026-07-12-critical-e2e-suite-design.md)  
**Roadmap:** [critical-e2e-coverage-roadmap-design.md](./2026-07-12-critical-e2e-coverage-roadmap-design.md)  
**Status:** Shipped  
**Related:** `docs/runbooks/e2e-isolated-harness.md`, rule `.cursor/rules/34-precommit-e2e.mdc`

## Intent

Close the remaining high-value **browser journey** gaps after Phase 5b and post-5b specs (section enrollment links, student care, anon privilege hardening). Prefer **mutations + post-condition UI** over sidebar page inventory. Tours (`admin-tours` / `parent-tours`) already cover `data-tour` presence.

## Current state (baseline)

| Layer | Notes |
|-------|--------|
| Precommit Playwright | Full Phase 6 suite on default gate; warm budget **≤15 min** (measured ~**2.0 min** / 114 tests); cold `next build` ~7 min |
| Strong | Auth roles (incl. teacher storage), register→accept, invite link, payments approve/reject/record, scholarship, parent payments/ward email, cohort/section/enroll/unenroll, attendance, events free/paid/approve/remove, messaging, collections bulk preview, forgot-password, portal hub smokes, users import, student care, anon privilege |
| Weak | (none for Phase 6 scope — remaining gaps are Phase 7 nightly) |
| Nightly (Phase 7 — open) | Live MP/Flow, CMS publish, coupons, multi-locale, assistant |

## Approaches (delivery)

| Option | Verdict |
|--------|---------|
| A — Big bang single PR (all specs + nightly) | Reject — flake + review size |
| B — Wave PRs: harness → 6a journeys → 6b/comms → portal smokes; Phase 7 later | **Recommend** |
| C — Portal smoke inventory only | Reject as sole strategy |

**User decision:** Implement **all Phase 6 journeys + portal smokes on default precommit**. Phase 7 stays nightly / `E2E_SUITE=full` only.

## Scope — precommit specs

| Spec file | Journey | Auth | Post-condition |
|-----------|---------|------|----------------|
| `critical-teacher-auth.spec.ts` | Teacher storage → teacher hub; cannot open admin finance | teacher | URL on `/dashboard/teacher`; finance denied |
| `critical-attendance.spec.ts` | Open section attendance → mark one cell → save → refresh | admin or teacher | Same cell still marked |
| `critical-section-unenroll.spec.ts` | Drop enrollee (prefer `student-b` or in-spec enrollee) | admin | Roster `dropped` (or not on active) |
| `critical-event-attendee-remove.spec.ts` | Remove attendee allowed by `canDeleteEventAttendee` | admin | Gone from list (app confirm modal, not native `confirm`) |
| `critical-record-payment.spec.ts` | Admin records payment **without** receipt | admin | Ledger/student shows paid for that month |
| `critical-messaging.spec.ts` | Admin compose → student inbox | admin + student | Inbox item visible; optional recorded-email assert |
| `critical-collections-bulk.spec.ts` | Collections section → bulk message **preview/dry** | admin | Preview/recipients UI; no real mass send. If no dry-run: degrade to compose with recipients prefilled |
| `critical-forgot-password.spec.ts` | Request reset → recorded email link → reset form | anon | Form accepts token path; fixture restored by reseed |
| `critical-scholarship.spec.ts` | Assign % scholarship on section enrollment | admin | Badge / amount visible |
| `portal-smoke-hubs.spec.ts` | Home + 2–3 deep links per parent/student/teacher | 3 roles | One stable landmark each; **no mutations** |

## Harness changes

1. **`auth.setup.ts`** — also login `E2E_TEACHER_EMAIL` → `e2e/.auth/teacher.json`.
2. **`e2eAuthPaths()`** — add `teacherStorageState`.
3. **`playwright.config.ts`** — one project per new spec (forgot-password without admin storage; messaging may use multi-context like registration).
4. **Seed (`seed-admin.sql`)** — fourth distinct due month (or dedicated student) for record-payment so it never races current / parent / reject months. Keep idempotent restore.
5. **Selectors** — dictionary labels, roles, existing `data-tour`; add `data-testid` only where no stable hook exists.
6. **Email** — keep `RecordingEmailProvider` + `/api/e2e/recorded-emails` for messaging and forgot-password.
7. **Budget** — document warm target **≤15 min** for full precommit including new specs. Escape hatch: if exceeded, move `portal-smoke-hubs` + `critical-scholarship` + `critical-collections-bulk` behind `E2E_SUITE=extended` (code still ships; gate documents the split). Do **not** soften `E2E_REQUIRE=1`.

## Architecture notes

- Reuse `gotoIsolated`, isolation guards (`e2e/env.ts`), reseed-before-precommit.
- `workers: 1`; no parallel fixture contention.
- Unenroll ordering: run after or independently of `critical-section-enroll`; prefer drop of a student that payments specs do not require active, or re-enroll inside the unenroll spec then drop.
- Event remove: use pending bank-transfer attendee path per `canDeleteEventAttendee`.
- Attendance: one deterministic cell; avoid remounting whole matrix unless product requires it.
- Portal smokes are **not** a substitute for journeys; they only catch shell/routing regressions tours miss for teacher/student.

## Phase 7 — nightly only (out of this implementation effort unless requested later)

| Spec | Notes |
|------|--------|
| MP / Flow sandbox checkout | Secrets in CI only |
| CMS blog draft (no public publish) + site-setup smoke | Asset-heavy |
| Coupons or promotions create → list | Commerce config |
| Multi-locale smoke (en/pt) | Register + one admin page |
| Assistant role fixture + attendance smoke | New seed user |

Wire via separate npm script / `E2E_SUITE=full`; **do not** block default precommit.

## Explicit non-goals

- Softening fail-closed E2E gate.
- Full CMS visual regression / multi-tenant branding matrix.
- Every sidebar screen deep CRUD.
- ImportStudents long-job unless product remounts it.
- Live payment gateways on precommit.
- Rewriting Vitest suites (unit/RTL stay owners of math, parsers, tour catalogs).

## Risks

| Risk | Mitigation |
|------|------------|
| Precommit too slow | ≤15 min warm budget; extended escape for 3 lightest specs |
| Due-month collisions | Fourth seeded month / dedicated student for record-payment |
| Enroll/unenroll fixture races | Reseed; isolated enrollee; ordering notes in plan |
| Attendance UI flake | Single cell + tour anchor / testid |
| Collections without dry-run | Degrade to prefilled compose; never assert Resend delivery |
| Forgot-password mutates auth user | Reseed restores; unique request per run |
| Teacher storage cold login | Same retry pattern as admin/student/parent in setup |

## Definition of done

1. All ten precommit specs above green via `npm run test:e2e:precommit` (or documented `E2E_SUITE=extended` split if budget forces it). ✅
2. Teacher `storageState` + seed due-month (if needed) idempotent. ✅
3. Projects wired in `playwright.config.ts`. ✅
4. Runbook project table + parent suite Follow-ups updated; roadmap Phase 6 marked shipped when done. ✅
5. Phase 7 listed only (not implemented in the same effort unless user asks). ✅

## Implementation waves (for the plan)

1. **Harness** — teacher storage + seed due month + env paths.
2. **6a journeys** — teacher-auth, attendance, unenroll, event-attendee-remove.
3. **6b journeys** — record-payment, messaging, collections-bulk, forgot-password, scholarship.
4. **Portal smokes** — `portal-smoke-hubs`.
5. **Docs** — runbook + roadmap status.

Ship green incrementally; prefer multiple PRs over one mega-diff.

## Out of scope (this approval)

- Implementing Phase 7 nightly suite in the same change set.
- Changing Vitest coverage policy.
- Softening `E2E_REQUIRE=1` / `SKIP_E2E` culture.
